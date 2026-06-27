# مواصفة ERPNext — إصلاح سير عمل الموردين والطلبات

> هذه البنود تتطلب تعديلات في **ERPNext (DocType + Workflow + Permissions)** لا تُنفَّذ من مستودع Next.js.
> لكل بند: تغيير ERPNext المطلوب + تغيير الكود المُقابِل لمزامنته (مع المواقع الدقيقة).
> **ترتيب التنفيذ مهم:** عدّل ERPNext أولًا (إضافة القيم/الحقول) ثم الكود — وإلا تفشل الكتابة على ERPNext.

---

## البند 1 — فضّ ازدواج حالة "Approved"

**المشكلة:** `build_supplier_stage = "Approved"` تعني شيئين: (أ) اعتماد مبدئي → إرسال رابط الإكمال، (ب) اعتماد نهائي → مؤهل للتوريد. يفرّق بينهما فقط حقل `build_profile_completed`. هشّ وخطر.

**حالات Workflow المقترحة (حقل `build_supplier_stage`):**

| الحالة | المعنى | الانتقال منها |
|---|---|---|
| `Pre Registration` | تسجيل أساسي، بانتظار مراجعة مبدئية | → Invited / Rejected |
| `Invited` | اعتُمد مبدئيًا، أُرسل رابط الإكمال | → Profile Submitted |
| `Profile Submitted` | الملف الكامل + المستندات مُرسلة | → Active / Needs Info / Rejected |
| `Active` | معتمد نهائيًا — **مؤهل للتوريد فقط** | → Suspended |
| `Needs Info` | يحتاج تصحيح (انظر البند 4) | → Profile Submitted |
| `Rejected` | مرفوض بسبب | — |
| `Suspended` | موقوف مؤقتًا | → Active |

**تغييرات الكود المطلوبة للمزامنة:**

| الملف | الموقع | من | إلى |
|---|---|---|---|
| `app/api/vendors/onboarding/route.ts` | فحص الحالة | `stage !== "Approved"` | `stage !== "Invited"` |
| `app/api/vendors/complete/route.ts` | فحص الحالة | `stage !== "Approved"` | `stage !== "Invited"` |
| `app/api/vendors/complete/route.ts` | `applyERPNextWorkflow(... "Review")` | action `"Review"` | action ينقل Invited→Profile Submitted |
| `lib/build-agents.ts` | فلتر `suggestSuppliersForOpportunity` | `build_supplier_stage = "Approved"` | `build_supplier_stage = "Active"` |
| Webhook ERPNext | حدث `supplier.approved` | يُطلق عند Pre Registration→Invited | (نفسه — إرسال الرابط) |

> أهلية RFQ تصبح: `stage = "Active"` فقط (يمكن إسقاط شرط `profile_completed` المزدوج، أو إبقاؤه كتحقّق إضافي).

---

## البند 2 — إلغاء الاعتماد الآلي للكميات (≥85%)

**المشكلة:** البنود المستخرجة بثقة ≥85% تُوسَم `"Approved"` تلقائيًا — كلمة توحي أن بشرًا اعتمدها، فيثق المراجع ويمرّر كميات قد تكون خاطئة → تسعير خاطئ.

**تغيير ERPNext:** في child doctype **`Build Request Material Item`**، اجعل حقل `build_review_status` من نوع **Select** بالخيارات:
```
AI High Confidence
Needs Review
Confirmed
Rejected
```
أضف **شرطًا على إنشاء RFQ**: لا يُنشأ إلا إذا كانت كل البنود `Confirmed` (اعتماد بشري) — وليس `AI High Confidence`.

**✅ نُفِّذت نسخة آمنة مؤقتة:** في `lib/process-quote-background.ts` صار `build_review_status = "Needs Review"` لكل البنود (إلغاء الاعتماد الآلي فورًا، باستخدام قيمة موجودة لا تكسر ERPNext). نسبة الثقة محفوظة في `build_confidence` ويعرضها ملخص الوكيل.

**الترقية المستقبلية** (بعد إضافة خيارات Select في ERPNext):

| الملف | الموقع | إلى |
|---|---|---|
| `lib/process-quote-background.ts` | تعيين `build_review_status` | `confidence >= 85 ? "AI High Confidence" : "Needs Review"` |

> الأثر: لا شيء يصل RFQ دون تأكيد بشري صريح، مع إبقاء إشارة الثقة لتسريع المراجعة.

---

## البند 3 — إجبار checklist التدقيق اليدوي

**الحالة الآن:** أُضيف checklist كـ **نص** في `build_agent_summary` (يراه المراجع) لكنه غير مُلزِم — يمكن الاعتماد بضغطة زر دون فتح أي مستند.

**تغيير ERPNext:** أضف حقول **Check** على Supplier:
```
build_doc_cr_verified        (Check) — "طابقت السجل من المستند"
build_doc_bank_verified      (Check) — "طابقت الآيبان واسم الحساب من خطاب البنك"
build_identity_confirmed     (Check) — "أكّدت الرقم الضريبي والعنوان لنفس المنشأة"
```
- **شرط Workflow** على انتقال `Profile Submitted → Active`: يتطلب الثلاثة = 1.
- **Permissions**: فقط دور **Reviewer** يعدّل هذه الحقول (Field-level / Permission Level منفصل).
- يُسجَّل المُعدِّل وتاريخه تلقائيًا (Track Changes مفعّل على Supplier).

> لا يحتاج تغيير كود — التكامل الحالي يكتب الملخص النصّي الذي يرشد المراجع؛ الإلزام كله في ERPNext.

---

## البند 4 — سبب رفض إلزامي + مسار إعادة تقديم

**المشكلة:** المرفوض يستلم بريدًا بلا سبب وبلا طريق رجوع؛ و"Needs More Information" يقفل الملف (`profile_completed=1` يمنع التعديل عبر `complete`).

**تغيير ERPNext:**
1. حقل `build_rejection_reason` (Small Text)، **إلزامي** على انتقالات `Rejected` و`Needs Info` (`mandatory_depends_on`).
2. انتقال `Profile Submitted → Needs Info` يضبط: `build_profile_completed = 0` و`build_supplier_stage = "Needs Info"` (لإعادة فتح الملف).
3. أحداث Webhook جديدة:
   - `supplier.rejected` → يضمّن `rejection_reason` في البريد.
   - `supplier.needs_info` → بريد بالسبب + **رابط إكمال جديد** (token جديد).

**تغيير الكود المُقابِل:**

| الملف | التغيير |
|---|---|
| `app/api/webhooks/erpnext/route.ts` | إضافة `rejection_reason` لحمولة `supplier.rejected`، وحدث `supplier.needs_info` يولّد token جديد عبر `generateVendorOnboardingToken` ويرسل رابطًا |
| `app/api/vendors/onboarding/route.ts` | السماح بالحالة `"Needs Info"` (إضافةً إلى `"Invited"`) لفتح الرابط |
| `app/api/vendors/complete/route.ts` | السماح بالحالة `"Needs Info"` لإعادة الإرسال (يُعاد ضبط `profile_completed=0` من ERPNext فيمرّ) |
| `lib/email.ts` | دالة `sendVendorRejectedEmail` تستقبل `reason`؛ دالة جديدة `sendVendorNeedsInfoEmail` |

> ملاحظة صلاحية الـ token: رابط الإكمال له TTL — عند "Needs Info" أرسل token جديدًا دائمًا (لا تعتمد على القديم).

---

## ملحق — صلاحيات مقترحة (فصل المهام)

| الدور | ينشئ | يراجع المستندات | يعتمد نهائيًا | حد الائتمان |
|---|---|---|---|---|
| Reviewer (عمليات) | — | ✅ (checklist البند 3) | ❌ | ❌ |
| Approver (مدير) | — | — | ✅ Profile Submitted→Active | ❌ |
| Finance | — | — | — | ✅ فقط `build_credit_limit` |
| Procurement | RFQ/PO | — | اختيار المورد | — |

**المبدأ:** من يدقّق المستندات ≠ من يعتمد تجاريًا ≠ من يحدد الائتمان.

---

## أولوية التنفيذ
1. **عاجل:** البند 2 (إلغاء اعتماد الكميات الآلي) + البند 4 (سبب الرفض) — مخاطر تشغيلية مباشرة.
2. **مهم:** البند 1 (فضّ Approved) + البند 3 (إجبار checklist).
3. **لاحق:** فصل الأدوار + حقل الائتمان للمالية.

> بعد تجهيز ERPNext لأي بند، يمكن تنفيذ نصف الكود المُقابِل مباشرة (المواقع موثّقة أعلاه).
