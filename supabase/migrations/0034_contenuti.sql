-- =====================================================================
-- 0034_contenuti.sql
--   Contenuti editoriali del sito: articoli del magazine con categorie e
--   autori, e le pagine con testo redazionale (chi siamo, metodologia).
--   Prima stavano solo in WordPress; li gestisce la sezione Contenuti
--   del brain e il sito li legge dalle viste site.*.
--   - Testi in Markdown (body_md): li scrive l'editor del brain, il sito
--     li trasforma in HTML al build.
--   - Gli articoli stanno alla radice dell'URL (/{slug}/), come su
--     WordPress: lo slug non può coincidere con una competenza, un'area,
--     una pagina o un percorso riservato del sito, e non si cambia più
--     dopo la pubblicazione (è un URL indicizzato).
--   - Pubblica solo ciò che ha status 'publish' e una data: il sito
--     vede il resto solo al build successivo alla pubblicazione.
-- =====================================================================

-- ---- Autori e categorie -------------------------------------------------
create table if not exists public.content_authors (
  id          uuid primary key default gen_random_uuid(),
  domain_id   uuid not null references public.network_domains(id) on delete cascade,
  slug        text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null,
  bio         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (domain_id, slug)
);

create table if not exists public.article_categories (
  id          uuid primary key default gen_random_uuid(),
  domain_id   uuid not null references public.network_domains(id) on delete cascade,
  slug        text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (domain_id, slug)
);

-- ---- Articoli -----------------------------------------------------------
create table if not exists public.articles (
  id               uuid primary key default gen_random_uuid(),
  domain_id        uuid not null references public.network_domains(id) on delete cascade,
  slug             text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title            text not null,
  excerpt          text,
  body_md          text not null default '',
  cover_url        text,
  cover_alt        text,
  cover_width      int,
  cover_height     int,
  author_id        uuid references public.content_authors(id) on delete set null,
  status           text not null default 'draft' check (status in ('draft', 'publish')),
  published_at     timestamptz,
  seo_title        text,
  meta_description text,
  -- ID dell'articolo su WordPress: solo per gli importati, utile a ritrovarli.
  wp_id            bigint,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (domain_id, slug)
);

create table if not exists public.article_category_links (
  article_id  uuid not null references public.articles(id) on delete cascade,
  category_id uuid not null references public.article_categories(id) on delete cascade,
  primary key (article_id, category_id)
);

-- ---- Pagine con testo redazionale --------------------------------------
-- Una riga per pagina del sito che ha un testo modificabile (chi-siamo,
-- metodologia). La struttura della pagina resta nel codice del sito.
create table if not exists public.site_pages (
  id               uuid primary key default gen_random_uuid(),
  domain_id        uuid not null references public.network_domains(id) on delete cascade,
  slug             text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title            text not null,
  subtitle         text,
  body_md          text not null default '',
  seo_title        text,
  meta_description text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (domain_id, slug)
);

-- ---- updated_at ----------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['content_authors', 'article_categories', 'articles', 'site_pages'] loop
    execute format('drop trigger if exists %1$s_set_updated_at on public.%1$s', t);
    execute format('create trigger %1$s_set_updated_at before update on public.%1$s
                    for each row execute function public.set_updated_at()', t);
  end loop;
end
$$;

-- ---- Regole sugli slug degli articoli -----------------------------------
create or replace function public.articles_controlla_slug()
returns trigger
language plpgsql
as $$
begin
  -- Pubblicato una volta, lo slug è un URL indicizzato: non si cambia.
  if tg_op = 'UPDATE' and new.slug is distinct from old.slug and old.published_at is not null then
    raise exception 'Lo slug dell''articolo "%" non si può cambiare: è già stato pubblicato e il suo URL è indicizzato.', old.slug;
  end if;

  -- /{slug}/ è anche lo spazio di competenze, aree e pagine del sito.
  if new.slug in ('agenzie', 'agenzia', 'magazine', 'category', 'author', 'page', 'filtrate',
                  'chi-siamo', 'metodologia', 'manifesto', 'contatti', 'verifica-la-tua-agenzia')
     or exists (select 1 from public.agency_skills s where s.domain_id = new.domain_id and s.slug = new.slug)
     or exists (select 1 from public.areas a where a.domain_id = new.domain_id and a.slug = new.slug)
     or exists (select 1 from public.site_pages p where p.domain_id = new.domain_id and p.slug = new.slug) then
    raise exception 'Lo slug "%" è già usato dal sito (competenza, area o pagina): scegline un altro.', new.slug;
  end if;

  return new;
end
$$;

drop trigger if exists articles_controlla_slug on public.articles;
create trigger articles_controlla_slug
  before insert or update of slug, domain_id on public.articles
  for each row
  execute function public.articles_controlla_slug();

revoke execute on function public.articles_controlla_slug() from public, anon, authenticated;

-- ---- Accessi -------------------------------------------------------------
-- Il brain scrive dalle sue API con la service role; nessun accesso diretto.
alter table public.content_authors enable row level security;
alter table public.article_categories enable row level security;
alter table public.articles enable row level security;
alter table public.article_category_links enable row level security;
alter table public.site_pages enable row level security;
revoke all on public.content_authors, public.article_categories, public.articles,
              public.article_category_links, public.site_pages from anon, authenticated;

-- ---- Viste per il sito ---------------------------------------------------
-- Solo gli articoli pubblicati, con autore e categorie già risolti.
create or replace view site.articles as
select
  a.domain_id, a.slug, a.title, a.excerpt, a.body_md,
  a.cover_url, a.cover_alt, a.cover_width, a.cover_height,
  a.published_at, a.updated_at, a.seo_title, a.meta_description,
  au.slug as author_slug, au.name as author_name,
  coalesce(
    (select array_agg(c.slug order by c.name)
     from public.article_category_links l
     join public.article_categories c on c.id = l.category_id
     where l.article_id = a.id),
    '{}'::text[]
  ) as category_slugs
from public.articles a
left join public.content_authors au on au.id = a.author_id
where a.status = 'publish' and a.published_at is not null;

create or replace view site.article_categories as
select domain_id, slug, name, description from public.article_categories;

create or replace view site.content_authors as
select domain_id, slug, name, bio from public.content_authors;

create or replace view site.pages as
select domain_id, slug, title, subtitle, body_md, seo_title, meta_description, updated_at
from public.site_pages;

revoke all on site.articles, site.article_categories, site.content_authors, site.pages
  from public, anon, authenticated;
grant select on site.articles, site.article_categories, site.content_authors, site.pages to site_reader;
