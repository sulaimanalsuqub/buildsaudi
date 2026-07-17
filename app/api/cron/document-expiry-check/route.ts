import { NextRequest, NextResponse } from "next/server";
import { OdooClientError, getSupplierProfileForNotification, listDocumentsWithExpiry, write } from "@/lib/odoo";
import { sendDocumentExpiryAlertEmail } from "@/lib/email";

export const maxDuration = 60;

// من الأكثر إلحاحاً إلى الأقل — يُرسَل تنبيه واحد فقط لكل مستند في كل تشغيلة (الأكثر إلحاحاً غير المُرسَل سابقاً)
const THRESHOLDS = [
  { days: 0, flag: "x_studio_expiry_alert_0_sent" as const },
  { days: 7, flag: "x_studio_expiry_alert_7_sent" as const },
  { days: 30, flag: "x_studio_expiry_alert_30_sent" as const },
  { days: 60, flag: "x_studio_expiry_alert_60_sent" as const },
];

function daysBetween(dateStr: string): number {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00Z`);
  return Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let documents;
  try {
    documents = await listDocumentsWithExpiry();
  } catch (error) {
    if (error instanceof OdooClientError) {
      console.error(`[cron/document-expiry-check][${error.correlationId}] failed to list documents: ${error.message}`);
    }
    return NextResponse.json({ error: "تعذر جلب قائمة المستندات" }, { status: 500 });
  }

  const results = { checked: documents.length, alerted: 0, skipped: 0, failed: 0 };
  const profileCache = new Map<number, Awaited<ReturnType<typeof getSupplierProfileForNotification>>>();

  for (const doc of documents) {
    if (!doc.x_studio_supplier_profile_id) {
      results.skipped += 1;
      continue;
    }
    const daysLeft = daysBetween(doc.x_studio_expiry_date);

    // أول عتبة (من الأكثر إلحاحاً) لم تُرسَل بعد وأصبحت مستحقة
    const due = THRESHOLDS.find((t) => daysLeft <= t.days && !doc[t.flag]);
    if (!due) {
      results.skipped += 1;
      continue;
    }

    const profileId = doc.x_studio_supplier_profile_id[0];
    try {
      let profile = profileCache.get(profileId);
      if (profile === undefined) {
        profile = await getSupplierProfileForNotification(profileId);
        profileCache.set(profileId, profile);
      }
      if (!profile) {
        results.skipped += 1;
        continue;
      }

      await sendDocumentExpiryAlertEmail({
        establishment_name: profile.establishmentName,
        manager_name: profile.managerName,
        email: profile.email,
        documentType: doc.x_studio_document_type,
        expiryDate: doc.x_studio_expiry_date,
        daysLeft,
        lang: profile.preferredLanguage,
      });

      // نُعلّم كل العتبات الأقل إلحاحاً (>= العتبة المُرسَلة) كمُرسَلة أيضاً — لا داعي لتنبيهات متأخرة عن مرحلة تجاوزناها
      const flagsToMark = THRESHOLDS.filter((t) => t.days >= due.days).reduce<Record<string, boolean>>((acc, t) => {
        acc[t.flag] = true;
        return acc;
      }, {});
      if (due.days === 0) {
        flagsToMark["x_studio_documents_expired"] = true;
      }
      await write("x_build_supplier_document", [doc.id], flagsToMark);
      if (due.days === 0) {
        await write("x_build_supplier_profile", [profileId], { x_studio_documents_expired: true });
      }

      results.alerted += 1;
    } catch (error) {
      results.failed += 1;
      console.error(`[cron/document-expiry-check] document ${doc.id} alert failed:`, error);
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
