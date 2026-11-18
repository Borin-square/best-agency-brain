-- 0038 — Chi scrive dai form del sito finisce anche nei Contatti del CRM.
--
-- A ogni richiesta (site_requests, migrazione 0036) il mittente viene cercato tra i contatti del
-- dominio per email; se non c'è viene creato con source 'inbound'. La richiesta tiene il
-- collegamento in contact_id. Un contatto già esistente non viene toccato: lo staff potrebbe
-- averlo già sistemato a mano.
--
-- Mittente: per "Raccontaci cosa cerchi" (trova) è chi compila (nome, email, azienda); per
-- "Proponi un'agenzia" (proponi) è chi propone (nome_proponente, email_proponente), non l'agenzia.
-- Senza email non si crea nessun contatto.
--
-- Il censimento non deve mai far perdere una richiesta: se fallisce, la richiesta si salva lo
-- stesso senza contact_id.
--
-- Rieseguibile.

alter table public.site_requests
  add column if not exists contact_id uuid references public.contacts(id) on delete set null;
create index if not exists site_requests_contact on public.site_requests (contact_id);

-- ---- Trova o crea il contatto del mittente -----------------------------------
-- Interna: non è esposta al sito, la chiamano invia_richiesta e il recupero qui sotto.
create or replace function public.contatto_da_richiesta(
  p_domain_id  uuid,
  p_tipo       text,
  p_dati       jsonb,
  p_request_id uuid
) returns uuid
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_email   text;
  v_nome    text;
  v_azienda text;
  v_id      uuid;
begin
  if p_tipo = 'proponi' then
    v_email := p_dati->>'email_proponente';
    v_nome  := p_dati->>'nome_proponente';
  else
    v_email   := p_dati->>'email';
    v_nome    := p_dati->>'nome';      -- "Nome e ruolo": testo libero, va tutto in full_name
    v_azienda := p_dati->>'azienda';
  end if;
  v_email   := lower(nullif(trim(v_email), ''));
  v_nome    := left(nullif(trim(v_nome), ''), 200);
  v_azienda := left(nullif(trim(v_azienda), ''), 200);
  if v_email is null then
    return null;
  end if;

  select id into v_id
  from public.contacts
  where domain_id = p_domain_id and lower(email) = v_email
  order by created_at
  limit 1;
  if v_id is not null then
    return v_id;
  end if;

  insert into public.contacts (domain_id, full_name, email, source, source_meta, tags, notes)
  values (
    p_domain_id,
    v_nome,
    v_email,
    'inbound',
    jsonb_strip_nulls(jsonb_build_object(
      'form', p_tipo,
      'request_id', p_request_id,
      'azienda', v_azienda,
      'relazione', case when p_tipo = 'proponi' then nullif(trim(p_dati->>'relazione'), '') end
    )),
    array['richiesta-' || p_tipo],
    case when v_azienda is not null then 'Azienda: ' || v_azienda end
  )
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.contatto_da_richiesta(uuid, text, jsonb, uuid) from public, anon, authenticated;

-- ---- Inserimento dal sito (sostituisce la versione della 0036) --------------
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
  v_email   text;
  v_id      uuid;
  v_contact uuid;
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

  begin
    v_contact := public.contatto_da_richiesta(p_domain_id, p_tipo, p_dati, v_id);
    if v_contact is not null then
      update public.site_requests set contact_id = v_contact where id = v_id;
    end if;
  exception when others then
    raise warning 'contatto non creato per la richiesta %: %', v_id, sqlerrm;
  end;

  return v_id;
end;
$$;

revoke all on function site.invia_richiesta(uuid, text, jsonb, text) from public, anon, authenticated;
grant execute on function site.invia_richiesta(uuid, text, jsonb, text) to site_reader;

-- ---- Recupero delle richieste già arrivate ----------------------------------
-- Dalla più vecchia, così il contatto nasce dalla prima richiesta di ognuno. Lo spam si salta.
do $$
declare
  r record;
begin
  for r in
    select id, domain_id, tipo, dati
    from public.site_requests
    where contact_id is null and stato <> 'spam'
    order by created_at
  loop
    update public.site_requests
    set contact_id = public.contatto_da_richiesta(r.domain_id, r.tipo, r.dati, r.id)
    where id = r.id;
  end loop;
end;
$$;
