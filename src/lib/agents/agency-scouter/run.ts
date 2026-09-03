import type { AgentContext, AgentResult } from "../framework";
import { scrapeWebsite } from "../agency-updater/sources/website-scrape";
import { firecrawlSearch, type SearchHit } from "./sources/firecrawl-search";
import { discoverCandidatesFromPage, type DiscoveredCandidate } from "./sources/discover-candidates";
import { classifyAgencyHomepage } from "./sources/classify-agency";
import { buildDedupIndex, checkDedup } from "./dedup";
import { isDirectoryOrSocialDomain, normalizeAgencyName, normalizeDomain, normalizeUrl } from "./domain";

const MAX_CANDIDATES = 20; // hard cap per non sforare timeout Hobby (300s)
const MAX_SOURCES = 10;
const MAX_KEYWORDS = 5;
const SEARCH_LIMIT_PER_KEYWORD = 8;
// Budget SERP totali per run (Firecrawl free = 10/min, ogni chiamata attende 7s).
// 6 keyword-search + 2 fallback per candidati = ~56s min waste per throttle.
const MAX_SERP_CALLS = 8;

export interface ScouterPayload {
  directory_urls?: string[];
  award_urls?: string[];
  magazine_urls?: string[];
  keywords?: string[];
  geographic_scope?: string; // "Italia", "Lombardia", "Milano"
  search_languages?: string[]; // ["it", "en"]
  additional_filters?: string; // free text passato all'LLM come contesto
}

type SourceType = "directory" | "award" | "magazine" | "serp";

interface RawCandidate {
  name: string;
  url_hint: string | null;
  source_type: SourceType;
  source_name: string;
  source_url: string;
  discovery_keyword: string | null;
}

interface OutcomeAgency {
  agency_name: string;
  official_website: string | null;
  normalized_domain: string | null;
  country: string | null;
  city: string | null;
  sources: Array<{
    source_type: SourceType;
    source_name: string;
    source_url: string;
    discovery_keyword: string | null;
  }>;
  official_evidence_url: string | null;
  status: "VERIFIED_NEW" | "DUPLICATE" | "REVIEW_REQUIRED" | "REJECTED";
  notes: string | null;
  database_action: "INSERT" | "NONE";
}

function parseArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((s) => s.trim());
}

function keywordVariants(kw: string, geo: string | undefined): string[] {
  const base = kw.trim();
  // Solo 2 varianti per contenere il rate limit Firecrawl (10 req/min free).
  // Se serve più copertura, l'utente può eseguire più scouting run.
  if (geo) return [`${base} ${geo}`, `migliori ${base} ${geo}`];
  return [base, `migliori ${base}`];
}

// Chiave di merge dei candidati.
// Se url_hint punta a una directory (es. sortlist.es/agency/xxx) NON possiamo
// usarlo come identificatore univoco perché tutti collassano su un unico
// dominio directory. In quel caso torniamo al nome normalizzato.
function candidateKey(name: string, urlHint: string | null): string {
  const d = normalizeDomain(urlHint);
  if (d && !isDirectoryOrSocialDomain(d)) return `d:${d}`;
  return `n:${normalizeAgencyName(name)}`;
}

export async function runAgencyScouter(ctx: AgentContext): Promise<AgentResult> {
  const payload = ctx.payload as ScouterPayload;
  const domainId = ctx.filters.domainId;

  ctx.log("start", { payload, domainId });

  if (!domainId) {
    ctx.log("no_domain");
    return {
      status: "error",
      rowsProcessed: 0,
      rowsSuccess: 0,
      rowsError: 0,
      meta: { error: "domain_id required" },
    };
  }
  if (!process.env.OPENAI_API_KEY) {
    return {
      status: "error",
      rowsProcessed: 0,
      rowsSuccess: 0,
      rowsError: 0,
      meta: { error: "OPENAI_API_KEY missing" },
    };
  }

  const directoryUrls = parseArr(payload.directory_urls).slice(0, MAX_SOURCES);
  const awardUrls = parseArr(payload.award_urls).slice(0, MAX_SOURCES);
  const magazineUrls = parseArr(payload.magazine_urls).slice(0, MAX_SOURCES);
  const keywords = parseArr(payload.keywords).slice(0, MAX_KEYWORDS);
  const geo = typeof payload.geographic_scope === "string" ? payload.geographic_scope.trim() : "";
  const lang = payload.search_languages?.[0] ?? "it";

  const totalSources = directoryUrls.length + awardUrls.length + magazineUrls.length + keywords.length;
  if (totalSources === 0) {
    ctx.log("no_sources");
    return {
      status: "error",
      rowsProcessed: 0,
      rowsSuccess: 0,
      rowsError: 0,
      meta: { error: "Nessuna fonte fornita (directory_urls/award_urls/magazine_urls/keywords)" },
    };
  }

  const errors: Array<{ source_url: string; error_type: string; message: string }> = [];
  const rawCandidates = new Map<string, RawCandidate>();
  let serpCallsUsed = 0;

  // ---- 1. Scrape URL fonti (directory + award + magazine) ----
  const urlSources: Array<{ url: string; type: SourceType }> = [
    ...directoryUrls.map((u) => ({ url: u, type: "directory" as const })),
    ...awardUrls.map((u) => ({ url: u, type: "award" as const })),
    ...magazineUrls.map((u) => ({ url: u, type: "magazine" as const })),
  ];
  for (const src of urlSources) {
    try {
      // fullContent=true → non usiamo readability, così le card di elenco
      // (agency-cards di Sortlist/Clutch/riviste) restano nel testo.
      const scraped = await scrapeWebsite(src.url, { fullContent: true });
      const found = await discoverCandidatesFromPage(scraped, src.type);
      ctx.log("source_scraped", { url: src.url, type: src.type, found: found.length });
      for (const c of found) {
        const key = candidateKey(c.name, c.url_hint);
        const existing = rawCandidates.get(key);
        if (existing) {
          // Aggiungi fonte in più (merge)
          rawCandidates.set(key, existing);
        } else {
          rawCandidates.set(key, {
            name: c.name,
            url_hint: c.url_hint,
            source_type: src.type,
            source_name: new URL(src.url).hostname,
            source_url: src.url,
            discovery_keyword: null,
          });
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ source_url: src.url, error_type: "scrape_or_extract", message: msg });
      ctx.log("source_error", { url: src.url, error: msg });
    }
  }

  // ---- 2. SERP via Firecrawl search ----
  outerKw: for (const kw of keywords) {
    const variants = keywordVariants(kw, geo);
    for (const q of variants) {
      if (serpCallsUsed >= MAX_SERP_CALLS) {
        ctx.log("serp_budget_exhausted", { limit: MAX_SERP_CALLS });
        break outerKw;
      }
      try {
        serpCallsUsed++;
        const hits: SearchHit[] = await firecrawlSearch(q, {
          limit: SEARCH_LIMIT_PER_KEYWORD,
          lang,
          country: lang, // ok per it/es/de/fr
        });
        ctx.log("serp_ok", { query: q, hits: hits.length });
        for (const h of hits) {
          const domain = normalizeDomain(h.url);
          if (!domain || isDirectoryOrSocialDomain(domain)) continue;
          // Usiamo il title dei risultati come nome tentativo (verrà rifinito dall'LLM classifier)
          const name = (h.title || domain).replace(/[|·—-].*$/g, "").trim();
          if (!name) continue;
          const key = candidateKey(name, h.url);
          if (!rawCandidates.has(key)) {
            rawCandidates.set(key, {
              name,
              url_hint: h.url,
              source_type: "serp",
              source_name: "google_serp",
              source_url: h.url,
              discovery_keyword: q,
            });
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push({ source_url: `serp:${q}`, error_type: "firecrawl_search", message: msg });
        ctx.log("serp_error", { query: q, error: msg });
      }
    }
  }

  const candidates = Array.from(rawCandidates.values()).slice(0, MAX_CANDIDATES);
  ctx.log("candidates_collected", {
    total_raw: rawCandidates.size,
    processing: candidates.length,
  });

  // ---- 3. Dedup index dal DB ----
  const dedupIndex = await buildDedupIndex(ctx.supabase, domainId);
  ctx.log("dedup_index_built", { existing_agencies: dedupIndex.byDomain.size });

  // ---- 4. Verify + classify + dedup + insert ----
  const outcomes: OutcomeAgency[] = [];
  let inserted = 0;
  let verified = 0;
  let duplicates = 0;
  let review = 0;
  let rejected = 0;

  for (const cand of candidates) {
    const outcome: OutcomeAgency = {
      agency_name: cand.name,
      official_website: null,
      normalized_domain: null,
      country: null,
      city: null,
      sources: [
        {
          source_type: cand.source_type,
          source_name: cand.source_name,
          source_url: cand.source_url,
          discovery_keyword: cand.discovery_keyword,
        },
      ],
      official_evidence_url: null,
      status: "REJECTED",
      notes: null,
      database_action: "NONE",
    };

    // 4a. Trova sito ufficiale
    let officialUrl: string | null = cand.url_hint;
    if (officialUrl) {
      const d = normalizeDomain(officialUrl);
      if (!d || isDirectoryOrSocialDomain(d)) officialUrl = null;
    }
    if (!officialUrl) {
      if (serpCallsUsed >= MAX_SERP_CALLS) {
        outcome.notes = `Sito ufficiale non disponibile e budget SERP esaurito (${MAX_SERP_CALLS}/run)`;
        outcome.status = "REVIEW_REQUIRED";
        review++;
        outcomes.push(outcome);
        continue;
      }
      // fallback: SERP query "nome + città"
      try {
        serpCallsUsed++;
        const searchQ = geo ? `${cand.name} ${geo}` : cand.name;
        const hits = await firecrawlSearch(searchQ, { limit: 5, lang, country: lang });
        const first = hits.find((h) => {
          const d = normalizeDomain(h.url);
          return d && !isDirectoryOrSocialDomain(d);
        });
        officialUrl = first?.url ?? null;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        outcome.notes = `Ricerca sito ufficiale fallita: ${msg}`;
      }
    }
    if (!officialUrl) {
      outcome.notes = outcome.notes ?? "Sito ufficiale non identificabile";
      rejected++;
      outcomes.push(outcome);
      continue;
    }

    const cleanUrl = normalizeUrl(officialUrl);
    const cleanDomain = normalizeDomain(officialUrl);
    if (!cleanUrl || !cleanDomain) {
      outcome.notes = "URL non normalizzabile";
      rejected++;
      outcomes.push(outcome);
      continue;
    }
    outcome.official_website = cleanUrl;
    outcome.normalized_domain = cleanDomain;

    // 4b. Dedup PRIMA di scrapare (risparmio calls)
    const dedup = checkDedup(dedupIndex, cand.name, cleanDomain);
    if (dedup.kind === "duplicate") {
      outcome.status = "DUPLICATE";
      outcome.notes = `Già presente in DB (id ${dedup.existing.id})`;
      duplicates++;
      outcomes.push(outcome);
      continue;
    }

    // 4c. Verify + classify
    let scraped;
    try {
      scraped = await scrapeWebsite(cleanUrl);
      outcome.official_evidence_url = scraped.final_url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      outcome.notes = `Sito non raggiungibile: ${msg}`;
      rejected++;
      outcomes.push(outcome);
      continue;
    }

    const classification = await classifyAgencyHomepage(scraped, cand.name, geo || null);
    if (!classification) {
      outcome.notes = "Classificazione LLM fallita";
      rejected++;
      outcomes.push(outcome);
      continue;
    }
    outcome.city = classification.location.city;
    outcome.country = classification.location.country;

    if (!classification.is_agency || !classification.in_scope) {
      outcome.status = "REJECTED";
      outcome.notes = `Non pertinente: ${classification.exclusion_reason ?? "not_agency"}`;
      rejected++;
      outcomes.push(outcome);
      continue;
    }

    // Enforcement geo scope: se richiesto, sede DEVE essere verificabile e nel perimetro.
    if (geo) {
      if (classification.matches_geo_scope !== true) {
        outcome.status = "REJECTED";
        outcome.notes = `Fuori scope geografico "${geo}" (sede: ${
          classification.location.city ?? "?"
        }, ${classification.location.country ?? "?"})`;
        rejected++;
        outcomes.push(outcome);
        continue;
      }
      if (!classification.location.country && !classification.location.city) {
        outcome.status = "REJECTED";
        outcome.notes = `Nessun indirizzo verificabile nel sito — scope "${geo}" richiede sede esplicita`;
        rejected++;
        outcomes.push(outcome);
        continue;
      }
    }

    if (classification.confidence === "low") {
      outcome.status = "REVIEW_REQUIRED";
      outcome.notes = "Classificazione a bassa confidenza — revisione manuale";
      review++;
      outcomes.push(outcome);
      continue;
    }

    if (dedup.kind === "review") {
      outcome.status = "REVIEW_REQUIRED";
      outcome.notes = dedup.reason;
      review++;
      outcomes.push(outcome);
      continue;
    }

    // 4d. INSERT
    verified++;
    const finalName = classification.official_name ?? cand.name;
    const insertRow = {
      domain_id: domainId,
      title: finalName,
      title_originale: finalName,
      sito_web: cleanUrl,
      slug: null, // il DB non ha default, ma è nullable
      publish_status: "draft",
      status_curatela: "proposta",
      competenze_principali:
        classification.primary_services.length > 0
          ? classification.primary_services.slice(0, 5)
          : null,
      citta: classification.location.city ? classification.location.city.toLowerCase() : null,
      note_curatore: `Scoutato da ${cand.source_type}: ${cand.source_url}${
        cand.discovery_keyword ? ` (keyword: ${cand.discovery_keyword})` : ""
      }`,
    };
    const { error: insErr, data: insData } = await ctx.supabase
      .from("agencies")
      .insert(insertRow)
      .select("id")
      .single();
    if (insErr) {
      outcome.status = "REVIEW_REQUIRED";
      outcome.notes = `INSERT fallito: ${insErr.message}`;
      review++;
      outcomes.push(outcome);
      continue;
    }
    // Aggiungi al dedup index così successivi candidati con lo stesso dominio nello stesso run non duplicano
    dedupIndex.byDomain.set(cleanDomain, {
      id: (insData as { id: string }).id,
      title: finalName,
      sito_web: cleanUrl,
    });
    outcome.status = "VERIFIED_NEW";
    outcome.database_action = "INSERT";
    inserted++;
    outcomes.push(outcome);
  }

  const summary = {
    sources_analyzed: totalSources,
    candidates_found: rawCandidates.size,
    verified_new: verified,
    inserted,
    duplicates,
    review_required: review,
    rejected,
  };

  ctx.log("batch_complete", summary);

  return {
    status: errors.length > 0 && inserted === 0 ? "error" : errors.length > 0 ? "partial" : "success",
    rowsProcessed: candidates.length,
    rowsSuccess: inserted,
    rowsError: errors.length + rejected,
    meta: {
      run_summary: summary,
      agencies: outcomes,
      errors,
    },
  };
}
