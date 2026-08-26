import type { AgentContext, AgentResult } from "../framework";
import { fetchPageWithFallback, fetchPage, findTeamPageLinks } from "./sources/fetch-page";
import { classifyVisuals, type ImageCandidate } from "./sources/classify-visuals";
import { downloadImage, uploadToStorage } from "./storage";
import { extFromMime, extFromUrl, slugify, shortHash } from "./utils";

const BATCH_SIZE = 5; // hard cap (fetch + N pagine team + N downloads/upload = pesante)
const MAX_TEAM_IMAGES = 3;
const MIN_IMAGE_WIDTH = 400; // meno restrittivo del 800 spec: molti loghi ufficiali sono <800
const MIN_IMAGE_HEIGHT = 100;
const MIN_LOGO_CONFIDENCE = 0.85;
const MIN_TEAM_CONFIDENCE = 0.85;
const REFRESH_DAYS = 30;

interface AgencyRow {
  id: string;
  title: string;
  sito_web: string | null;
  logo_url: string | null;
  photos: unknown;
  visual_enriched_at: string | null;
  citta: string | null;
}

interface TeamPhotoRecord {
  public_url: string;
  file_name: string;
  mime_type: string;
  width: number | null;
  height: number | null;
  alt_text: string;
  description: string;
  source_url: string;
  source_page_url: string;
  team_confidence: number;
  uploaded_at: string;
}

interface LogoMeta {
  file_name: string;
  mime_type: string;
  width: number | null;
  height: number | null;
  alt_text: string;
  description: string;
  source_url: string;
  confidence: number;
  updated_at: string;
}

interface OutcomeAgency {
  agency_id: string;
  agency_name: string;
  official_website: string | null;
  logo: {
    original_source_url: string | null;
    public_url: string | null;
    file_name: string | null;
    mime_type: string | null;
    width: number | null;
    height: number | null;
    alt_text: string | null;
    description: string | null;
    status: "UPLOADED" | "ALREADY_PRESENT" | "REVIEW_REQUIRED" | "NOT_FOUND" | "ERROR";
    confidence: number;
    notes: string | null;
  };
  team_images: Array<{
    original_source_url: string;
    source_page_url: string;
    public_url: string | null;
    file_name: string;
    mime_type: string;
    width: number | null;
    height: number | null;
    alt_text: string;
    description: string;
    team_confidence: number;
    status: "UPLOADED_AS_TEAM" | "REVIEW_REQUIRED" | "REJECTED" | "DUPLICATE" | "ERROR";
    notes: string | null;
  }>;
  database_action: "UPDATED" | "PARTIALLY_UPDATED" | "NO_CHANGE" | "MANUAL_REVIEW" | "ERROR";
}

async function pickAgencies(ctx: AgentContext): Promise<AgencyRow[] | null> {
  const { agencyIds, domainId } = ctx.filters;
  const SELECT = "id, title, sito_web, logo_url, photos, visual_enriched_at, citta";

  // Selezione manuale: ids espliciti
  if (agencyIds && agencyIds.length > 0) {
    const capped = agencyIds.slice(0, BATCH_SIZE);
    const { data, error } = await ctx.supabase
      .from("agencies")
      .select(SELECT)
      .in("id", capped)
      .returns<AgencyRow[]>();
    if (error) {
      ctx.log("select_error", { error: error.message });
      return null;
    }
    return data ?? [];
  }

  // Filtro dominio
  if (!domainId) {
    ctx.log("no_filter", { hint: "richiede domain_id o agency_ids" });
    return null;
  }
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - REFRESH_DAYS);
  const { data, error } = await ctx.supabase
    .from("agencies")
    .select(SELECT)
    .eq("domain_id", domainId)
    .not("sito_web", "is", null)
    .neq("publish_status", "trash")
    .or(`visual_enriched_at.is.null,visual_enriched_at.lt.${cutoff.toISOString()}`)
    .order("visual_enriched_at", { ascending: true, nullsFirst: true })
    .limit(BATCH_SIZE)
    .returns<AgencyRow[]>();
  if (error) {
    ctx.log("select_error", { error: error.message });
    return null;
  }
  return data ?? [];
}

function buildAltDescriptions(agencyName: string, city: string | null) {
  return {
    logoAlt: `Logo di ${agencyName}`,
    logoDesc: `Logo ufficiale dell'agenzia ${agencyName}.`,
    teamAlt: city ? `Team di ${agencyName} — sede ${city}` : `Team di ${agencyName}`,
    teamDesc: `Fotografia ufficiale del team di ${agencyName}.`,
  };
}

export async function runAgencyVisualEnrichment(ctx: AgentContext): Promise<AgentResult> {
  ctx.log("start", {
    filters: ctx.filters,
    batch_size: BATCH_SIZE,
    max_team: MAX_TEAM_IMAGES,
  });

  if (!process.env.OPENAI_API_KEY) {
    return {
      status: "error",
      rowsProcessed: 0,
      rowsSuccess: 0,
      rowsError: 0,
      meta: { error: "OPENAI_API_KEY missing" },
    };
  }

  const agencies = await pickAgencies(ctx);
  if (agencies === null) {
    return { status: "error", rowsProcessed: 0, rowsSuccess: 0, rowsError: 0 };
  }
  if (agencies.length === 0) {
    ctx.log("no_agencies");
    return { status: "success", rowsProcessed: 0, rowsSuccess: 0, rowsError: 0 };
  }

  ctx.log("batch_selected", { count: agencies.length });

  const outcomes: OutcomeAgency[] = [];
  const errors: Array<{ agency_id: string; asset_type: string; source_url: string | null; error_type: string; message: string }> = [];
  let logosUploaded = 0;
  let logosAlreadyPresent = 0;
  let logosNotFound = 0;
  let teamUploaded = 0;
  let sentToReview = 0;
  let errCount = 0;
  let successCount = 0;

  for (const agency of agencies) {
    const outcome: OutcomeAgency = {
      agency_id: agency.id,
      agency_name: agency.title,
      official_website: agency.sito_web,
      logo: {
        original_source_url: null,
        public_url: null,
        file_name: null,
        mime_type: null,
        width: null,
        height: null,
        alt_text: null,
        description: null,
        status: "NOT_FOUND",
        confidence: 0,
        notes: null,
      },
      team_images: [],
      database_action: "NO_CHANGE",
    };

    if (!agency.sito_web) {
      outcome.logo.status = "ERROR";
      outcome.logo.notes = "sito_web mancante";
      outcome.database_action = "ERROR";
      errCount++;
      outcomes.push(outcome);
      continue;
    }

    const { logoAlt, logoDesc, teamAlt, teamDesc } = buildAltDescriptions(agency.title, agency.citta);
    const slug = slugify(agency.title) || `agency-${agency.id.slice(0, 8)}`;

    // ---- 1. Fetch homepage (native → fallback Firecrawl)
    const homeOutcome = await fetchPageWithFallback(agency.sito_web);
    if (!homeOutcome.page) {
      outcome.logo.status = "ERROR";
      outcome.logo.notes = `Homepage non raggiungibile: ${homeOutcome.error ?? "unknown"}`;
      outcome.database_action = "ERROR";
      errors.push({
        agency_id: agency.id,
        asset_type: "LOGO",
        source_url: agency.sito_web,
        error_type: "fetch_homepage",
        message: homeOutcome.error ?? "unknown",
      });
      ctx.log("fetch_home_failed", { agencyId: agency.id, url: agency.sito_web, error: homeOutcome.error });
      errCount++;
      outcomes.push(outcome);
      continue;
    }
    const home = homeOutcome.page;
    ctx.log("home_fetched", { agencyId: agency.id, source: homeOutcome.source });

    // ---- 2. Fetch team/about pages (max 2)
    const teamLinks = findTeamPageLinks(home.links_internal);
    const teamPages = [];
    for (const link of teamLinks.slice(0, 2)) {
      const p = await fetchPage(link);
      if (p) teamPages.push(p);
    }

    // ---- 3. Merge candidate images from all pages
    const candidates: ImageCandidate[] = [];
    for (const img of home.images) {
      candidates.push({ ...img, page_url: home.final_url, page_role: "home" });
    }
    // og:image + json-ld logo come candidates virtuali (senza contesto DOM)
    if (home.og_image) {
      candidates.push({
        src: home.og_image,
        alt: null,
        in_header: false,
        in_footer: false,
        in_nav: false,
        surrounding_text: "og:image",
        page_url: home.final_url,
        page_role: "home",
      });
    }
    if (home.json_ld_logo) {
      candidates.push({
        src: home.json_ld_logo,
        alt: null,
        in_header: false,
        in_footer: false,
        in_nav: false,
        surrounding_text: "JSON-LD Organization.logo",
        page_url: home.final_url,
        page_role: "home",
      });
    }
    for (const page of teamPages) {
      for (const img of page.images) {
        candidates.push({ ...img, page_url: page.final_url, page_role: "team_about" });
      }
    }

    // Dedup per src
    const uniq = new Map<string, ImageCandidate>();
    for (const c of candidates) if (!uniq.has(c.src)) uniq.set(c.src, c);
    const uniqueCandidates = Array.from(uniq.values());
    ctx.log("candidates_extracted", { agencyId: agency.id, count: uniqueCandidates.length });

    if (uniqueCandidates.length === 0) {
      outcome.logo.status = "NOT_FOUND";
      outcome.logo.notes = "Nessuna immagine estraibile";
      outcome.database_action = "NO_CHANGE";
      logosNotFound++;
      outcomes.push(outcome);
      continue;
    }

    // ---- 4. LLM classify
    const classification = await classifyVisuals(agency.title, uniqueCandidates);
    if (!classification) {
      outcome.logo.status = "ERROR";
      outcome.logo.notes = "Classificazione LLM fallita";
      outcome.database_action = "ERROR";
      errCount++;
      outcomes.push(outcome);
      continue;
    }

    // ---- 5. LOGO: scegli il migliore con confidence >= MIN_LOGO_CONFIDENCE
    const logoTop = classification.logos
      .filter((l) => l.is_logo && l.confidence >= MIN_LOGO_CONFIDENCE)
      .sort((a, b) => b.confidence - a.confidence)[0];

    const dbUpdates: Record<string, unknown> = {
      visual_enriched_at: new Date().toISOString(),
      visual_enrichment_status: "success",
    };
    let logoChanged = false;
    let anyTeamChanged = false;

    if (logoTop) {
      outcome.logo.original_source_url = logoTop.src;
      outcome.logo.confidence = logoTop.confidence;
      outcome.logo.alt_text = logoAlt;
      outcome.logo.description = logoDesc;

      // Se logo esistente ha già lo stesso original_source_url, skip
      const existingLogoUrl = agency.logo_url ?? null;
      const existingLogoSource = (extractLogoMetaField(agency, "source_url") as string | null) ?? null;
      if (existingLogoUrl && existingLogoSource === logoTop.src) {
        outcome.logo.status = "ALREADY_PRESENT";
        outcome.logo.public_url = existingLogoUrl;
        logosAlreadyPresent++;
      } else {
        const downloaded = await downloadImage(logoTop.src);
        if (!downloaded) {
          outcome.logo.status = "ERROR";
          outcome.logo.notes = "Download logo fallito";
          errors.push({ agency_id: agency.id, asset_type: "LOGO", source_url: logoTop.src, error_type: "download", message: "fetch fallito" });
        } else {
          const ext = extFromMime(downloaded.mime_type) ?? extFromUrl(logoTop.src) ?? "png";
          const hash = shortHash(logoTop.src);
          const fileName = `logo-${slug}-${hash}.${ext}`;
          const path = `logos/${fileName}`;
          const up = await uploadToStorage(ctx.supabase, path, downloaded.buffer, downloaded.mime_type);
          if ("error" in up) {
            outcome.logo.status = "ERROR";
            outcome.logo.notes = `Upload fallito: ${up.error}`;
            errors.push({ agency_id: agency.id, asset_type: "LOGO", source_url: logoTop.src, error_type: "upload", message: up.error });
          } else {
            outcome.logo.status = "UPLOADED";
            outcome.logo.public_url = up.public_url;
            outcome.logo.file_name = fileName;
            outcome.logo.mime_type = downloaded.mime_type;
            outcome.logo.width = downloaded.width;
            outcome.logo.height = downloaded.height;
            logosUploaded++;
            logoChanged = true;

            const logoMeta: LogoMeta = {
              file_name: fileName,
              mime_type: downloaded.mime_type,
              width: downloaded.width,
              height: downloaded.height,
              alt_text: logoAlt,
              description: logoDesc,
              source_url: logoTop.src,
              confidence: logoTop.confidence,
              updated_at: new Date().toISOString(),
            };
            dbUpdates.logo_url = up.public_url;
            dbUpdates.logo_meta = logoMeta;
          }
        }
      }
    } else {
      // No logo con confidence sufficiente
      const reviewLogo = classification.logos.filter((l) => l.confidence >= 0.6).sort((a, b) => b.confidence - a.confidence)[0];
      if (reviewLogo) {
        outcome.logo.status = "REVIEW_REQUIRED";
        outcome.logo.original_source_url = reviewLogo.src;
        outcome.logo.confidence = reviewLogo.confidence;
        outcome.logo.notes = "Candidato con confidenza media — revisione manuale";
        sentToReview++;
      } else {
        outcome.logo.status = "NOT_FOUND";
        outcome.logo.notes = "Nessun logo con confidenza sufficiente";
        logosNotFound++;
      }
    }

    // ---- 6. TEAM PHOTOS: top-N con team_confidence >= MIN_TEAM_CONFIDENCE
    const teamCandidates = classification.team_photos
      .filter((t) => t.is_team_photo && t.team_confidence >= MIN_TEAM_CONFIDENCE)
      .sort((a, b) => b.team_confidence - a.team_confidence)
      .slice(0, MAX_TEAM_IMAGES);

    const existingPhotos = Array.isArray(agency.photos) ? (agency.photos as TeamPhotoRecord[]) : [];
    const existingSourceUrls = new Set(existingPhotos.map((p) => p.source_url));
    const newPhotos: TeamPhotoRecord[] = [];
    let photoIdx = existingPhotos.length + 1;

    for (const tc of teamCandidates) {
      const teamOutcome: OutcomeAgency["team_images"][number] = {
        original_source_url: tc.src,
        source_page_url: findPageForImage(tc.src, home.final_url, teamPages),
        public_url: null,
        file_name: "",
        mime_type: "",
        width: null,
        height: null,
        alt_text: teamAlt,
        description: teamDesc,
        team_confidence: tc.team_confidence,
        status: "REJECTED",
        notes: null,
      };

      if (existingSourceUrls.has(tc.src)) {
        teamOutcome.status = "DUPLICATE";
        teamOutcome.notes = "Già presente nell'agenzia";
        outcome.team_images.push(teamOutcome);
        continue;
      }

      const downloaded = await downloadImage(tc.src);
      if (!downloaded) {
        teamOutcome.status = "ERROR";
        teamOutcome.notes = "Download fallito";
        errors.push({ agency_id: agency.id, asset_type: "TEAM_IMAGE", source_url: tc.src, error_type: "download", message: "fetch fallito" });
        outcome.team_images.push(teamOutcome);
        continue;
      }
      if (downloaded.width && downloaded.height) {
        if (downloaded.width < MIN_IMAGE_WIDTH || downloaded.height < MIN_IMAGE_HEIGHT) {
          teamOutcome.status = "REJECTED";
          teamOutcome.notes = `Dimensioni insufficienti: ${downloaded.width}x${downloaded.height}`;
          outcome.team_images.push(teamOutcome);
          continue;
        }
      }

      const ext = extFromMime(downloaded.mime_type) ?? extFromUrl(tc.src) ?? "jpg";
      const idxStr = String(photoIdx++).padStart(2, "0");
      const hash = shortHash(tc.src);
      const fileName = `team-${slug}-${idxStr}-${hash}.${ext}`;
      const path = `team/${fileName}`;
      const up = await uploadToStorage(ctx.supabase, path, downloaded.buffer, downloaded.mime_type);
      if ("error" in up) {
        teamOutcome.status = "ERROR";
        teamOutcome.notes = `Upload fallito: ${up.error}`;
        errors.push({ agency_id: agency.id, asset_type: "TEAM_IMAGE", source_url: tc.src, error_type: "upload", message: up.error });
        outcome.team_images.push(teamOutcome);
        continue;
      }

      teamOutcome.status = "UPLOADED_AS_TEAM";
      teamOutcome.public_url = up.public_url;
      teamOutcome.file_name = fileName;
      teamOutcome.mime_type = downloaded.mime_type;
      teamOutcome.width = downloaded.width;
      teamOutcome.height = downloaded.height;
      outcome.team_images.push(teamOutcome);
      teamUploaded++;
      anyTeamChanged = true;

      newPhotos.push({
        public_url: up.public_url,
        file_name: fileName,
        mime_type: downloaded.mime_type,
        width: downloaded.width,
        height: downloaded.height,
        alt_text: teamAlt,
        description: teamDesc,
        source_url: tc.src,
        source_page_url: teamOutcome.source_page_url,
        team_confidence: tc.team_confidence,
        uploaded_at: new Date().toISOString(),
      });
    }

    // Review flag per team a media confidenza (0.6-0.85)
    const reviewTeam = classification.team_photos.filter(
      (t) => t.is_team_photo && t.team_confidence >= 0.6 && t.team_confidence < MIN_TEAM_CONFIDENCE,
    );
    for (const rt of reviewTeam.slice(0, 3)) {
      outcome.team_images.push({
        original_source_url: rt.src,
        source_page_url: findPageForImage(rt.src, home.final_url, teamPages),
        public_url: null,
        file_name: "",
        mime_type: "",
        width: null,
        height: null,
        alt_text: teamAlt,
        description: teamDesc,
        team_confidence: rt.team_confidence,
        status: "REVIEW_REQUIRED",
        notes: "Confidenza media — revisione manuale",
      });
      sentToReview++;
    }

    if (anyTeamChanged) {
      dbUpdates.photos = [...existingPhotos, ...newPhotos];
    }

    // ---- 7. Persist DB updates
    if (Object.keys(dbUpdates).length > 2 /* > timestamps */) {
      const { error: updErr } = await ctx.supabase.from("agencies").update(dbUpdates).eq("id", agency.id);
      if (updErr) {
        outcome.database_action = "ERROR";
        errors.push({ agency_id: agency.id, asset_type: "LOGO", source_url: null, error_type: "db_update", message: updErr.message });
        errCount++;
      } else {
        outcome.database_action = logoChanged && anyTeamChanged ? "UPDATED" : logoChanged || anyTeamChanged ? "PARTIALLY_UPDATED" : "NO_CHANGE";
        successCount++;
      }
    } else {
      // Solo timestamp
      await ctx.supabase.from("agencies").update({
        visual_enriched_at: dbUpdates.visual_enriched_at,
        visual_enrichment_status: dbUpdates.visual_enrichment_status,
      }).eq("id", agency.id);
      outcome.database_action = outcome.logo.status === "REVIEW_REQUIRED" ? "MANUAL_REVIEW" : "NO_CHANGE";
      successCount++;
    }

    outcomes.push(outcome);
  }

  const summary = {
    agencies_processed: agencies.length,
    logos_uploaded: logosUploaded,
    logos_already_present: logosAlreadyPresent,
    logos_not_found: logosNotFound,
    team_images_uploaded: teamUploaded,
    images_sent_to_review: sentToReview,
    errors: errors.length,
  };

  ctx.log("batch_complete", summary);

  return {
    status: errCount === 0 ? "success" : successCount > 0 ? "partial" : "error",
    rowsProcessed: agencies.length,
    rowsSuccess: successCount,
    rowsError: errCount,
    meta: {
      run_summary: summary,
      agencies: outcomes,
      errors,
    },
  };
}

function extractLogoMetaField(agency: AgencyRow, field: string): unknown {
  const meta = (agency as unknown as { logo_meta?: Record<string, unknown> }).logo_meta;
  if (!meta || typeof meta !== "object") return null;
  return meta[field];
}

function findPageForImage(
  src: string,
  homeUrl: string,
  teamPages: Array<{ final_url: string; images: Array<{ src: string }> }>,
): string {
  for (const p of teamPages) {
    if (p.images.some((img) => img.src === src)) return p.final_url;
  }
  return homeUrl;
}
