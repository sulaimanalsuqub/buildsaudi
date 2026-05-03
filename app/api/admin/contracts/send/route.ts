import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdminAuth, authError } from "@/lib/api-auth";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { sendContractSignLink } from "@/lib/email";

type ContractVendor = {
  id: string;
  establishment_name: string;
  manager_name?: string | null;
  email: string;
};

// POST /api/admin/contracts/send — إرسال العقد لموردين
export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok: rlOk, resetAt } = checkRateLimit(clientId, "admin");
  if (!rlOk) return rateLimitError(resetAt, "contracts");

  const auth = await checkAdminAuth();
  if (!auth.ok) return authError(auth.error!, auth.status);

  const { contractId, vendors } = (await req.json()) as {
    contractId?: string;
    vendors?: ContractVendor[];
  };
  if (!contractId || !Array.isArray(vendors) || vendors.length === 0) {
    return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });
  }

  const db = createServiceRoleClient();

  // Get contract details
  const { data: contract, error: contractErr } = await db
    .from("contracts")
    .select("title")
    .eq("id", contractId)
    .single();

  if (contractErr || !contract) {
    return NextResponse.json({ error: "العقد غير موجود" }, { status: 404 });
  }

  // Create signature records (upsert to avoid duplicates)
  const rows = vendors.map((v) => ({
    contract_id: contractId,
    vendor_id: v.id,
  }));

  const { data: inserted, error: upsertErr } = await db
    .from("vendor_contract_signatures")
    .upsert(rows, { onConflict: "contract_id,vendor_id", ignoreDuplicates: true })
    .select("token, vendor_id");

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 });
  }

  // Send emails
  const emailResults = await Promise.allSettled(
    (inserted ?? []).map(async (sig) => {
      const vendor = vendors.find((v) => v.id === sig.vendor_id);
      if (!vendor) return;
      return sendContractSignLink({
        establishment_name: vendor.establishment_name,
        manager_name: vendor.manager_name ?? vendor.establishment_name,
        email: vendor.email,
        token: sig.token,
        contractTitle: contract.title,
      });
    })
  );

  const sent = emailResults.filter((r) => r.status === "fulfilled").length;
  const failed = emailResults.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ ok: true, sent, failed });
}
