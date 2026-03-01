-- ============================================================
--  Build Saudi — Supabase Schema
--  Run this in Supabase → SQL Editor
-- ============================================================

-- ──────────────────────────────────────────────
--  1. VENDORS  (الموردون)
-- ──────────────────────────────────────────────
create table if not exists public.vendors (
  id                    uuid        primary key default gen_random_uuid(),
  establishment_name    text        not null,
  manager_name          text        not null,
  contact_number        text        not null,
  email                 text        not null unique,
  cr_number             text        not null unique,
  vendor_type           text        not null,
  -- 'direct_manufacturer' | 'authorized_distributor' | 'exclusive_agent' | 'project_supplier' | 'importer'
  represented_brands    text,
  has_warehouse         boolean     default false,
  offers_credit         boolean     default false,
  credit_limit          numeric,
  payment_terms         text[],
  -- ['bank_transfer','cheque','net30','net60']
  worked_on_gov_projects boolean    default false,
  status                text        not null default 'pending',
  -- 'pending' | 'active' | 'paused' | 'rejected'
  notes                 text,
  created_at            timestamptz default now()
);

alter table public.vendors enable row level security;
create policy "Service role manages vendors" on public.vendors using (false);
create policy "Anyone can register as vendor" on public.vendors for insert with check (true);

-- ──────────────────────────────────────────────
--  2. VENDOR_CATEGORIES  (فئات المورد)
-- ──────────────────────────────────────────────
create table if not exists public.vendor_categories (
  id          uuid  primary key default gen_random_uuid(),
  vendor_id   uuid  not null references public.vendors(id) on delete cascade,
  category    text  not null
);

alter table public.vendor_categories enable row level security;
create policy "Service role manages vendor_categories" on public.vendor_categories using (false);
create policy "Anyone can insert vendor_categories" on public.vendor_categories for insert with check (true);

-- ──────────────────────────────────────────────
--  3. VENDOR_REGIONS  (مناطق تغطية المورد)
-- ──────────────────────────────────────────────
create table if not exists public.vendor_regions (
  id          uuid  primary key default gen_random_uuid(),
  vendor_id   uuid  not null references public.vendors(id) on delete cascade,
  region      text  not null
);

alter table public.vendor_regions enable row level security;
create policy "Service role manages vendor_regions" on public.vendor_regions using (false);
create policy "Anyone can insert vendor_regions" on public.vendor_regions for insert with check (true);

-- ──────────────────────────────────────────────
--  4. FREIGHT_AGENTS  (وكلاء الشحن)
-- ──────────────────────────────────────────────
create table if not exists public.freight_agents (
  id              uuid  primary key default gen_random_uuid(),
  name            text  not null,
  contact_name    text,
  email           text  not null unique,
  phone           text,
  coverage_regions text[],
  status          text  not null default 'active',
  -- 'active' | 'paused'
  notes           text,
  created_at      timestamptz default now()
);

alter table public.freight_agents enable row level security;
create policy "Service role manages freight_agents" on public.freight_agents using (false);

-- ──────────────────────────────────────────────
--  5. QUOTES  (طلبات التسعير من العملاء)
-- ──────────────────────────────────────────────
create table if not exists public.quotes (
  id                uuid        primary key default gen_random_uuid(),
  project_name      text        not null,
  client_name       text        not null,
  phone             text        not null,
  materials         text        not null,
  boq_file_url      text,
  sheet_link        text,
  delivery_address  text        not null,
  delivery_date     date        not null,
  notes             text,
  status            text        not null default 'new',
  -- 'new' | 'admin_approved' | 'rfq_sent' | 'vendor_quotes_received'
  -- | 'freight_sent' | 'freight_received' | 'offer_sent'
  -- | 'client_approved' | 'payment_pending' | 'payment_confirmed' | 'in_delivery' | 'done' | 'cancelled'
  admin_notes       text,
  created_at        timestamptz default now()
);

alter table public.quotes enable row level security;
create policy "Anyone can submit a quote" on public.quotes for insert with check (true);
create policy "Service role reads quotes" on public.quotes for select using (false);

-- ──────────────────────────────────────────────
--  6. QUOTE_ITEMS  (أصناف طلب التسعير)
-- ──────────────────────────────────────────────
create table if not exists public.quote_items (
  id          uuid    primary key default gen_random_uuid(),
  quote_id    uuid    not null references public.quotes(id) on delete cascade,
  name        text    not null,
  description text,
  quantity    numeric,
  unit        text,
  category    text
);

alter table public.quote_items enable row level security;
create policy "Service role manages quote_items" on public.quote_items using (false);

-- ──────────────────────────────────────────────
--  7. RFQS  (طلبات عروض الأسعار للموردين)
-- ──────────────────────────────────────────────
create table if not exists public.rfqs (
  id              uuid        primary key default gen_random_uuid(),
  quote_id        uuid        not null references public.quotes(id) on delete cascade,
  vendor_id       uuid        not null references public.vendors(id) on delete cascade,
  sent_at         timestamptz default now(),
  deadline        date,
  status          text        not null default 'sent',
  -- 'sent' | 'received' | 'no_response' | 'rejected'
  email_message_id text,
  notes           text
);

alter table public.rfqs enable row level security;
create policy "Service role manages rfqs" on public.rfqs using (false);

-- ──────────────────────────────────────────────
--  8. RFQ_ITEMS  (أصناف كل RFQ)
-- ──────────────────────────────────────────────
create table if not exists public.rfq_items (
  id          uuid    primary key default gen_random_uuid(),
  rfq_id      uuid    not null references public.rfqs(id) on delete cascade,
  name        text    not null,
  description text,
  quantity    numeric,
  unit        text
);

alter table public.rfq_items enable row level security;
create policy "Service role manages rfq_items" on public.rfq_items using (false);

-- ──────────────────────────────────────────────
--  9. VENDOR_QUOTES  (عروض أسعار الموردين — يسجلها AI)
-- ──────────────────────────────────────────────
create table if not exists public.vendor_quotes (
  id              uuid        primary key default gen_random_uuid(),
  rfq_id          uuid        not null references public.rfqs(id) on delete cascade,
  vendor_id       uuid        not null references public.vendors(id) on delete cascade,
  total_price     numeric     not null,
  currency        text        not null default 'SAR',
  delivery_days   int,
  validity_days   int,
  items           jsonb,
  -- [{ name, qty, unit_price, total }]
  raw_email_text  text,
  source          text        default 'ai_agent',
  -- 'ai_agent' | 'manual'
  notes           text,
  created_at      timestamptz default now()
);

alter table public.vendor_quotes enable row level security;
create policy "Service role manages vendor_quotes" on public.vendor_quotes using (false);

-- ──────────────────────────────────────────────
--  10. FREIGHT_QUOTES  (عروض أسعار الشحن)
-- ──────────────────────────────────────────────
create table if not exists public.freight_quotes (
  id              uuid        primary key default gen_random_uuid(),
  quote_id        uuid        not null references public.quotes(id) on delete cascade,
  agent_id        uuid        not null references public.freight_agents(id) on delete cascade,
  price           numeric     not null,
  currency        text        not null default 'SAR',
  delivery_days   int,
  notes           text,
  status          text        not null default 'received',
  -- 'sent' | 'received' | 'selected' | 'rejected'
  created_at      timestamptz default now()
);

alter table public.freight_quotes enable row level security;
create policy "Service role manages freight_quotes" on public.freight_quotes using (false);

-- ──────────────────────────────────────────────
--  11. CLIENT_OFFERS  (العرض النهائي للعميل)
-- ──────────────────────────────────────────────
create table if not exists public.client_offers (
  id                  uuid        primary key default gen_random_uuid(),
  quote_id            uuid        not null references public.quotes(id) on delete cascade,
  materials_total     numeric     not null,
  freight_total       numeric     not null,
  grand_total         numeric     generated always as (materials_total + freight_total) stored,
  currency            text        not null default 'SAR',
  validity_days       int         default 7,
  items               jsonb,
  freight_agent_id    uuid        references public.freight_agents(id),
  status              text        not null default 'draft',
  -- 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  sent_at             timestamptz,
  client_response_at  timestamptz,
  notes               text,
  created_at          timestamptz default now()
);

alter table public.client_offers enable row level security;
create policy "Service role manages client_offers" on public.client_offers using (false);

-- ──────────────────────────────────────────────
--  12. PAYMENTS  (الحوالات البنكية)
-- ──────────────────────────────────────────────
create table if not exists public.payments (
  id              uuid        primary key default gen_random_uuid(),
  quote_id        uuid        not null references public.quotes(id) on delete cascade,
  offer_id        uuid        references public.client_offers(id),
  amount          numeric     not null,
  currency        text        not null default 'SAR',
  proof_file_url  text,
  bank_name       text,
  transfer_date   date,
  status          text        not null default 'pending',
  -- 'pending' | 'under_review' | 'confirmed' | 'rejected'
  confirmed_at    timestamptz,
  notes           text,
  created_at      timestamptz default now()
);

alter table public.payments enable row level security;
create policy "Anyone can submit payment proof" on public.payments for insert with check (true);
create policy "Service role reads payments" on public.payments for select using (false);

-- ──────────────────────────────────────────────
--  13. APPROVALS  (سجل الموافقات)
-- ──────────────────────────────────────────────
create table if not exists public.approvals (
  id            uuid        primary key default gen_random_uuid(),
  entity_type   text        not null,
  -- 'quote' | 'rfq' | 'client_offer' | 'payment' | 'vendor'
  entity_id     uuid        not null,
  stage         text        not null,
  -- 'accept_quote_request' | 'send_rfq' | 'approve_final_offer' | 'confirm_payment' | 'activate_vendor'
  action        text        not null,
  -- 'approved' | 'rejected'
  actor         text        not null default 'admin',
  notes         text,
  created_at    timestamptz default now()
);

alter table public.approvals enable row level security;
create policy "Service role manages approvals" on public.approvals using (false);

-- ──────────────────────────────────────────────
--  14. CONTRACTS  (عقود الموردين)
-- ──────────────────────────────────────────────

-- العقد الموحّد (الأدمن يرفع ملف PDF واحد فعّال في أي وقت)
create table if not exists public.contracts (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  file_url    text        not null,
  is_active   boolean     not null default true,
  created_by  text        not null default 'admin',
  created_at  timestamptz default now()
);

alter table public.contracts enable row level security;
create policy "Admin manages contracts" on public.contracts using (auth.role() = 'authenticated');
create policy "Public can read active contracts" on public.contracts for select using (is_active = true);

-- توقيعات الموردين على العقد
create table if not exists public.vendor_contract_signatures (
  id          uuid        primary key default gen_random_uuid(),
  contract_id uuid        not null references public.contracts(id) on delete cascade,
  vendor_id   uuid        not null references public.vendors(id) on delete cascade,
  token       uuid        not null unique default gen_random_uuid(),
  signed_at   timestamptz,
  ip_address  text,
  created_at  timestamptz default now(),
  unique(contract_id, vendor_id)
);

alter table public.vendor_contract_signatures enable row level security;
create policy "Admin manages signatures" on public.vendor_contract_signatures using (auth.role() = 'authenticated');
create policy "Public can sign via token" on public.vendor_contract_signatures for update using (true) with check (true);
create policy "Public can read via token" on public.vendor_contract_signatures for select using (true);

-- ──────────────────────────────────────────────
--  15. AGENT_LOGS  (سجل عمليات AI Agent)
-- ──────────────────────────────────────────────
create table if not exists public.agent_logs (
  id            uuid        primary key default gen_random_uuid(),
  action        text        not null,
  -- 'parse_vendor_email' | 'insert_vendor_quote' | 'send_rfq' | etc.
  source        text,
  -- 'email' | 'manual' | 'webhook'
  entity_type   text,
  entity_id     uuid,
  input_data    jsonb,
  output_data   jsonb,
  status        text        not null default 'success',
  -- 'success' | 'failed' | 'partial'
  error_message text,
  created_at    timestamptz default now()
);

alter table public.agent_logs enable row level security;
create policy "Service role manages agent_logs" on public.agent_logs using (false);
