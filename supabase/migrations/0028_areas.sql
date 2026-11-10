-- =====================================================================
-- 0028_areas.sql
--   1. areas: regioni e province (le "città" degli URL) per dominio, con
--      slug identici ai termini `area` del WordPress live.
--   2. agency_areas: agenzia ↔ area, ricavata dal testo libero `agencies.aree`.
--   3. aree_da_testo(): riconosce le aree in una stringa come "Lombardia>Milano"
--      anche quando è scritta male (spazi, ordine invertito, più luoghi).
--   4. Trigger: quando un agente riscrive `aree`, agency_areas si riallinea.
--   5. agency_areas_da_rivedere: le agenzie che il riconoscimento non risolve.
--   6. Viste site.areas e site.agency_areas per il sito.
--
-- `agencies.aree` resta la fonte che gli agenti scrivono; agency_areas è il
-- dato strutturato che il sito legge. Per correggere un'agenzia si corregge
-- `aree` (o si aggiunge un alias all'area) e il trigger fa il resto.
-- =====================================================================

-- ---- 1. areas ----------------------------------------------------------
create table if not exists public.areas (
  id          uuid primary key default gen_random_uuid(),
  domain_id   uuid not null references public.network_domains(id),
  slug        text not null,
  nome        text not null,
  -- 'citta' come in agency_features.area_type e network_domains.starred_areas,
  -- anche se in Italia sono province (Monza e della Brianza, Forlì-Cesena).
  tipo        text not null check (tipo in ('regione', 'citta')),
  parent_id   uuid references public.areas(id),
  -- Il luogo come compare nei testi: "a Milano", "nel Lazio", "all'Aquila".
  luogo       text not null,
  -- Altri modi in cui il luogo compare nel testo libero degli agenti.
  alias       text[] not null default '{}',
  descrizione text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (domain_id, slug),
  check ((tipo = 'regione') = (parent_id is null))
);

create index if not exists areas_parent_idx on public.areas (parent_id);

drop trigger if exists areas_set_updated_at on public.areas;
create trigger areas_set_updated_at
  before update on public.areas
  for each row execute function public.set_updated_at();

alter table public.areas enable row level security;

-- ---- 2. agency_areas ---------------------------------------------------
-- Più righe per agenzia sono ammesse (sedi in più città). Un'agenzia è
-- legata alla città quando la si riconosce, alla sola regione altrimenti:
-- l'archivio della regione include le agenzie delle sue città.
create table if not exists public.agency_areas (
  agency_id  uuid not null references public.agencies(id) on delete cascade,
  area_id    uuid not null references public.areas(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (agency_id, area_id)
);

create index if not exists agency_areas_area_idx on public.agency_areas (area_id);

alter table public.agency_areas enable row level security;

-- Le tabelle nuove in public ricevono i grant di default di Supabase per anon
-- e authenticated; la RLS senza policy già blocca, ma non c'è motivo di lasciarli.
revoke all on public.areas, public.agency_areas from anon, authenticated;

-- ---- Seed: regioni e province d'Italia ---------------------------------
-- Nomi e slug come i termini `area` del live (verificati via WP-CLI il
-- 10/11/2026); le province che il live non ha seguono la stessa regola di
-- slug di WordPress (sanitize_title).
with dominio as (
  select id from public.network_domains where domain = 'miglioreagenzia.it'
),
regioni(slug, nome, luogo, alias) as (values
  ('abruzzo', 'Abruzzo', 'in Abruzzo', '{}'::text[]),
  ('basilicata', 'Basilicata', 'in Basilicata', '{}'),
  ('calabria', 'Calabria', 'in Calabria', '{}'),
  ('campania', 'Campania', 'in Campania', '{}'),
  ('emilia-romagna', 'Emilia-Romagna', 'in Emilia-Romagna', '{}'),
  ('friuli-venezia-giulia', 'Friuli-Venezia Giulia', 'in Friuli-Venezia Giulia', '{"Friuli"}'),
  ('lazio', 'Lazio', 'nel Lazio', '{}'),
  ('liguria', 'Liguria', 'in Liguria', '{}'),
  ('lombardia', 'Lombardia', 'in Lombardia', '{}'),
  ('marche', 'Marche', 'nelle Marche', '{}'),
  ('molise', 'Molise', 'in Molise', '{}'),
  ('piemonte', 'Piemonte', 'in Piemonte', '{}'),
  ('puglia', 'Puglia', 'in Puglia', '{}'),
  ('sardegna', 'Sardegna', 'in Sardegna', '{}'),
  ('sicilia', 'Sicilia', 'in Sicilia', '{}'),
  ('toscana', 'Toscana', 'in Toscana', '{}'),
  ('trentino-alto-adige', 'Trentino-Alto Adige', 'in Trentino-Alto Adige', '{"Trentino"}'),
  ('umbria', 'Umbria', 'in Umbria', '{}'),
  ('valle-daosta', 'Valle d''Aosta', 'in Valle d''Aosta', '{"Valle Aosta"}'),
  ('veneto', 'Veneto', 'in Veneto', '{}')
),
citta(regione, slug, nome, luogo, alias) as (values
  ('abruzzo', 'chieti', 'Chieti', null, '{}'::text[]),
  ('abruzzo', 'laquila', 'L''Aquila', 'all''Aquila', '{}'),
  ('abruzzo', 'pescara', 'Pescara', null, '{}'),
  ('abruzzo', 'teramo', 'Teramo', null, '{}'),
  ('basilicata', 'matera', 'Matera', null, '{}'),
  ('basilicata', 'potenza', 'Potenza', null, '{}'),
  ('calabria', 'catanzaro', 'Catanzaro', null, '{}'),
  ('calabria', 'cosenza', 'Cosenza', null, '{}'),
  ('calabria', 'crotone', 'Crotone', null, '{}'),
  ('calabria', 'reggio-calabria', 'Reggio Calabria', null, '{}'),
  ('calabria', 'vibo-valentia', 'Vibo Valentia', null, '{}'),
  ('campania', 'avellino', 'Avellino', null, '{}'),
  ('campania', 'benevento', 'Benevento', null, '{}'),
  ('campania', 'caserta', 'Caserta', null, '{}'),
  ('campania', 'napoli', 'Napoli', null, '{}'),
  ('campania', 'salerno', 'Salerno', null, '{}'),
  ('emilia-romagna', 'bologna', 'Bologna', null, '{}'),
  ('emilia-romagna', 'ferrara', 'Ferrara', null, '{}'),
  ('emilia-romagna', 'forli-cesena', 'Forlì-Cesena', null, '{"Forlì","Cesena"}'),
  ('emilia-romagna', 'modena', 'Modena', null, '{}'),
  ('emilia-romagna', 'parma', 'Parma', null, '{}'),
  ('emilia-romagna', 'piacenza', 'Piacenza', null, '{}'),
  ('emilia-romagna', 'ravenna', 'Ravenna', null, '{}'),
  ('emilia-romagna', 'reggio-emilia', 'Reggio Emilia', null, '{"Reggio nell''Emilia"}'),
  ('emilia-romagna', 'rimini', 'Rimini', null, '{}'),
  ('friuli-venezia-giulia', 'gorizia', 'Gorizia', null, '{}'),
  ('friuli-venezia-giulia', 'pordenone', 'Pordenone', null, '{}'),
  ('friuli-venezia-giulia', 'trieste', 'Trieste', null, '{}'),
  ('friuli-venezia-giulia', 'udine', 'Udine', null, '{}'),
  ('lazio', 'frosinone', 'Frosinone', null, '{}'),
  ('lazio', 'latina', 'Latina', null, '{}'),
  ('lazio', 'rieti', 'Rieti', null, '{}'),
  ('lazio', 'roma', 'Roma', null, '{}'),
  ('lazio', 'viterbo', 'Viterbo', null, '{}'),
  ('liguria', 'genova', 'Genova', null, '{}'),
  ('liguria', 'imperia', 'Imperia', null, '{"Sanremo"}'),
  ('liguria', 'la-spezia', 'La Spezia', 'alla Spezia', '{}'),
  ('liguria', 'savona', 'Savona', null, '{}'),
  ('lombardia', 'bergamo', 'Bergamo', null, '{}'),
  ('lombardia', 'brescia', 'Brescia', null, '{}'),
  ('lombardia', 'como', 'Como', null, '{}'),
  ('lombardia', 'cremona', 'Cremona', null, '{}'),
  ('lombardia', 'lecco', 'Lecco', null, '{}'),
  ('lombardia', 'lodi', 'Lodi', null, '{}'),
  ('lombardia', 'mantova', 'Mantova', null, '{}'),
  ('lombardia', 'milano', 'Milano', null, '{}'),
  ('lombardia', 'monza-e-della-brianza', 'Monza e della Brianza', null, '{"Monza e Brianza","Monza"}'),
  ('lombardia', 'pavia', 'Pavia', null, '{}'),
  ('lombardia', 'sondrio', 'Sondrio', null, '{}'),
  ('lombardia', 'varese', 'Varese', null, '{}'),
  ('marche', 'ancona', 'Ancona', null, '{}'),
  ('marche', 'ascoli-piceno', 'Ascoli Piceno', null, '{}'),
  ('marche', 'fermo', 'Fermo', null, '{}'),
  ('marche', 'macerata', 'Macerata', null, '{}'),
  ('marche', 'pesaro-e-urbino', 'Pesaro e Urbino', null, '{"Pesaro","Urbino"}'),
  ('molise', 'campobasso', 'Campobasso', null, '{}'),
  ('molise', 'isernia', 'Isernia', null, '{}'),
  ('piemonte', 'alessandria', 'Alessandria', null, '{}'),
  ('piemonte', 'asti', 'Asti', null, '{}'),
  ('piemonte', 'biella', 'Biella', null, '{}'),
  ('piemonte', 'cuneo', 'Cuneo', null, '{}'),
  ('piemonte', 'novara', 'Novara', null, '{}'),
  ('piemonte', 'torino', 'Torino', null, '{}'),
  ('piemonte', 'verbano-cusio-ossola', 'Verbano-Cusio-Ossola', null, '{"Verbania"}'),
  ('piemonte', 'vercelli', 'Vercelli', null, '{}'),
  ('puglia', 'bari', 'Bari', null, '{}'),
  ('puglia', 'barletta-andria-trani', 'Barletta-Andria-Trani', null, '{"Barletta","Andria","Trani"}'),
  ('puglia', 'brindisi', 'Brindisi', null, '{}'),
  ('puglia', 'foggia', 'Foggia', null, '{}'),
  ('puglia', 'lecce', 'Lecce', null, '{}'),
  ('puglia', 'taranto', 'Taranto', null, '{}'),
  ('sardegna', 'cagliari', 'Cagliari', null, '{}'),
  ('sardegna', 'nuoro', 'Nuoro', null, '{}'),
  ('sardegna', 'oristano', 'Oristano', null, '{}'),
  ('sardegna', 'sassari', 'Sassari', null, '{"Olbia"}'),
  ('sardegna', 'sud-sardegna', 'Sud Sardegna', null, '{}'),
  ('sicilia', 'agrigento', 'Agrigento', null, '{}'),
  ('sicilia', 'caltanissetta', 'Caltanissetta', null, '{}'),
  ('sicilia', 'catania', 'Catania', null, '{}'),
  ('sicilia', 'enna', 'Enna', null, '{}'),
  ('sicilia', 'messina', 'Messina', null, '{}'),
  ('sicilia', 'palermo', 'Palermo', null, '{}'),
  ('sicilia', 'ragusa', 'Ragusa', null, '{}'),
  ('sicilia', 'siracusa', 'Siracusa', null, '{}'),
  ('sicilia', 'trapani', 'Trapani', null, '{}'),
  ('toscana', 'arezzo', 'Arezzo', null, '{}'),
  ('toscana', 'firenze', 'Firenze', null, '{}'),
  ('toscana', 'grosseto', 'Grosseto', null, '{}'),
  ('toscana', 'livorno', 'Livorno', null, '{}'),
  ('toscana', 'lucca', 'Lucca', null, '{"Viareggio"}'),
  ('toscana', 'massa-carrara', 'Massa-Carrara', null, '{"Massa","Carrara"}'),
  ('toscana', 'pisa', 'Pisa', null, '{}'),
  ('toscana', 'pistoia', 'Pistoia', null, '{}'),
  ('toscana', 'prato', 'Prato', null, '{}'),
  ('toscana', 'siena', 'Siena', null, '{}'),
  ('trentino-alto-adige', 'bolzano', 'Bolzano', null, '{"Bozen","Alto Adige","Südtirol","Sudtirol"}'),
  ('trentino-alto-adige', 'trento', 'Trento', null, '{}'),
  ('umbria', 'perugia', 'Perugia', null, '{}'),
  ('umbria', 'terni', 'Terni', null, '{}'),
  ('valle-daosta', 'aosta', 'Aosta', null, '{}'),
  ('veneto', 'belluno', 'Belluno', null, '{}'),
  ('veneto', 'padova', 'Padova', null, '{"Selvazzano Dentro"}'),
  ('veneto', 'rovigo', 'Rovigo', null, '{}'),
  ('veneto', 'treviso', 'Treviso', null, '{}'),
  ('veneto', 'venezia', 'Venezia', null, '{"Mestre"}'),
  ('veneto', 'verona', 'Verona', null, '{}'),
  ('veneto', 'vicenza', 'Vicenza', null, '{}')
),
ins_regioni as (
  insert into public.areas (domain_id, slug, nome, tipo, luogo, alias)
  select d.id, r.slug, r.nome, 'regione', r.luogo, r.alias
  from regioni r cross join dominio d
  on conflict (domain_id, slug) do nothing
  returning id, slug
)
insert into public.areas (domain_id, slug, nome, tipo, parent_id, luogo, alias)
select d.id, c.slug, c.nome, 'citta', p.id, coalesce(c.luogo, 'a ' || c.nome), c.alias
from citta c
cross join dominio d
join ins_regioni p on p.slug = c.regione
on conflict (domain_id, slug) do nothing;

-- ---- 3. Riconoscimento delle aree nel testo libero ---------------------
-- Testo minuscolo, senza accenti, con un solo spazio fra parole:
-- "Lombardia> Monza e Brianza " -> "lombardia monza e brianza".
create or replace function public.normalizza_luogo(testo text)
returns text
language sql
immutable
as $$
  select trim(regexp_replace(
    translate(lower(coalesce(testo, '')), 'àáâäèéêëìíîïòóôöùúûüç', 'aaaaeeeeiiiioooouuuuc'),
    '[^a-z0-9]+', ' ', 'g'))
$$;

-- Aree del dominio nominate nel testo. Cerca nomi e alias come parole
-- intere, dal più lungo al più corto, e toglie dal testo ogni nome trovato:
-- così "Valle d'Aosta" non trova anche Aosta e "Reggio Emilia" non trova
-- l'Emilia-Romagna. Se trova delle città, scarta le regioni che le
-- contengono ("Lombardia>Milano" -> solo Milano).
create or replace function public.aree_da_testo(p_domain_id uuid, p_testo text)
returns setof uuid
language plpgsql
stable
as $$
declare
  resto   text := ' ' || public.normalizza_luogo(p_testo) || ' ';
  trovate uuid[] := '{}';
  r       record;
begin
  if trim(resto) = '' then
    return;
  end if;

  for r in
    select a.id, n.forma
    from public.areas a
    cross join lateral (
      select public.normalizza_luogo(f) as forma
      from unnest(array[a.nome] || a.alias) as f
    ) n
    where a.domain_id = p_domain_id and n.forma <> ''
    order by length(n.forma) desc
  loop
    if position(' ' || r.forma || ' ' in resto) > 0 then
      resto := replace(resto, ' ' || r.forma || ' ', ' ');
      if not r.id = any(trovate) then
        trovate := trovate || r.id;
      end if;
    end if;
  end loop;

  return query
    select a.id
    from public.areas a
    where a.id = any(trovate)
      and not (a.tipo = 'regione' and exists (
        select 1 from public.areas c where c.parent_id = a.id and c.id = any(trovate)));
end
$$;

-- ---- 4. Allineamento agency_areas <- agencies.aree ---------------------
-- security definer: chiunque scriva su agencies (service role degli agenti,
-- dashboard) aggiorna agency_areas anche senza permessi diretti su di essa.
create or replace function public.allinea_agency_areas(p_agency_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.agency_areas where agency_id = p_agency_id;
  insert into public.agency_areas (agency_id, area_id)
  select a.id, x
  from public.agencies a
  cross join lateral public.aree_da_testo(a.domain_id, a.aree) x
  where a.id = p_agency_id
  on conflict do nothing;
$$;

create or replace function public.agencies_allinea_aree()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.allinea_agency_areas(new.id);
  return new;
end
$$;

drop trigger if exists agencies_allinea_aree on public.agencies;
create trigger agencies_allinea_aree
  after insert or update of aree, domain_id on public.agencies
  for each row
  execute function public.agencies_allinea_aree();

-- Riallinea tutto: da lanciare dopo aver cambiato nomi o alias in areas.
create or replace function public.riallinea_tutte_agency_areas()
returns integer
language plpgsql
as $$
declare
  n integer := 0;
  r record;
begin
  for r in select id from public.agencies loop
    perform public.allinea_agency_areas(r.id);
    n := n + 1;
  end loop;
  return n;
end
$$;

-- Le funzioni in public sono chiamabili dall'API come RPC: tolte ad anon e
-- authenticated quelle che scrivono.
revoke execute on function public.allinea_agency_areas(uuid),
  public.agencies_allinea_aree(),
  public.riallinea_tutte_agency_areas()
  from public, anon, authenticated;

select public.riallinea_tutte_agency_areas();

-- ---- 5. Agenzie da rivedere --------------------------------------------
-- Nessuna area riconosciuta pur avendo `aree`, solo regioni, o più di una
-- città. security_invoker: la vista rispetta la RLS di chi la interroga,
-- quindi l'API pubblica non la vede.
create or replace view public.agency_areas_da_rivedere
with (security_invoker = true) as
select
  g.id as agency_id,
  g.title,
  g.publish_status,
  g.aree,
  coalesce(array_agg(ar.slug order by ar.slug) filter (where ar.id is not null), '{}') as aree_riconosciute,
  case
    when count(ar.id) = 0 then 'nessuna area riconosciuta'
    when bool_and(ar.tipo = 'regione') then 'solo regione'
    else 'più città'
  end as motivo
from public.agencies g
left join public.agency_areas aa on aa.agency_id = g.id
left join public.areas ar on ar.id = aa.area_id
where nullif(trim(g.aree), '') is not null
group by g.id
having count(ar.id) = 0
    or bool_and(ar.tipo = 'regione')
    or count(ar.id) filter (where ar.tipo = 'citta') > 1;

revoke all on public.agency_areas_da_rivedere from anon, authenticated;

-- ---- 6. Viste per il sito ----------------------------------------------
create or replace view site.areas as
select a.id, a.domain_id, a.slug, a.nome, a.tipo, p.slug as parent_slug, a.luogo, a.descrizione
from public.areas a
left join public.areas p on p.id = a.parent_id;

create or replace view site.agency_areas as
select aa.agency_id, ar.slug as area_slug, ar.tipo as area_tipo
from public.agency_areas aa
join public.areas ar on ar.id = aa.area_id
join public.agencies g on g.id = aa.agency_id and g.publish_status = 'publish';

revoke all on site.areas, site.agency_areas from public, anon, authenticated;
grant select on site.areas, site.agency_areas to site_reader;
