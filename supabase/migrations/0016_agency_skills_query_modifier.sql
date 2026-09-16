-- =====================================================================
-- 0016_agency_skills_query_modifier.sql
-- Aggiunge query_modifier ad agency_skills: qualificatore usato per
-- costruire query di ricerca contestualizzate per quella competenza.
-- Es. per skill "video" o "fotografia" mettere "studio" invece del
-- default "agenzia" così le query diventano "studio video milano"
-- invece di "agenzia video milano".
-- Consumato da agenti/route che compongono ricerche testuali (scouter,
-- google places, ecc.).
-- =====================================================================

alter table public.agency_skills
  add column if not exists query_modifier text not null default 'agenzia';
