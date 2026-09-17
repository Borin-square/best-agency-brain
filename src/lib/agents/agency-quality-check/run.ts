import type { AgentContext, AgentResult } from "../framework";
import {
  runAllDetectors,
  extractRootDomain,
  BLACKLIST_DOMAINS,
  type DetectedIssue,
  type DetectorAgency,
  type IssueType,
} from "./sources/detectors";
import {
  mergeAgencies,
  type AgencyForMerge,
  type MergeResult,
} from "./sources/merger";

// ---------------------------------------------------------------------
// Costanti
// ---------------------------------------------------------------------
const DEFAULT_BATCH_SIZE = 200;
const DEFAULT_REFRESH_DAYS = 7; // presente in agent_schedules ma non usato: lasciato per compat
const MAX_BATCH_SIZE = 500;
const MAX_MANUAL_IDS = 100;

const ACTIVE_DOMAIN_STATUSES = ["online", "fase_1", "fase_2", "fase_3"] as const;

// Tipi di issue "hard dup" che triggerano auto-merge
const HARD_DUP_TYPES = new Set<IssueType>(["dup_place_id", "dup_domain", "dup_vat"]);

// ---------------------------------------------------------------------
// Row della SELECT batch (superset detector + merger)
// ---------------------------------------------------------------------
interface AgencyRow extends DetectorAgency, AgencyForMerge {
  domain_id: string;
}

// Select ridotta usata per popolare `allAgenciesInScope` (solo campi
// che servono ai detector cross-record).
const SCOPE_SELECT =
  "id, title, citta, sito_web, google_place_id, google_sito, partita_iva, telefono, google_telefono, email, enrichment_status, last_enriched_at, enrichment_errors, publish_status";

// Select estesa: DetectorAgency + AgencyForMerge + domain_id.
const AGENCY_SELECT = [
  // DetectorAgency
  "id",
  "title",
  "citta",
  "sito_web",
  "google_place_id",
  "google_sito",
  "partita_iva",
  "telefono",
  "google_telefono",
  "email",
  "enrichment_status",
  "last_enriched_at",
  "enrichment_errors",
  "publish_status",
  // Winner selection + merge extra
  "slug",
  "wp_id",
  "title_originale",
  "created_at",
  "updated_at",
  "verifica",
  "status_curatela",
  "note_curatore",
  // Merge scalars
  "content",
  "descrizione_breve",
  "regioni",
  "aree",
  "indirizzo_completo",
  "anno_di_fondazione",
  "dimensione_team",
  "fascia_di_prezzo",
  "pillar_primario_slug",
  "linkedin",
  "instagram",
  "behance",
  "google_indirizzo",
  "google_categoria",
  "google_foto_url",
  "google_rating",
  "google_recensioni_count",
  "match_confidence",
  "foto_del_team",
  "logo_url",
  "parent_slug",
  "incorporation_year",
  "legal_form",
  "declared_methodology",
  "min_project_budget",
  "min_project_currency",
  "typical_project_min",
  "typical_project_max",
  "seo_title",
  "meta_description",
  // Arrays
  "competenze_core",
  "competenze_principali",
  "altre_competenze",
  "caratteristiche",
  "lingue",
  "alternate_names",
  "deliverables",
  "platforms_tech",
  "industries",
  "audiences",
  "ideal_client_sizes",
  "engagement_models",
  "pricing_models",
  // JSONB arrays
  "photos",
  "portfolio",
  "case_studies",
  // JSONB objects
  "founder_leader",
  "differentiators",
  "faq",
  "best_for",
  "less_suitable_for",
  // Domain
  "domain_id",
].join(", ");

// ---------------------------------------------------------------------
// Helpers scope
// ---------------------------------------------------------------------

async function resolveScopeDomainIds(ctx: AgentContext): Promise<string[] | null> {
  const { domainId } = ctx.filters;
  if (domainId) return [domainId];
  const { data, error } = await ctx.supabase
    .from("network_domains")
    .select("id")
    .in("status", ACTIVE_DOMAIN_STATUSES as unknown as string[]);
  if (error) {
    ctx.log("select_error", { error: error.message, mode: "active_domains" });
    return null;
  }
  return (data ?? []).map((d) => d.id as string);
}

async function fetchScopeAgencies(
  ctx: AgentContext,
  domainIds: string[],
): Promise<DetectorAgency[] | null> {
  if (domainIds.length === 0) return [];
  // Fetch paginato per gestire domini con >1000 agenzie
  const pageSize = 1000;
  const all: DetectorAgency[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await ctx.supabase
      .from("agencies")
      .select(SCOPE_SELECT)
      .in("domain_id", domainIds)
      .neq("publish_status", "trash")
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1)
      .returns<DetectorAgency[]>();
    if (error) {
      ctx.log("select_error", { error: error.message, mode: "scope" });
      return null;
    }
    const chunk = data ?? [];
    all.push(...chunk);
    if (chunk.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

async function pickAgencies(
  ctx: AgentContext,
  batchSize: number,
  domainIds: string[],
): Promise<AgencyRow[] | null> {
  const { agencyIds } = ctx.filters;

  // Selezione manuale
  if (agencyIds && agencyIds.length > 0) {
    const capped = agencyIds.slice(0, MAX_MANUAL_IDS);
    const { data, error } = await ctx.supabase
      .from("agencies")
      .select(AGENCY_SELECT)
      .in("id", capped)
      .returns<AgencyRow[]>();
    if (error) {
      ctx.log("select_error", { error: error.message, mode: "manual_ids" });
      return null;
    }
    return data ?? [];
  }

  if (domainIds.length === 0) return [];

  // Batch: oldest-first per updated_at, esclude trash
  const { data, error } = await ctx.supabase
    .from("agencies")
    .select(AGENCY_SELECT)
    .in("domain_id", domainIds)
    .neq("publish_status", "trash")
    .order("updated_at", { ascending: true, nullsFirst: true })
    .limit(batchSize)
    .returns<AgencyRow[]>();
  if (error) {
    ctx.log("select_error", { error: error.message, mode: "batch" });
    return null;
  }
  return data ?? [];
}

// ---------------------------------------------------------------------
// Upsert issue helper
// ---------------------------------------------------------------------

interface UpsertIssueParams {
  agencyId: string;
  issue: DetectedIssue;
  resolved?: {
    resolution: "trashed" | "merged" | "ignored" | "fixed" | "superseded";
    notes: string;
  };
}

async function upsertIssue(
  ctx: AgentContext,
  { agencyId, issue, resolved }: UpsertIssueParams,
): Promise<void> {
  // 1. Verifica se esiste già una riga per (agency_id, type)
  const { data: existing, error: selErr } = await ctx.supabase
    .from("agency_issues")
    .select("id, resolved_at")
    .eq("agency_id", agencyId)
    .eq("type", issue.type)
    .maybeSingle();
  if (selErr) {
    ctx.log("issue_select_error", { agencyId, type: issue.type, error: selErr.message });
    return;
  }

  const now = new Date().toISOString();

  if (existing) {
    // Riga esistente: aggiorna last_seen + evidence. Se già resolved, lascia
    // resolved_at (evidenza ancora presente ma decisione umana prevale).
    const patch: Record<string, unknown> = {
      last_seen_at: now,
      evidence: issue.evidence,
      severity: issue.severity,
    };
    if (resolved && !existing.resolved_at) {
      patch.resolved_at = now;
      patch.resolution = resolved.resolution;
      patch.notes = resolved.notes;
    }
    const { error } = await ctx.supabase
      .from("agency_issues")
      .update(patch)
      .eq("id", existing.id as string);
    if (error) {
      ctx.log("issue_update_error", { agencyId, type: issue.type, error: error.message });
    }
    return;
  }

  // Insert nuova
  const insertRow: Record<string, unknown> = {
    agency_id: agencyId,
    type: issue.type,
    severity: issue.severity,
    evidence: issue.evidence,
    detected_at: now,
    last_seen_at: now,
  };
  if (resolved) {
    insertRow.resolved_at = now;
    insertRow.resolution = resolved.resolution;
    insertRow.notes = resolved.notes;
  }
  const { error } = await ctx.supabase.from("agency_issues").insert(insertRow);
  if (error) {
    ctx.log("issue_insert_error", { agencyId, type: issue.type, error: error.message });
  }
}

// ---------------------------------------------------------------------
// Auto-actions
// ---------------------------------------------------------------------

async function autoTrashBlacklist(
  ctx: AgentContext,
  agencyId: string,
  domain: string,
): Promise<boolean> {
  const note = `Auto-trashed for blacklist domain: ${domain}`;
  const { error } = await ctx.supabase
    .from("agencies")
    .update({
      publish_status: "trash",
      note_curatore: note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", agencyId);
  if (error) {
    ctx.log("blacklist_trash_error", { agencyId, error: error.message });
    return false;
  }
  return true;
}

// Fetch dello slice AgencyForMerge per un set di ids (winner + losers).
async function fetchMergeGroup(
  ctx: AgentContext,
  ids: string[],
): Promise<AgencyForMerge[] | null> {
  const { data, error } = await ctx.supabase
    .from("agencies")
    .select(AGENCY_SELECT)
    .in("id", ids)
    .returns<AgencyForMerge[]>();
  if (error) {
    ctx.log("merge_fetch_error", { ids, error: error.message });
    return null;
  }
  return data ?? [];
}

// Risolvi tutte le issue aperte (di qualsiasi tipo dup_*) per un gruppo
// di agenzie (winner + losers), settando resolution='merged'.
async function resolveMergeIssues(
  ctx: AgentContext,
  agencyIds: string[],
  winnerId: string,
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await ctx.supabase
    .from("agency_issues")
    .update({
      resolved_at: now,
      resolution: "merged",
      notes: `Auto-merged into ${winnerId}`,
    })
    .in("agency_id", agencyIds)
    .is("resolved_at", null)
    .in("type", ["dup_place_id", "dup_domain", "dup_vat", "dup_phone", "fuzzy_title_dup"]);
  if (error) {
    ctx.log("merge_issue_resolve_error", { agencyIds, error: error.message });
  }
}

// ---------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------

export async function runAgencyQualityCheck(ctx: AgentContext): Promise<AgentResult> {
  const refreshDays = ctx.overrides.refreshDays ?? DEFAULT_REFRESH_DAYS;
  const requestedBatch = ctx.overrides.batchSize ?? DEFAULT_BATCH_SIZE;
  const batchSize = Math.max(1, Math.min(MAX_BATCH_SIZE, requestedBatch));

  ctx.log("start", {
    batchSize,
    refreshDays,
    filters: ctx.filters,
    overrides: ctx.overrides,
  });

  // 1. Risolvi il dominio scope
  const scopeDomains = await resolveScopeDomainIds(ctx);
  if (scopeDomains === null) {
    return { status: "error", rowsProcessed: 0, rowsSuccess: 0, rowsError: 0 };
  }
  if (scopeDomains.length === 0) {
    ctx.log("no_active_domains");
    return { status: "success", rowsProcessed: 0, rowsSuccess: 0, rowsError: 0 };
  }

  // 2. Fetch batch da processare + fetch scope completo per dup detection
  const [batch, scope] = await Promise.all([
    pickAgencies(ctx, batchSize, scopeDomains),
    fetchScopeAgencies(ctx, scopeDomains),
  ]);
  if (batch === null || scope === null) {
    return { status: "error", rowsProcessed: 0, rowsSuccess: 0, rowsError: 0 };
  }
  if (batch.length === 0) {
    ctx.log("no_agencies_to_check");
    return { status: "success", rowsProcessed: 0, rowsSuccess: 0, rowsError: 0 };
  }

  ctx.log("batch_selected", { count: batch.length, scopeSize: scope.length });

  // Traccia agenzie già mergiate/trashate in questo run per evitare doppi trigger
  const alreadyTrashed = new Set<string>();
  const alreadyMerged = new Set<string>(); // loser_ids da merge

  let success = 0;
  let errorCount = 0;
  let blacklistTrashed = 0;
  let duplicatesMerged = 0;
  let issuesOpened = 0;
  let issuesResolved = 0;

  for (const agency of batch) {
    const itemStart = Date.now();
    const detectedTypes: IssueType[] = [];
    const autoActions: string[] = [];
    let itemError: string | null = null;

    // Skip se questa agenzia è stata trashata/mergiata in un iter precedente
    if (alreadyTrashed.has(agency.id) || alreadyMerged.has(agency.id)) {
      ctx.log("skip_already_handled", { agencyId: agency.id });
      continue;
    }

    try {
      // 3. Run detectors
      const issues = runAllDetectors(agency, scope);

      for (const issue of issues) {
        detectedTypes.push(issue.type);

        // --- Auto-action: blacklist_domain → trash ---
        if (issue.type === "blacklist_domain") {
          const domain = (issue.evidence.domain as string) ?? "";
          const ok = await autoTrashBlacklist(ctx, agency.id, domain);
          if (ok) {
            alreadyTrashed.add(agency.id);
            blacklistTrashed++;
            autoActions.push("blacklist_trashed");
            await upsertIssue(ctx, {
              agencyId: agency.id,
              issue,
              resolved: {
                resolution: "trashed",
                notes: `Auto-trashed for blacklist domain: ${domain}`,
              },
            });
            issuesResolved++;
          } else {
            await upsertIssue(ctx, { agencyId: agency.id, issue });
            issuesOpened++;
          }
          // Una volta trashata l'agenzia non ha senso processare altre issue
          break;
        }

        // --- Auto-action: hard dup → merge ---
        if (HARD_DUP_TYPES.has(issue.type)) {
          const otherIds = (issue.evidence.other_agency_ids as string[]) ?? [];
          const groupIds = [agency.id, ...otherIds].filter(
            (id, i, arr) => arr.indexOf(id) === i,
          );
          // Skip se qualcuno del gruppo è già stato gestito
          if (groupIds.some((id) => alreadyTrashed.has(id) || alreadyMerged.has(id))) {
            await upsertIssue(ctx, { agencyId: agency.id, issue });
            issuesOpened++;
            continue;
          }

          const group = await fetchMergeGroup(ctx, groupIds);
          if (!group || group.length < 2) {
            await upsertIssue(ctx, { agencyId: agency.id, issue });
            issuesOpened++;
            continue;
          }

          let mergeResult: MergeResult;
          try {
            mergeResult = await mergeAgencies(ctx.supabase, group, `dup:${issue.type}`);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            ctx.log("merge_error", { groupIds, error: msg });
            await upsertIssue(ctx, { agencyId: agency.id, issue });
            issuesOpened++;
            continue;
          }

          duplicatesMerged++;
          autoActions.push(`merged:${issue.type}`);
          for (const lid of mergeResult.loser_ids) alreadyMerged.add(lid);
          if (mergeResult.loser_ids.includes(agency.id)) alreadyMerged.add(agency.id);

          // Risolvi le issue di dup su tutto il gruppo
          await resolveMergeIssues(ctx, groupIds, mergeResult.winner_id);
          issuesResolved++;

          // Upsert dell'issue corrente come merged (per garantire tracking anche
          // se la resolve query non l'ha ancora catturata)
          await upsertIssue(ctx, {
            agencyId: agency.id,
            issue,
            resolved: {
              resolution: "merged",
              notes: `Auto-merged into ${mergeResult.winner_id} (fields: ${mergeResult.fields_merged.join(",")})`,
            },
          });
          continue;
        }

        // --- Nessuna auto-action: upsert come open issue ---
        await upsertIssue(ctx, { agencyId: agency.id, issue });
        issuesOpened++;
      }

      // 4. Chiudi le issue aperte per questa agenzia che non sono state
      //    ri-detectate (evidenza sparita → resolution='fixed').
      if (!alreadyTrashed.has(agency.id) && !alreadyMerged.has(agency.id)) {
        const { data: openIssues, error: openErr } = await ctx.supabase
          .from("agency_issues")
          .select("id, type")
          .eq("agency_id", agency.id)
          .is("resolved_at", null);
        if (openErr) {
          ctx.log("open_issues_fetch_error", { agencyId: agency.id, error: openErr.message });
        } else if (openIssues && openIssues.length > 0) {
          const detectedSet = new Set(detectedTypes);
          const toFix = openIssues.filter((row) => !detectedSet.has(row.type as IssueType));
          if (toFix.length > 0) {
            const now = new Date().toISOString();
            const { error: fixErr } = await ctx.supabase
              .from("agency_issues")
              .update({
                resolved_at: now,
                resolution: "fixed",
                notes: "Evidence no longer present",
              })
              .in(
                "id",
                toFix.map((r) => r.id as string),
              );
            if (fixErr) {
              ctx.log("open_issues_fix_error", { agencyId: agency.id, error: fixErr.message });
            } else {
              issuesResolved += toFix.length;
              autoActions.push(`fixed:${toFix.length}`);
            }
          }
        }
      }

      success++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      itemError = msg;
      errorCount++;
      ctx.log("item_error", { agencyId: agency.id, error: msg });
    }

    // 5. Insert agent_run_items
    await ctx.supabase.from("agent_run_items").insert({
      run_id: ctx.runId,
      agency_id: agency.id,
      status: itemError ? "error" : "success",
      sources_hit: {
        detected_types: detectedTypes,
        auto_actions: autoActions,
      },
      fields_updated: [],
      errors: itemError ? { message: itemError } : null,
      duration_ms: Date.now() - itemStart,
    });
  }

  ctx.log("batch_complete", {
    success,
    errorCount,
    blacklistTrashed,
    duplicatesMerged,
    issuesOpened,
    issuesResolved,
  });

  return {
    status: errorCount === 0 ? "success" : success > 0 ? "partial" : "error",
    rowsProcessed: batch.length,
    rowsSuccess: success,
    rowsError: errorCount,
    meta: {
      blacklist_trashed: blacklistTrashed,
      duplicates_merged: duplicatesMerged,
      issues_opened: issuesOpened,
      issues_resolved: issuesResolved,
      batchSize,
      refreshDays,
      scopeSize: scope.length,
    },
  };
}

// Suppress unused import warning: BLACKLIST_DOMAINS / extractRootDomain
// esportati per test/utility esterni. Nessuna funzione qui li usa direttamente
// ma li ri-esportiamo per convenienza:
export { BLACKLIST_DOMAINS, extractRootDomain };
