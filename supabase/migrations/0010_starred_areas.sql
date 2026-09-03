-- =====================================================================
-- 0010_starred_areas.sql
-- Aggiunge network_domains.starred_areas: aree "preferite" per la matrice
-- competenze × area. Formato: array di { type: 'regione'|'citta', slug: text }
-- Ordine dell'array = ordine di visualizzazione (drag-and-drop future proof).
-- =====================================================================

alter table public.network_domains
  add column if not exists starred_areas jsonb not null default '[]'::jsonb;
