-- =====================================================================
-- 0045_sedi_funzioni.sql
--   Funzioni per la sezione Sedi della scheda agenzia (docs/sedi-progetto.md).
--   Non cambia dati né il sito.
--   1. cerca_comuni(): autocompletamento del comune, senza accenti, con
--      provincia e regione del dominio dell'agenzia.
--   2. imposta_sede_principale(): cambia la principale in una sola
--      transazione (mai due principali, mai nessuna).
--   3. Trigger: un'agenzia con sedi ha sempre una principale. La prima sede
--      aggiunta lo diventa; se si cancella la principale, ne viene promossa
--      un'altra (prima le italiane, poi la più vecchia).
-- Idempotente.
-- =====================================================================
begin;

-- ---- 1. Ricerca dei comuni ------------------------------------------------
create or replace function public.cerca_comuni(p_domain_id uuid, p_testo text, p_limite integer default 15)
returns table (codice text, nome text, nome_altro text, sigla text, provincia text, regione text, capoluogo boolean)
language sql
stable
set search_path = public
as $$
  with q as (select public.normalizza_luogo(p_testo) as t)
  select c.codice, c.nome, c.nome_altro, c.sigla, p.nome, r.nome, c.capoluogo
  from public.comuni c
  cross join q
  join public.areas p on p.sigla = c.sigla and p.tipo = 'citta' and p.domain_id = p_domain_id
  join public.areas r on r.id = p.parent_id
  where q.t <> ''
    and (public.normalizza_luogo(c.nome) like q.t || '%'
         or public.normalizza_luogo(c.nome_altro) like q.t || '%')
  order by (public.normalizza_luogo(c.nome) = q.t) desc, c.capoluogo desc, length(c.nome), c.nome
  limit greatest(1, least(p_limite, 50));
$$;

revoke all on function public.cerca_comuni(uuid, text, integer) from public, anon, authenticated;

-- ---- 2. Cambio della sede principale --------------------------------------
create or replace function public.imposta_sede_principale(p_sede_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_agency uuid;
begin
  select agency_id into v_agency from public.agency_sedi where id = p_sede_id;
  if v_agency is null then
    raise exception 'Sede % non trovata', p_sede_id;
  end if;
  update public.agency_sedi set principale = false
  where agency_id = v_agency and principale and id <> p_sede_id;
  update public.agency_sedi set principale = true
  where id = p_sede_id and not principale;
end
$$;

revoke all on function public.imposta_sede_principale(uuid) from public, anon, authenticated;

-- ---- 3. Sempre una principale ---------------------------------------------
create or replace function public.agency_sedi_garantisci_principale()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_agency uuid := coalesce(new.agency_id, old.agency_id);
begin
  if not exists (select 1 from public.agency_sedi where agency_id = v_agency and principale) then
    update public.agency_sedi set principale = true
    where id = (
      select id from public.agency_sedi
      where agency_id = v_agency
      order by (paese = 'IT') desc, created_at, id
      limit 1
    );
  end if;
  return null;
end
$$;

drop trigger if exists agency_sedi_garantisci_principale on public.agency_sedi;
create trigger agency_sedi_garantisci_principale
  after insert or delete on public.agency_sedi
  for each row execute function public.agency_sedi_garantisci_principale();

select count(*) as agenzie_senza_principale
from (select agency_id from public.agency_sedi group by agency_id having not bool_or(principale)) x;

commit;
