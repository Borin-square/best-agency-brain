-- 0036 — Richieste dai form del sito pubblico ("Raccontaci cosa cerchi", "Proponi un'agenzia").
--
-- Prendono il posto di Contact Form 7 + Flamingo del vecchio WordPress: ogni invio finisce qui e il
-- sito manda anche le stesse email di prima. Lo staff le legge nella sezione Richieste del brain.
--
-- Il sito non scrive mai nelle tabelle: il ruolo site_reader resta in sola lettura e può soltanto
-- chiamare due funzioni dello schema site, che inseriscono una richiesta e ne segnano l'esito
-- dell'email. Le funzioni girano con i diritti di chi le ha create (security definer) e
-- controllano tutto quello che ricevono.
--
-- Rieseguibile: create if not exists / create or replace.

-- ---- Tabella ----------------------------------------------------------------
create table if not exists public.site_requests (
  id            uuid primary key default gen_random_uuid(),
  domain_id     uuid not null references public.network_domains(id) on delete restrict,
  tipo          text not null check (tipo in ('trova', 'proponi')),  -- trova = "Raccontaci cosa cerchi"
  dati          jsonb not null,                                       -- i campi del form, così come inviati
  email         text,                                                 -- di chi scrive, minuscola: risposta e limite invii
  pagina        text,                                                 -- URL da cui è partito l'invio
  stato         text not null default 'nuova'
                  check (stato in ('nuova', 'in_lavorazione', 'chiusa', 'spam')),
  note          text,                                                 -- note interne dello staff
  email_inviata boolean,                                              -- null finché il sito non sa com'è andata
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists site_requests_domain_created on public.site_requests (domain_id, created_at desc);
create index if not exists site_requests_email_created on public.site_requests (email, created_at desc);

drop trigger if exists site_requests_set_updated_at on public.site_requests;
create trigger site_requests_set_updated_at before update on public.site_requests
  for each row execute function public.set_updated_at();

-- Il brain la legge e la aggiorna dalle sue API con la service role; nessun accesso diretto.
alter table public.site_requests enable row level security;
revoke all on public.site_requests from anon, authenticated;

-- ---- Inserimento dal sito ----------------------------------------------------
-- Restituisce l'id della richiesta. Rifiuta: tipo sconosciuto, dati che non sono un oggetto JSON o
-- troppo lunghi, dominio inesistente, più di 5 invii in un'ora dalla stessa email.
create or replace function site.invia_richiesta(
  p_domain_id uuid,
  p_tipo      text,
  p_dati      jsonb,
  p_pagina    text default null
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text;
  v_id    uuid;
begin
  if p_tipo is null or p_tipo not in ('trova', 'proponi') then
    raise exception 'tipo di richiesta non valido';
  end if;
  if p_dati is null or jsonb_typeof(p_dati) <> 'object' then
    raise exception 'dati della richiesta non validi';
  end if;
  if octet_length(p_dati::text) > 20000 then
    raise exception 'dati della richiesta troppo lunghi';
  end if;
  if not exists (select 1 from public.network_domains where id = p_domain_id) then
    raise exception 'dominio sconosciuto';
  end if;

  v_email := lower(nullif(trim(coalesce(p_dati->>'email', p_dati->>'email_proponente')), ''));
  if v_email is not null and (
    select count(*) from public.site_requests
    where email = v_email and created_at > now() - interval '1 hour'
  ) >= 5 then
    raise exception 'troppe richieste' using errcode = 'P0429';
  end if;

  insert into public.site_requests (domain_id, tipo, dati, email, pagina)
  values (p_domain_id, p_tipo, p_dati, v_email, left(p_pagina, 500))
  returning id into v_id;
  return v_id;
end;
$$;

-- Esito dell'email di notifica: si può scrivere una volta sola, e solo su una richiesta recente.
create or replace function site.segna_email_richiesta(p_id uuid, p_inviata boolean)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.site_requests
  set email_inviata = p_inviata
  where id = p_id
    and email_inviata is null
    and created_at > now() - interval '1 hour';
$$;

-- Le funzioni nuove sono eseguibili da tutti per default: le apre solo a site_reader.
revoke all on function site.invia_richiesta(uuid, text, jsonb, text) from public, anon, authenticated;
revoke all on function site.segna_email_richiesta(uuid, boolean) from public, anon, authenticated;
grant execute on function site.invia_richiesta(uuid, text, jsonb, text) to site_reader;
grant execute on function site.segna_email_richiesta(uuid, boolean) to site_reader;
