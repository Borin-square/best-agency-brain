-- =====================================================================
-- 0007_visual_enrichment.sql
-- Campi visivi + bucket storage per agency-visual-enrichment agent.
-- =====================================================================

-- Metadati logo (public_url separato in agencies.logo_url già esistente)
alter table public.agencies
  add column if not exists logo_meta               jsonb,
  add column if not exists visual_enrichment_status text,   -- success | partial | error | never
  add column if not exists visual_enriched_at      timestamptz;

-- photos già esiste (0005) come jsonb array di oggetti:
--   [{ public_url, file_name, mime_type, width, height, alt_text,
--      description, source_url, source_page_url, team_confidence,
--      uploaded_at }]

-- Bucket storage pubblico per logo + foto team.
insert into storage.buckets (id, name, public)
values ('agency-visuals', 'agency-visuals', true)
on conflict (id) do nothing;

-- Policy: chiunque può leggere (bucket pubblico).
-- Scrittura solo service role (bypass RLS by default).
drop policy if exists agency_visuals_public_read on storage.objects;
create policy agency_visuals_public_read on storage.objects
  for select using (bucket_id = 'agency-visuals');
