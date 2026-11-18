-- Lock dei campi modificati a mano dalla scheda agenzia (PATCH /api/agencies/[id]).
-- L'agency-updater salta la scrittura sui campi elencati qui. Idempotente: la colonna
-- potrebbe già esistere, creata fuori dalle migrazioni.
alter table public.agencies
  add column if not exists manual_fields text[] default '{}';
