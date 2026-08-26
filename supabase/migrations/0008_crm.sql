-- =====================================================================
-- 0008_crm.sql
-- Fondamenta CRM: contacts, deals (con pipeline configurabile), activities,
-- email_threads/messages, templates, outreach_campaigns.
-- Tutto scoped per domain_id (multi-tenant).
-- =====================================================================

-- ---- CONTACTS -------------------------------------------------------
create table if not exists public.contacts (
  id              uuid primary key default gen_random_uuid(),
  domain_id       uuid not null references public.network_domains(id) on delete restrict,
  agency_id       uuid references public.agencies(id) on delete set null,
  first_name      text,
  last_name       text,
  full_name       text,
  email           text,
  phone           text,
  role            text,                                    -- job title (CEO, Head of Marketing, ...)
  linkedin_url    text,
  source          text default 'manual',                   -- manual | snov | apollo | verified_checker | inbound
  source_meta     jsonb,
  status          text default 'new'
                    check (status in ('new','verified','unsubscribed','bounced','dnc')),
  tags            text[],
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists contacts_domain_idx  on public.contacts (domain_id);
create index if not exists contacts_agency_idx  on public.contacts (agency_id);
create index if not exists contacts_email_idx   on public.contacts (email);
create index if not exists contacts_status_idx  on public.contacts (status);
drop trigger if exists contacts_set_updated_at on public.contacts;
create trigger contacts_set_updated_at before update on public.contacts
  for each row execute function public.set_updated_at();

-- ---- DEAL STAGES (pipeline configurabile) ---------------------------
create table if not exists public.deal_stages (
  id              uuid primary key default gen_random_uuid(),
  domain_id       uuid not null references public.network_domains(id) on delete cascade,
  slug            text not null,
  name            text not null,
  order_index     int  not null default 0,
  color           text default '#64748b',
  probability     int  default 0,                          -- 0-100
  is_terminal_won boolean default false,
  is_terminal_lost boolean default false,
  created_at      timestamptz not null default now(),
  unique (domain_id, slug)
);
create index if not exists deal_stages_domain_idx on public.deal_stages (domain_id, order_index);

-- ---- DEALS ----------------------------------------------------------
create table if not exists public.deals (
  id                    uuid primary key default gen_random_uuid(),
  domain_id             uuid not null references public.network_domains(id) on delete restrict,
  agency_id             uuid references public.agencies(id) on delete set null,
  primary_contact_id    uuid references public.contacts(id) on delete set null,
  title                 text not null,
  stage_id              uuid references public.deal_stages(id) on delete set null,
  amount_eur            numeric(12,2),
  probability           int,                               -- override probabilità stage
  expected_close_date   date,
  actual_close_date     date,
  source                text default 'manual',             -- manual | outreach | inbound | referral
  owner_id              uuid references public.profiles(id) on delete set null,
  tags                  text[],
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists deals_domain_idx   on public.deals (domain_id);
create index if not exists deals_agency_idx   on public.deals (agency_id);
create index if not exists deals_stage_idx    on public.deals (stage_id);
create index if not exists deals_owner_idx    on public.deals (owner_id);
drop trigger if exists deals_set_updated_at on public.deals;
create trigger deals_set_updated_at before update on public.deals
  for each row execute function public.set_updated_at();

-- ---- ACTIVITIES (timeline: email/call/meeting/note/task) ------------
create table if not exists public.activities (
  id              uuid primary key default gen_random_uuid(),
  domain_id       uuid not null references public.network_domains(id) on delete restrict,
  agency_id       uuid references public.agencies(id) on delete set null,
  contact_id      uuid references public.contacts(id) on delete set null,
  deal_id         uuid references public.deals(id) on delete set null,
  type            text not null
                    check (type in ('email','call','meeting','note','task','sms','other')),
  direction       text check (direction in ('in','out')),  -- solo per email/call/sms
  subject         text,
  body            text,
  meta            jsonb,
  completed       boolean default false,                    -- rilevante per task
  due_at          timestamptz,
  author_id       uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists activities_domain_idx  on public.activities (domain_id);
create index if not exists activities_agency_idx  on public.activities (agency_id);
create index if not exists activities_contact_idx on public.activities (contact_id);
create index if not exists activities_deal_idx    on public.activities (deal_id);
create index if not exists activities_type_idx    on public.activities (type);
create index if not exists activities_due_idx     on public.activities (due_at) where completed = false;

-- ---- EMAIL THREADS + MESSAGES ---------------------------------------
create table if not exists public.email_threads (
  id                    uuid primary key default gen_random_uuid(),
  domain_id             uuid not null references public.network_domains(id) on delete restrict,
  agency_id             uuid references public.agencies(id) on delete set null,
  contact_id            uuid references public.contacts(id) on delete set null,
  deal_id               uuid references public.deals(id) on delete set null,
  subject               text,
  provider              text,                              -- postmark | smtp | ...
  provider_thread_id    text,
  message_count         int not null default 0,
  last_message_at       timestamptz,
  status                text default 'open'                -- open | closed
                          check (status in ('open','closed')),
  created_at            timestamptz not null default now()
);
create index if not exists email_threads_domain_idx  on public.email_threads (domain_id);
create index if not exists email_threads_contact_idx on public.email_threads (contact_id);
create index if not exists email_threads_status_idx  on public.email_threads (status);

create table if not exists public.email_messages (
  id                    uuid primary key default gen_random_uuid(),
  thread_id             uuid not null references public.email_threads(id) on delete cascade,
  direction             text not null check (direction in ('in','out')),
  from_email            text,
  from_name             text,
  to_email              text,
  to_name               text,
  cc                    text[],
  bcc                   text[],
  subject               text,
  body_html             text,
  body_text             text,
  provider_message_id   text,
  in_reply_to           text,
  classification        text,                              -- interested|not_interested|ooo|unsubscribe|question|spam|other
  sentiment             text,                              -- positive|neutral|negative
  suggested_reply       text,                              -- proposta reply_handler in attesa di approvazione
  suggested_action      text,                              -- send_reply|log_call|close_deal|dnc
  sent_at               timestamptz,
  received_at           timestamptz,
  status                text default 'sent'
                          check (status in ('draft','queued','sent','delivered','opened','bounced','spam','failed','received')),
  created_at            timestamptz not null default now()
);
create index if not exists email_messages_thread_idx     on public.email_messages (thread_id, created_at);
create index if not exists email_messages_direction_idx  on public.email_messages (direction);
create index if not exists email_messages_class_idx      on public.email_messages (classification);

-- ---- EMAIL TEMPLATES ------------------------------------------------
create table if not exists public.email_templates (
  id                uuid primary key default gen_random_uuid(),
  domain_id         uuid not null references public.network_domains(id) on delete restrict,
  name              text not null,
  category          text default 'cold',                  -- cold | follow_up | proposal | onboarding | other
  subject_template  text not null,
  body_template     text not null,                        -- markdown/handlebars-like {{agency_name}}
  variables         text[],                               -- lista variabili attese
  is_active         boolean default true,
  created_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists email_templates_domain_idx  on public.email_templates (domain_id);
drop trigger if exists email_templates_set_updated_at on public.email_templates;
create trigger email_templates_set_updated_at before update on public.email_templates
  for each row execute function public.set_updated_at();

-- ---- OUTREACH CAMPAIGNS ---------------------------------------------
create table if not exists public.outreach_campaigns (
  id                uuid primary key default gen_random_uuid(),
  domain_id         uuid not null references public.network_domains(id) on delete restrict,
  name              text not null,
  description       text,
  source            text default 'manual',                -- manual | verified_checker | segment
  source_meta       jsonb,                                 -- es. run_id di verified_checker
  template_id       uuid references public.email_templates(id) on delete set null,
  status            text default 'draft'
                      check (status in ('draft','scheduled','running','completed','paused','cancelled')),
  scheduled_at      timestamptz,
  started_at        timestamptz,
  completed_at      timestamptz,
  stats             jsonb default '{}'::jsonb,             -- {sent, delivered, opened, replied, bounced}
  created_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists outreach_campaigns_domain_idx on public.outreach_campaigns (domain_id);
create index if not exists outreach_campaigns_status_idx on public.outreach_campaigns (status);
drop trigger if exists outreach_campaigns_set_updated_at on public.outreach_campaigns;
create trigger outreach_campaigns_set_updated_at before update on public.outreach_campaigns
  for each row execute function public.set_updated_at();

-- ---- CAMPAIGN RECIPIENTS --------------------------------------------
create table if not exists public.campaign_recipients (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid not null references public.outreach_campaigns(id) on delete cascade,
  contact_id      uuid references public.contacts(id) on delete set null,
  agency_id       uuid references public.agencies(id) on delete set null,
  status          text default 'queued'
                    check (status in ('queued','sent','delivered','opened','clicked','replied','bounced','unsubscribed','failed','skipped')),
  sent_at         timestamptz,
  opened_at       timestamptz,
  first_reply_at  timestamptz,
  meta            jsonb,                                   -- provider_message_id, tracking pixel id, ...
  created_at      timestamptz not null default now()
);
create index if not exists campaign_recipients_campaign_idx on public.campaign_recipients (campaign_id);
create index if not exists campaign_recipients_status_idx   on public.campaign_recipients (status);
create index if not exists campaign_recipients_contact_idx  on public.campaign_recipients (contact_id);

-- ---- SEED default deal_stages per domini esistenti ------------------
insert into public.deal_stages (domain_id, slug, name, order_index, color, probability, is_terminal_won, is_terminal_lost)
select d.id, s.slug, s.name, s.order_index, s.color, s.probability, s.is_won, s.is_lost
  from public.network_domains d
  cross join (values
    ('lead',       'Lead',       10, '#64748b',   5, false, false),
    ('qualified',  'Qualificato',20, '#3b82f6',  20, false, false),
    ('proposal',   'Proposta',   30, '#eab308',  50, false, false),
    ('negotiation','Negoziazione',40,'#f97316',  70, false, false),
    ('won',        'Won',        50, '#10b981', 100, true,  false),
    ('lost',       'Lost',       60, '#ef4444',   0, false, true)
  ) as s(slug, name, order_index, color, probability, is_won, is_lost)
on conflict (domain_id, slug) do nothing;

-- ---- RLS ------------------------------------------------------------
alter table public.contacts             enable row level security;
alter table public.deal_stages          enable row level security;
alter table public.deals                enable row level security;
alter table public.activities           enable row level security;
alter table public.email_threads        enable row level security;
alter table public.email_messages       enable row level security;
alter table public.email_templates      enable row level security;
alter table public.outreach_campaigns   enable row level security;
alter table public.campaign_recipients  enable row level security;

-- Policy: read per qualsiasi utente autenticato; write per owner/coord/dev
do $$
declare tname text;
begin
  for tname in select unnest(array[
    'contacts','deal_stages','deals','activities',
    'email_threads','email_messages','email_templates',
    'outreach_campaigns','campaign_recipients'
  ])
  loop
    execute format('drop policy if exists %I_read_auth on public.%I;', tname, tname);
    execute format(
      'create policy %I_read_auth on public.%I for select using (auth.uid() is not null);',
      tname, tname
    );
    execute format('drop policy if exists %I_write_staff on public.%I;', tname, tname);
    execute format(
      'create policy %I_write_staff on public.%I for all using (' ||
      'exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in (''owner'',''coord'',''dev'')));',
      tname, tname
    );
  end loop;
end $$;
