import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { fetchAllowedSkills, slugifySkill, type AgencySkill } from "@/lib/agency-skills";

export const runtime = "nodejs";
export const maxDuration = 300;

// Alias predefiniti: sinonimi/varianti comuni → slug canonico dell'allowlist.
// Vengono provati se lo slug/label non è direttamente nell'allowlist.
const ALIASES: Record<string, string> = {
  // e-commerce
  "ecommerce": "e-commerce",
  "e commerce": "e-commerce",
  "shopify": "e-commerce",
  "woocommerce": "e-commerce",
  "magento": "e-commerce",
  // email
  "email marketing": "e-mail-marketing",
  "emailmarketing": "e-mail-marketing",
  "email-marketing": "e-mail-marketing",
  "email": "e-mail-marketing",
  "newsletter": "e-mail-marketing",
  // pubblicita
  "advertising": "pubblicita",
  "online advertising": "pubblicita",
  "adv": "pubblicita",
  "ads": "pubblicita",
  "display advertising": "pubblicita",
  "display ads": "pubblicita",
  "programmatic": "pubblicita",
  // content
  "content marketing": "strategia-di-contenuto",
  "content strategy": "strategia-di-contenuto",
  "content creation": "strategia-di-contenuto",
  "copywriting": "strategia-di-contenuto",
  "content": "strategia-di-contenuto",
  "blog": "strategia-di-contenuto",
  "editorial": "strategia-di-contenuto",
  // web-agency
  "web design": "web-agency",
  "webdesign": "web-agency",
  "web development": "web-agency",
  "webdevelopment": "web-agency",
  "web dev": "web-agency",
  "website": "web-agency",
  "sviluppo web": "web-agency",
  "sviluppo siti": "web-agency",
  "siti web": "web-agency",
  "sito web": "web-agency",
  "wordpress": "web-agency",
  "cms": "web-agency",
  "app development": "web-agency",
  "app": "web-agency",
  "mobile app": "web-agency",
  "software": "web-agency",
  // grafica
  "graphic design": "grafica",
  "graphicdesign": "grafica",
  "logo design": "grafica",
  "logo": "grafica",
  "illustrazione": "grafica",
  "illustration": "grafica",
  "packaging": "grafica",
  "print": "grafica",
  "stampa": "grafica",
  "editoriale": "grafica",
  "design": "grafica",
  // branding
  "brand identity": "branding",
  "brandidentity": "branding",
  "brand design": "branding",
  "brand strategy": "branding",
  "identity": "branding",
  "naming": "branding",
  "rebranding": "branding",
  "brand": "branding",
  // fotografia
  "photography": "fotografia",
  "foto": "fotografia",
  "photo": "fotografia",
  "still life": "fotografia",
  "ritratto": "fotografia",
  "servizio fotografico": "fotografia",
  // video
  "video production": "video",
  "videoproduction": "video",
  "videomaking": "video",
  "video making": "video",
  "video marketing": "video",
  "videografia": "video",
  "riprese video": "video",
  "montaggio": "video",
  "spot": "video",
  "animation": "video",
  "motion": "video",
  "motion graphics": "video",
  "motion design": "video",
  "3d": "video",
  // eventi
  "event": "eventi",
  "events": "eventi",
  "event management": "eventi",
  "eventmanagement": "eventi",
  "eventi corporate": "eventi",
  "fiere": "eventi",
  "convention": "eventi",
  "meeting": "eventi",
  "congressi": "eventi",
  // pubbliche relazioni
  "public relations": "pubbliche-relazioni",
  "publicrelations": "pubbliche-relazioni",
  "pr": "pubbliche-relazioni",
  "ufficio stampa": "pubbliche-relazioni",
  "media relations": "pubbliche-relazioni",
  "press office": "pubbliche-relazioni",
  // digital pr
  "digital pr": "digital-pr",
  "digitalpr": "digital-pr",
  // influencer
  "influencer": "influencer-marketing",
  "influencer relations": "influencer-marketing",
  "kol": "influencer-marketing",
  "creator": "influencer-marketing",
  "creator marketing": "influencer-marketing",
  // marketing
  "digital marketing": "marketing",
  "digitalmarketing": "marketing",
  "growth marketing": "marketing",
  "growth": "marketing",
  "growth hacking": "marketing",
  "inbound marketing": "marketing",
  "marketing strategy": "marketing",
  "strategia marketing": "marketing",
  "consulenza marketing": "marketing",
  "performance marketing": "marketing",
  "performance": "marketing",
  // seo
  "seo optimization": "seo",
  "seooptimization": "seo",
  "search engine optimization": "seo",
  "posizionamento": "seo",
  "posizionamento google": "seo",
  "posizionamento seo": "seo",
  "local seo": "seo",
  "seo local": "seo",
  "seo tecnico": "seo",
  "technical seo": "seo",
  "link building": "seo",
  "linkbuilding": "seo",
  // google ads
  "sem": "google-ads",
  "ppc": "google-ads",
  "google adwords": "google-ads",
  "adwords": "google-ads",
  "google shopping": "google-ads",
  "youtube ads": "google-ads",
  // social media
  "facebook ads": "social-media",
  "meta ads": "social-media",
  "instagram ads": "social-media",
  "linkedin ads": "social-media",
  "tiktok ads": "social-media",
  "social ads": "social-media",
  "social media marketing": "social-media",
  "socialmediamarketing": "social-media",
  "smm": "social-media",
  "social": "social-media",
  "facebook": "social-media",
  "instagram": "social-media",
  "linkedin": "social-media",
  "tiktok": "social-media",
  "youtube": "social-media",
  "community management": "social-media",
  "community": "social-media",
  // amazon
  "amazon": "amazon-marketing",
  "amazon advertising": "amazon-marketing",
  "amazon ads": "amazon-marketing",
  "amazonads": "amazon-marketing",
  "amazon vendor": "amazon-marketing",
  "amazon seller": "amazon-marketing",
  "amazon ppc": "amazon-marketing",
  // lead gen
  "lead gen": "lead-generation",
  "leadgeneration": "lead-generation",
  "leadgen": "lead-generation",
  "acquisizione lead": "lead-generation",
  "acquisizione clienti": "lead-generation",
  "generazione contatti": "lead-generation",
  // comunicazione
  "comunication": "comunicazione",
  "communication": "comunicazione",
  "comms": "comunicazione",
  "comunicazione integrata": "comunicazione",
  "corporate communication": "comunicazione",
};

// Normalizza input LLM/CSV verso una chiave alias-map (lowercase, no punct extra)
function normKey(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 3),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return inter / union;
}

// Restituisce lo slug canonico se riconosciuto, altrimenti null.
// Ordine: match esatto (slug/label) → alias → similarità token (jaccard ≥ 0.5).
function mapToCanonical(raw: string, allowed: AgencySkill[]): string | null {
  const s = raw.trim();
  if (!s) return null;
  const lower = s.toLowerCase();

  // 1. match esatto slug o label
  const bySlug = allowed.find((a) => a.slug === lower);
  if (bySlug) return bySlug.slug;
  const byLabel = allowed.find((a) => a.label.toLowerCase() === lower);
  if (byLabel) return byLabel.slug;
  const guessed = slugifySkill(s);
  const byGuess = allowed.find((a) => a.slug === guessed);
  if (byGuess) return byGuess.slug;

  // 2. alias map
  const key = normKey(s);
  const aliasTarget = ALIASES[key];
  if (aliasTarget && allowed.some((a) => a.slug === aliasTarget)) return aliasTarget;

  // 3. similarità token overlap
  const inputTokens = tokens(s);
  if (inputTokens.size > 0) {
    let best: { slug: string; score: number } | null = null;
    for (const a of allowed) {
      const cand = tokens(`${a.slug} ${a.label}`);
      const score = jaccard(inputTokens, cand);
      if (score >= 0.5 && (!best || score > best.score)) {
        best = { slug: a.slug, score };
      }
    }
    if (best) return best.slug;
  }

  return null;
}

async function requireOwnerOrDev(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const jwt = authHeader?.replace(/^Bearer\s+/, "");
  if (!jwt) return { error: "unauthorized" as const, status: 401 as const };
  const supabase = createServiceClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
  if (userErr || !userData.user) return { error: "invalid_token" as const, status: 401 as const };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  if (!profile || (profile.role !== "owner" && profile.role !== "dev")) {
    return { error: "forbidden" as const, status: 403 as const };
  }
  return { supabase };
}

function reconcile(
  raw: string[] | null,
  allowed: AgencySkill[],
  cap: number,
  usedSlugs: Set<string>,
  stats: { kept: number; aliased: number; dropped: number },
): string[] {
  if (!raw || raw.length === 0) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const target = mapToCanonical(item, allowed);
    if (!target) {
      stats.dropped++;
      continue;
    }
    if (usedSlugs.has(target) || seen.has(target)) continue;
    // Traccia se era già canonico o mappato
    const isCanonical = target === item.trim().toLowerCase();
    if (isCanonical) stats.kept++;
    else stats.aliased++;
    seen.add(target);
    out.push(target);
    if (out.length >= cap) break;
  }
  for (const s of out) usedSlugs.add(s);
  return out;
}

function eqArr(a: string[] | null, b: string[]): boolean {
  const aa = a ?? [];
  return aa.length === b.length && aa.every((v, i) => v === b[i]);
}

// POST /api/agencies/backfill-competenze?domain_id=<uuid>
// Riscrive competenze_core/principali/altre di tutte le agenzie del dominio
// riconducendo ogni voce all'allowlist (agency_skills). Scarta voci non
// riconducibili. Idempotente.
export async function POST(req: NextRequest) {
  const auth = await requireOwnerOrDev(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const domainId = new URL(req.url).searchParams.get("domain_id")?.trim();
  if (!domainId) return NextResponse.json({ error: "missing_domain_id" }, { status: 400 });

  const allowed = await fetchAllowedSkills(auth.supabase, domainId);
  if (allowed.length === 0) {
    return NextResponse.json({ error: "no_skills_for_domain" }, { status: 400 });
  }

  const PAGE = 1000;
  const rows: Array<{
    id: string;
    competenze_core: string[] | null;
    competenze_principali: string[] | null;
    altre_competenze: string[] | null;
  }> = [];
  let from = 0;
  while (true) {
    const { data, error } = await auth.supabase
      .from("agencies")
      .select("id, competenze_core, competenze_principali, altre_competenze")
      .eq("domain_id", domainId)
      .neq("publish_status", "trash")
      .range(from, from + PAGE - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) break;
    rows.push(...(data as typeof rows));
    if (data.length < PAGE) break;
    from += PAGE;
  }

  let updated = 0;
  let unchanged = 0;
  const totals = { kept: 0, aliased: 0, dropped: 0 };

  for (const r of rows) {
    const used = new Set<string>();
    const stats = { kept: 0, aliased: 0, dropped: 0 };
    const finalCore = reconcile(r.competenze_core, allowed, 2, used, stats);
    const finalPri = reconcile(r.competenze_principali, allowed, 5, used, stats);
    const finalAlt = reconcile(r.altre_competenze, allowed, 10, used, stats);
    totals.kept += stats.kept;
    totals.aliased += stats.aliased;
    totals.dropped += stats.dropped;

    if (
      eqArr(r.competenze_core, finalCore) &&
      eqArr(r.competenze_principali, finalPri) &&
      eqArr(r.altre_competenze, finalAlt)
    ) {
      unchanged++;
      continue;
    }
    const { error: updErr } = await auth.supabase
      .from("agencies")
      .update({
        competenze_core: finalCore.length > 0 ? finalCore : null,
        competenze_principali: finalPri.length > 0 ? finalPri : null,
        altre_competenze: finalAlt.length > 0 ? finalAlt : null,
      })
      .eq("id", r.id);
    if (updErr) continue;
    updated++;
  }

  return NextResponse.json({
    ok: true,
    total: rows.length,
    updated,
    unchanged,
    voci_tenute: totals.kept,
    voci_mappate: totals.aliased,
    voci_scartate: totals.dropped,
  });
}
