-- 0039 — Una proposta "Proponi un'agenzia" si collega alla scheda dell'agenzia.
--
-- Le agenzie proposte sono i lead (abbonamenti per verifica e inserimento del profilo): dalla
-- sezione CRM > Richieste lo staff collega la proposta a un'agenzia già presente o ne crea una
-- bozza (publish_status 'draft', status_curatela 'proposta'). Il collegamento non è automatico
-- all'invio: il form è pubblico e lo spam non deve creare schede.
--
-- Rieseguibile.

alter table public.site_requests
  add column if not exists agency_id uuid references public.agencies(id) on delete set null;
create index if not exists site_requests_agency on public.site_requests (agency_id);
