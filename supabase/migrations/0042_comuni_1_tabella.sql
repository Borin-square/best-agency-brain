-- =====================================================================
-- 0042_comuni_1_tabella.sql
--   Prima parte della tabella dei comuni italiani, per le sedi delle
--   agenzie (docs/sedi-progetto.md). Non cambia niente nel brain né sul sito.
--   1. comuni: elenco ISTAT (codice, nome, sigla della provincia). Le righe
--      arrivano con 0042_comuni_2..5.
--   2. areas.sigla: la sigla della provincia sulle 107 città, per passare
--      da un comune alla sua area (areas è per dominio, i comuni no).
-- Fonte: https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.csv
-- (scaricato il 24/11/2026: 7.896 comuni, 107 province).
-- Idempotente.
-- =====================================================================
begin;

create table if not exists public.comuni (
  codice     text primary key,       -- codice ISTAT alfanumerico, es. '001272'
  nome       text not null,          -- 'Torino'
  nome_altro text,                   -- comuni bilingui: 'Bozen'
  sigla      text not null,          -- sigla della provincia: 'TO'
  capoluogo  boolean not null default false
);

create index if not exists comuni_sigla_idx on public.comuni (sigla);
-- Autocompletamento: ricerca per nome senza accenti né punteggiatura.
create index if not exists comuni_nome_idx on public.comuni (public.normalizza_luogo(nome));

alter table public.comuni enable row level security;
revoke all on public.comuni from anon, authenticated;

-- L'utente di sola lettura per le analisi (brain_ro), se esiste, legge anche questa tabella.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'brain_ro')
     and not exists (select 1 from pg_policies where tablename = 'comuni' and policyname = 'brain_ro_select') then
    create policy brain_ro_select on public.comuni for select to brain_ro using (true);
  end if;
end $$;

-- ---- Sigla della provincia sulle città --------------------------------
alter table public.areas add column if not exists sigla text;
create unique index if not exists areas_domain_sigla_key on public.areas (domain_id, sigla) where sigla is not null;

create temp table sigle (slug text, sigla text) on commit drop;
insert into sigle values
  ('agrigento', 'AG'),
  ('alessandria', 'AL'),
  ('ancona', 'AN'),
  ('aosta', 'AO'),
  ('ascoli-piceno', 'AP'),
  ('laquila', 'AQ'),
  ('arezzo', 'AR'),
  ('asti', 'AT'),
  ('avellino', 'AV'),
  ('bari', 'BA'),
  ('bergamo', 'BG'),
  ('biella', 'BI'),
  ('belluno', 'BL'),
  ('benevento', 'BN'),
  ('bologna', 'BO'),
  ('brindisi', 'BR'),
  ('brescia', 'BS'),
  ('barletta-andria-trani', 'BT'),
  ('bolzano', 'BZ'),
  ('cagliari', 'CA'),
  ('campobasso', 'CB'),
  ('caserta', 'CE'),
  ('chieti', 'CH'),
  ('caltanissetta', 'CL'),
  ('cuneo', 'CN'),
  ('como', 'CO'),
  ('cremona', 'CR'),
  ('cosenza', 'CS'),
  ('catania', 'CT'),
  ('catanzaro', 'CZ'),
  ('enna', 'EN'),
  ('forli-cesena', 'FC'),
  ('ferrara', 'FE'),
  ('foggia', 'FG'),
  ('firenze', 'FI'),
  ('fermo', 'FM'),
  ('frosinone', 'FR'),
  ('genova', 'GE'),
  ('gorizia', 'GO'),
  ('grosseto', 'GR'),
  ('imperia', 'IM'),
  ('isernia', 'IS'),
  ('crotone', 'KR'),
  ('lecco', 'LC'),
  ('lecce', 'LE'),
  ('livorno', 'LI'),
  ('lodi', 'LO'),
  ('latina', 'LT'),
  ('lucca', 'LU'),
  ('monza-e-della-brianza', 'MB'),
  ('macerata', 'MC'),
  ('messina', 'ME'),
  ('milano', 'MI'),
  ('mantova', 'MN'),
  ('modena', 'MO'),
  ('massa-carrara', 'MS'),
  ('matera', 'MT'),
  ('napoli', 'NA'),
  ('novara', 'NO'),
  ('nuoro', 'NU'),
  ('oristano', 'OR'),
  ('palermo', 'PA'),
  ('piacenza', 'PC'),
  ('padova', 'PD'),
  ('pescara', 'PE'),
  ('perugia', 'PG'),
  ('pisa', 'PI'),
  ('pordenone', 'PN'),
  ('prato', 'PO'),
  ('parma', 'PR'),
  ('pistoia', 'PT'),
  ('pesaro-e-urbino', 'PU'),
  ('pavia', 'PV'),
  ('potenza', 'PZ'),
  ('ravenna', 'RA'),
  ('reggio-calabria', 'RC'),
  ('reggio-emilia', 'RE'),
  ('ragusa', 'RG'),
  ('rieti', 'RI'),
  ('roma', 'RM'),
  ('rimini', 'RN'),
  ('rovigo', 'RO'),
  ('salerno', 'SA'),
  ('siena', 'SI'),
  ('sondrio', 'SO'),
  ('la-spezia', 'SP'),
  ('siracusa', 'SR'),
  ('sassari', 'SS'),
  ('sud-sardegna', 'SU'),
  ('savona', 'SV'),
  ('taranto', 'TA'),
  ('teramo', 'TE'),
  ('trento', 'TN'),
  ('torino', 'TO'),
  ('trapani', 'TP'),
  ('terni', 'TR'),
  ('trieste', 'TS'),
  ('treviso', 'TV'),
  ('udine', 'UD'),
  ('varese', 'VA'),
  ('verbano-cusio-ossola', 'VB'),
  ('vercelli', 'VC'),
  ('venezia', 'VE'),
  ('vicenza', 'VI'),
  ('verona', 'VR'),
  ('viterbo', 'VT'),
  ('vibo-valentia', 'VV');

update public.areas a
set sigla = s.sigla
from sigle s
where a.slug = s.slug and a.tipo = 'citta'
  and a.domain_id = (select id from public.network_domains where domain = 'miglioreagenzia.it')
  and a.sigla is distinct from s.sigla;

-- Si ferma se una delle 107 città resta senza sigla.
do $$
declare mancanti text;
begin
  select string_agg(slug, ', ') into mancanti
  from public.areas
  where tipo = 'citta' and sigla is null
    and domain_id = (select id from public.network_domains where domain = 'miglioreagenzia.it');
  if mancanti is not null then
    raise exception 'Città senza sigla: %', mancanti;
  end if;
end $$;

select count(*) as citta_con_sigla
from public.areas
where tipo = 'citta' and sigla is not null;

commit;
