-- ============================================================
--  Build Saudi — Migration Script
--  تشغيل هذا في Supabase → SQL Editor
--  يصلح التناقضات بين الكود والـ schema
-- ============================================================

-- ─────────────────────────────────────
-- 1. إضافة client_email لجدول quotes
--    (الكود يستخدمه لكن لم يكن موجوداً)
-- ─────────────────────────────────────
alter table public.quotes
  add column if not exists client_email text;

-- ─────────────────────────────────────
-- 2. إصلاح جدول client_offers
--    أ) إضافة الحقول الناقصة
-- ─────────────────────────────────────
alter table public.client_offers
  add column if not exists offer_token  uuid unique,
  add column if not exists expires_at   timestamptz,
  add column if not exists platform_fee numeric not null default 0;

-- ─────────────────────────────────────
--    ب) تحويل grand_total من generated إلى عمود عادي
--       (الكود يُدخله مباشرة — لا يصلح generated)
-- ─────────────────────────────────────
alter table public.client_offers
  drop column if exists grand_total;

alter table public.client_offers
  add column if not exists grand_total numeric;

-- ─────────────────────────────────────
-- 3. جعل agent_id اختيارياً في freight_quotes
--    (الكود لا يُرسل agent_id — الشحن يُدخل يدوياً)
-- ─────────────────────────────────────
alter table public.freight_quotes
  alter column agent_id drop not null;

-- ─────────────────────────────────────
-- 4. RLS: العروض العامة تُقرأ عبر server routes بالتوكن
-- ─────────────────────────────────────
drop policy if exists "Service role manages client_offers" on public.client_offers;

create policy "Service role manages client_offers"
  on public.client_offers using (false);

drop policy if exists "Public can read offer by token" on public.client_offers;

-- ─────────────────────────────────────
-- 5. Storage bucket لملفات BOQ والعقود
--    يجب إنشاؤه من واجهة Supabase → Storage
--    اسم الـ bucket: documents
--    النوع: Public
-- ─────────────────────────────────────
-- insert into storage.buckets (id, name, public)
-- values ('documents', 'documents', true)
-- on conflict do nothing;

-- ─────────────────────────────────────
-- 6. إضافة unique constraint على rfq_id في vendor_quotes
--    (الكود يستخدم upsert مع onConflict: "rfq_id")
-- ─────────────────────────────────────
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vendor_quotes_rfq_id_unique'
      and conrelid = 'public.vendor_quotes'::regclass
  ) then
    alter table public.vendor_quotes
      add constraint vendor_quotes_rfq_id_unique unique (rfq_id);
  end if;
end $$;

-- ─────────────────────────────────────
-- 7. إضافة updated_at للجداول الرئيسية
-- ─────────────────────────────────────
alter table public.quotes
  add column if not exists updated_at timestamptz default now();

alter table public.vendors
  add column if not exists updated_at timestamptz default now();

alter table public.client_offers
  add column if not exists updated_at timestamptz default now();

alter table public.vendor_quotes
  add column if not exists updated_at timestamptz default now();

alter table public.quote_items
  add column if not exists created_at timestamptz default now();

alter table public.rfqs
  add column if not exists created_at timestamptz default now();

-- Trigger لتحديث updated_at تلقائياً عند أي تعديل
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists quotes_updated_at on public.quotes;
create trigger quotes_updated_at
  before update on public.quotes
  for each row execute function public.set_updated_at();

drop trigger if exists vendors_updated_at on public.vendors;
create trigger vendors_updated_at
  before update on public.vendors
  for each row execute function public.set_updated_at();

drop trigger if exists client_offers_updated_at on public.client_offers;
create trigger client_offers_updated_at
  before update on public.client_offers
  for each row execute function public.set_updated_at();

drop trigger if exists vendor_quotes_updated_at on public.vendor_quotes;
create trigger vendor_quotes_updated_at
  before update on public.vendor_quotes
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────
-- 8. إضافة Indexes للأداء
-- ─────────────────────────────────────
create index if not exists idx_quotes_status on public.quotes(status);
create index if not exists idx_quotes_created_at on public.quotes(created_at desc);
create index if not exists idx_vendors_status on public.vendors(status);
create index if not exists idx_rfqs_quote_id on public.rfqs(quote_id);
create index if not exists idx_rfqs_vendor_id on public.rfqs(vendor_id);
create index if not exists idx_rfqs_created_at on public.rfqs(created_at);
create index if not exists idx_quote_items_quote_id on public.quote_items(quote_id);
create index if not exists idx_quote_items_created_at on public.quote_items(created_at);
create index if not exists idx_rfq_items_rfq_id on public.rfq_items(rfq_id);
create index if not exists idx_vendor_quotes_rfq_id on public.vendor_quotes(rfq_id);
create index if not exists idx_vendor_quotes_vendor_id on public.vendor_quotes(vendor_id);
create index if not exists idx_freight_quotes_quote_id on public.freight_quotes(quote_id);
create index if not exists idx_client_offers_quote_id on public.client_offers(quote_id);
create index if not exists idx_client_offers_offer_token on public.client_offers(offer_token);
create index if not exists idx_payments_quote_id on public.payments(quote_id);
create index if not exists idx_vendor_categories_vendor_id on public.vendor_categories(vendor_id);
create index if not exists idx_vendor_regions_vendor_id on public.vendor_regions(vendor_id);
create index if not exists idx_vendor_brands_vendor_id on public.vendor_brands(vendor_id);
create index if not exists idx_vendor_contract_signatures_vendor_id on public.vendor_contract_signatures(vendor_id);
create index if not exists idx_vendor_contract_signatures_token on public.vendor_contract_signatures(token);

-- ─────────────────────────────────────
-- ✅ انتهت المايجريشن
-- ─────────────────────────────────────
