/** Centralizes the acknowledgement contract used by the Resend inbound route. */
export async function terminalInboundOutcome(stage: string, persist: () => Promise<void>): Promise<{ status: 200; body: { ok: true; skipped: string } }> {
  await persist();
  return { status: 200, body: { ok: true, skipped: stage } };
}

export async function retryableInboundOutcome(error: unknown, persist: (error: unknown) => Promise<void>): Promise<{ status: 500; body: { error: string } }> {
  await persist(error);
  return { status: 500, body: { error: "Inbound processing failed; retry scheduled" } };
}
