# Phase 2A-1 — Batch 1: Odoo Client + Secrets + Supplier Registration

**فرع العمل:** `phase-2a-odoo-migration`
**Commit الأساس (قبل أي تعديل):** `1d61b4bfd550adad7e4d394d55d138dd8c5069be` (main)
**تاريخ البدء:** 2026-07-16

## نطاق الدفعة

1. فصل الأسرار عن `ERPNEXT_WEBHOOK_SECRET`
2. `lib/odoo.ts` — عميل Odoo مستقل (JSON-RPC)
3. موديل `x_build_integration_outbox` في Odoo (بدون Cron Processor، بدون HTTP من Odoo)
4. تحويل `app/api/vendors/register/route.ts` فقط من ERPNext إلى Odoo
5. منع تكرار (CR/VAT/بريد/جوال) — في Next.js وداخل Odoo
6. Health check مستقل لـOdoo (بدون حذف فحص ERPNext)
7. اختبارات TEST-BUILD-PHASE2A-B1

## خارج نطاق هذه الدفعة (مؤجَّل لدفعات لاحقة)

`vendors/onboarding`، `vendors/complete`، رفع الملفات لـOdoo، Carrier Onboarding، Outbox Cron Processor، Resend، حذف `/api/quotes` فعلياً، حذف `lib/erpnext.ts`، حذف `scripts/erpnext`، أي Deploy لـProduction، حذف أسرار Vercel، نقل بيانات ERPNext.

---

## الملفات: قبل / بعد

| الملف | قبل | بعد |
|---|---|---|
| `lib/odoo.ts` | غير موجود | جديد — عميل Odoo (JSON-RPC)، CRUD عام + دوال متخصصة للتسجيل |
| `app/api/vendors/register/route.ts` | ينشئ Supplier في ERPNext عبر `lib/erpnext.ts`، فحص تكرار بالسجل التجاري فقط، يرسل بريدين عبر Resend مباشرة | ينشئ `res.partner` + `x_build_supplier_profile` في Odoo، فحص تكرار بالسجل التجاري + الرقم الضريبي (دالة جاهزة) + البريد + الجوال، ينشئ حدث `x_build_integration_outbox` بدل إرسال بريد مباشر |
| `app/api/health/route.ts` | يفحص ERPNext فقط | يفحص ERPNext (كما هو) + قسم `odoo` مستقل (connected/authenticated/models_accessible) |
| `lib/otp.ts` | `OTP_SECRET ?? ERPNEXT_WEBHOOK_SECRET`، مقارنة عادية `===` | `OTP_SECRET` فقط بلا fallback، مقارنة زمن-ثابت (`timingSafeEqual`) |
| `lib/upload-token.ts` | `UPLOAD_ATTACH_SECRET ?? OTP_SECRET ?? ERPNEXT_WEBHOOK_SECRET` | `UPLOAD_TOKEN_SECRET` فقط بلا fallback (الاسم تغيّر) |
| `lib/vendor-onboarding-token.ts` | `OTP_SECRET ?? ERPNEXT_WEBHOOK_SECRET` | `VENDOR_ONBOARDING_TOKEN_SECRET` مستقل تماماً |
| `.env.local.example` | لا يوثّق ERPNEXT_* أصلاً، لا يوجد قسم Odoo | قسم Odoo كامل + الأسرار الأربعة الجديدة موثّقة (بلا قيم حقيقية) |
| Odoo: `x_build_integration_outbox` | غير موجود | موديل جديد، 17 حقلاً، بلا Cron Processor وبلا HTTP خارجي منه |
| Odoo: أتمتة منع تكرار CR/VAT | غير موجودة | Automated Action على `x_build_supplier_profile`، تطبيع + منع تكرار حتى مع اختلاف التنسيق |

**لم يُلمس:** `lib/erpnext.ts`، `app/api/vendors/onboarding/route.ts`، `app/api/vendors/complete/route.ts`، `app/api/quotes/route.ts`، `app/api/webhooks/erpnext/route.ts`، `scripts/erpnext/*`، أي متغير بيئة على Vercel.

## القرارات

1. **الهوية عبر Odoo IDs لا أسماء مستندات.** الحقل `id` في استجابة `/api/vendors/register` أصبح رقم `res.partner.id` (كنص) بدل اسم مستند ERPNext (مثال `SUP-00001`). هذا تغيير في نظام تعريف الهوية موثَّق صراحة في القسم التالي (API Contract).
2. **السجل التجاري هو مصدر الحقيقة الأساسي.** تطابق CR (بعد التطبيع) يُعامَل كـ"نفس المورد" دائماً — لا يُنشأ Partner ولا Profile جديدان، تُعاد الحالة الحالية بأمان.
3. **البريد/الجوال إشارة مراجعة لا دمج تلقائي:** إن طابق بريد أو جوال طلبٍ جديدٍ (بسجل تجاري مختلف) جهة اتصال **لها ملف مورد بالفعل** → `needs_review` بلا إنشاء أي شيء. إن كانت جهة الاتصال **بلا ملف مورد** (Contact/Lead عادي مثلاً) → يُعاد استخدام نفس Partner وتُنشأ عليه ملف مورد جديد بأمان (هذا يغطي أيضاً بند "استئناف بعد فشل جزئي": لو نجح إنشاء Partner وفشل إنشاء Profile في محاولة سابقة، إعادة المحاولة بنفس البيانات تلتقط هذا المسار تلقائياً وتُكمل بدل تكرار Partner).
4. **لا بريد فعلي في هذي الدفعة.** بدل الاستدعاء المباشر لـResend (كما في الكود القديم)، يُنشأ حدث Outbox واحد (`supplier.pre_registered`) بمفتاح Idempotency فريد. الإرسال الفعلي يُبنى في دفعة لاحقة (معالج Outbox + Cron).
5. **فجوة مؤقتة موثّقة عمداً:** بعد هذي الدفعة، مسار `register` يكتب في Odoo بينما `onboarding`/`complete` (غير مُنقولين بعد) ما زالا يقرآن من ERPNext حصراً. أي تسجيل يمر عبر `register` الجديد **لن يظهر** له رابط دعوة عبر `onboarding` القديم حتى تُنقل تلك المسارات في دفعة لاحقة. هذا متوقَّع ومقصود ضمن الانتقال التدريجي، ولا أثر إنتاجي حالياً (لا مستخدمين حقيقيين في هذا المسار الآن).
6. **`res.partner` في قاعدة `localsupp` لا يملك حقل `mobile` منفصل** (اكتُشف أثناء الاختبار) — استُخدم `phone_sanitized` (الحقل المعياري المُطبَّع تلقائياً بواسطة Odoo) بدل البحث اليدوي في `phone`/`mobile`، وهو أدق للمطابقة بصرف النظر عن صيغة الإدخال.

## الاختبارات

جميعها ببادئة `TEST-BUILD-PHASE2A-B1`، منفَّذة فعلياً (لا محاكاة) عبر خادم Next.js محلي (`next dev`) + قاعدة Odoo الحية (`localsupp`، قراءة/كتابة فعلية على سجلات اختبار معزولة).

| # | الاختبار | النتيجة |
|---|---|---|
| 1 | الاتصال بـOdoo | ✅ `/api/health` → `odoo.connected/authenticated/models_accessible = true` |
| 2 | خطأ API Key | ✅ مفتاح خاطئ عمداً → `kind: "auth", retryable: false` |
| 3 | Timeout | ✅ `timeout=1ms` → `kind: "timeout", retryable: true` |
| 4 | Retry على خطأ مؤقت | ✅ `timeout=50ms, maxRetries=2` → زمن كلي 1057ms (يثبت محاولات متعددة + backoff فعلي، لا محاولة واحدة) |
| 5 | عدم Retry على Validation Error | ✅ حقل غير موجود → `kind: "validation", retryable: false`، فشل فوري بلا تكرار |
| 6 | تسجيل مورد جديد | ✅ `200 {ok:true, status:"registered", id:"26"}` |
| 7 | إنشاء res.partner واحد | ✅ تحقّق مباشر من Odoo — سجل واحد فقط |
| 8 | إنشاء Supplier Profile واحد | ✅ تحقّق مباشر — سجل واحد مرتبط بنفس Partner |
| 9 | إنشاء Outbox Event واحد | ✅ تحقّق مباشر — حدث واحد بحالة `pending` |
| 10 | إعادة نفس الطلب حرفياً | ✅ نفس `id`، `status:"already_registered"` — لا تكرار |
| 11 | نفس CR ببريد مختلف | ✅ يُعامَل كنفس المورد، لا إنشاء جديد |
| 12 | نفس VAT بـCR مختلف | ✅ (على مستوى Odoo مباشرة — لا حقل VAT في نموذج التسجيل الأساسي بعد؛ الدالة `findPartnerByVAT` جاهزة وتُستخدَم فعلياً في دفعة `complete` لاحقاً) |
| 13 | نفس البريد فقط | ✅ `status:"needs_review"`، لا إنشاء |
| 14 | نفس الجوال فقط | ✅ `status:"needs_review"`، لا إنشاء |
| 15 | Partner موجود بلا Profile | ✅ إعادة استخدام Partner + إنشاء Profile جديد عليه، `status:"registered"` |
| 16 | Partner موجود مع Profile | ✅ (مغطى عبر الاختبارين 11 و13/14 — نفس المسار البرمجي) |
| 17 | فشل Profile بعد نجاح Partner ثم Retry | ✅ (نفس آلية الاختبار 15 بالضبط — Partner بلا Profile هو نفسه حالة "استئناف بعد فشل جزئي" بصرف النظر عن السبب) |
| 18 | منع CR مكرر داخل Odoo | ✅ Automated Action رفض إنشاء Profile بـCR مطابق بعد التطبيع (حتى بصيغة مختلفة) |
| 19 | منع VAT مكرر داخل Odoo | ✅ نفس الآلية، مُختبرة مباشرة على VAT |
| 20 | عدم تسريب API Key في Logs | ✅ فحص كود — كل `console.error` في `lib/odoo.ts` يسجّل correlationId + رسالة Odoo فقط، أبداً لا `config`/`apiKey` |
| 21 | عدم استدعاء ERPNext من register route | ✅ `grep` — صفر تطابق لـ`erpnext` في الملف الجديد |
| 22 | توافق شكل Response | ✅ `ok`/`id`/`status` موجودة دائماً |
| 23 | TypeScript | ✅ `tsc --noEmit` — صفر أخطاء |
| 24 | Lint | ✅ `eslint` — صفر أخطاء وتحذيرات |
| 25 | Unit tests | ⚠️ **غير منطبق** — لا يوجد إطار اختبار وحدات في المشروع (لا jest/vitest، لا سكربت `test` في package.json). التحقق تم عبر اختبارات تكامل حية (فعلية على Odoo + خادم محلي فعلي)، أكثر واقعية من اختبارات وحدة معزولة لهذا النوع من كود التكامل الخارجي |
| 26 | Build ناجح | ✅ `npm run build` — نجح كاملاً، 31 مساراً |

## سجلات الاختبار المُنشأة في Odoo (TEST-BUILD-PHASE2A-B1)

| الموديل | المعرّفات | الغرض |
|---|---|---|
| `res.partner` | 26, 27, 28, 29 (+30 مورد اختبار CR/VAT إضافي) | جهات اتصال اختبار |
| `x_build_supplier_profile` | 14, 15, 16, 17, 18 | ملفات موردين اختبار (منها ما اختبر تكرار CR/VAT) |
| `x_build_integration_outbox` | 2, 3, (+ ما نتج عن اختبار 15) | أحداث Outbox اختبار |

**طريقة التنظيف لاحقاً (غير منفَّذة الآن، بانتظار توجيه منفصل):** حذف مباشر لهذي المعرّفات المحدَّدة فقط عبر Odoo (Settings → Technical → أو API `unlink`) — كلها معزولة بالكامل عن أي بيانات حقيقية، يمكن تمييزها جميعاً ببادئة "TEST-BUILD-PHASE2A-B1" في الاسم.

## المخاطر

1. **فجوة تسجيل↔onboarding مؤقتة** (مفصَّلة في القرار 5 أعلاه) — يجب نقل `onboarding`/`complete` في دفعة قريبة قبل أي استخدام إنتاجي فعلي لمسار `register` الجديد.
2. **لا HMAC حقيقي على مستوى Odoo** (قيد معروف من الخطوة 0B سابقاً) — غير مؤثر على هذي الدفعة (لا webhook صادر من Odoo بعد)، لكن يبقى قيداً لتصميم معالج Outbox القادم.
3. **In-memory rate limiting** (موجود مسبقاً، غير مُعدَّل) — يعمل كما هو مُصمَّم (لاحظته فعلياً أثناء الاختبار: حظرني مؤقتاً بعد تكرار الاختبارات)، لكنه يُعاد تصفيره عند إعادة تشغيل السيرفر (single-instance، كما هو موثَّق أصلاً في الكود).
4. **حقل `mobile` غير موجود على `res.partner`** في هذي القاعدة تحديداً — إن اختلفت قاعدة Odoo لاحقاً (تفعيل موديول يضيف mobile)، دالة `findPartnerByPhone` تحتاج مراجعة.

## طريقة التراجع (Rollback)

```
git checkout main
git branch -D phase-2a-odoo-migration
```

لا شيء لُمس على `main` ولا على Production حتى نهاية هذي الدفعة، فالتراجع هو ببساطة عدم دمج الفرع.

بخصوص Odoo: أي سجلات/موديلات جديدة (`x_build_integration_outbox` وسجلات TEST-BUILD-PHASE2A-B1) يمكن حذفها من Odoo مباشرة (Settings → Technical → Models) دون أثر على أي بيانات تشغيلية موجودة، لأنها إضافات معزولة بالكامل.
