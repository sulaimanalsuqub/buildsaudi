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
-- 4. RLS: السماح للعميل بقراءة عرضه عبر التوكن
-- ─────────────────────────────────────
drop policy if exists "Service role manages client_offers" on public.client_offers;

create policy "Service role manages client_offers"
  on public.client_offers using (false);

drop policy if exists "Public can read offer by token" on public.client_offers;

create policy "Public can read offer by token"
  on public.client_offers for select
  using (offer_token is not null);

-- ─────────────────────────────────────
-- 5. Storage bucket لملفات BOQ
--    يجب إنشاؤه من واجهة Supabase → Storage
--    اسم الـ bucket: boq-files
--    النوع: Public
-- ─────────────────────────────────────
-- insert into storage.buckets (id, name, public)
-- values ('boq-files', 'boq-files', true)
-- on conflict do nothing;

-- ─────────────────────────────────────
-- ✅ انتهت المايجريشن
-- ─────────────────────────────────────
