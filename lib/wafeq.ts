// Minimal Wafeq client — creates/syncs a Contact only (Build's accounting of record is Wafeq,
// see ~/build-platform for the full invoicing integration; this repo only needs to mirror new
// suppliers into Wafeq as Contacts so the finance team doesn't re-enter them by hand).
// Real, current API shape verified against developer.wafeq.com (same shape used in
// build-platform/modules/finance/infrastructure/wafeqAccountingProvider.ts):
//   POST /v1/contacts/  { name, email, phone, external_id, relationship: ["Supplier"] }
//   Auth: `Authorization: Api-Key <key>`. Idempotency: `X-Wafeq-Idempotency-Key` (uuid-v4, Wafeq
//   caches it for 1hr) — derived deterministically from Build's own reference so a retried
//   registration never creates a duplicate Wafeq contact.
import { createHash } from "node:crypto";

const WAFEQ_BASE_URL = "https://api.wafeq.com/v1";

function deriveIdempotencyUuid(businessKey: string): string {
  const hash = createHash("sha256").update(businessKey).digest("hex");
  const bytes = hash.slice(0, 32);
  return [
    bytes.slice(0, 8), bytes.slice(8, 12), "4" + bytes.slice(13, 16),
    ((parseInt(bytes[16]!, 16) & 0x3) | 0x8).toString(16) + bytes.slice(17, 20), bytes.slice(20, 32),
  ].join("-");
}

export function isWafeqConfigured(): boolean {
  return Boolean(process.env.WAFEQ_API_KEY);
}

/** ينشئ Contact مورّد في وافق (best-effort — لا يُستخدم كمصدر حقيقة، Odoo هو ذلك) */
export async function createWafeqSupplierContact(input: { externalId: string; name: string; email?: string; phone?: string }): Promise<{ externalContactId: string }> {
  const apiKey = process.env.WAFEQ_API_KEY;
  if (!apiKey) throw new Error("Wafeq is not configured (WAFEQ_API_KEY)");
  const response = await fetch(`${WAFEQ_BASE_URL}/contacts/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Api-Key ${apiKey}`,
      "X-Wafeq-Idempotency-Key": deriveIdempotencyUuid(`build:vendor:${input.externalId}`),
    },
    body: JSON.stringify({
      name: input.name, email: input.email, phone: input.phone,
      external_id: input.externalId, relationship: ["Supplier"],
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Wafeq contacts: HTTP ${response.status} ${body.slice(0, 300)}`);
  }
  const result = (await response.json()) as { id: string };
  return { externalContactId: result.id };
}
