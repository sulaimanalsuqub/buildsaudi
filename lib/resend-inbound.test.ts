import assert from "node:assert/strict";
import test from "node:test";
import { extractEmailAddress, resolveInboundContent, stripInboundHtml } from "./resend-inbound.ts";

test("extractEmailAddress accepts bare and display-name senders", () => {
  assert.equal(extractEmailAddress("Supplier <Sales@Example.com>"), "sales@example.com");
  assert.equal(extractEmailAddress("sales@example.com"), "sales@example.com");
  assert.equal(extractEmailAddress("not-an-email"), null);
});

test("resolveInboundContent retrieves the body using Resend email_id", async () => {
  let requestedId = "";
  const result = await resolveInboundContent(
    { email_id: "received-email-123", attachments: [{ id: "metadata-only" }] },
    async (emailId) => {
      requestedId = emailId;
      return { text: "Total: 1000 SAR", html: null, attachments: [] };
    }
  );
  assert.equal(requestedId, "received-email-123");
  assert.deepEqual(result, { text: "Total: 1000 SAR", attachmentCount: 0, attachmentText: "" });
});

test("resolveInboundContent converts retrieved HTML when text is absent", async () => {
  const result = await resolveInboundContent(
    { email_id: "received-email-456" },
    async () => ({
      text: null,
      html: "<style>.x{}</style><p>Total &amp; VAT: <b>1,150 SAR</b></p>",
      attachments: [],
    })
  );
  assert.equal(result.text, "Total & VAT: 1,150 SAR");
});

test("attachment-only reply remains explicitly detectable for manual handling", async () => {
  const result = await resolveInboundContent(
    { email_id: "received-email-789" },
    async () => ({
      text: null,
      html: null,
      attachments: [{ id: "a1", filename: "quote.pdf", content_type: "application/pdf", size: 100 }],
    })
  );
  assert.deepEqual(result, { text: "", attachmentCount: 1, attachmentText: "" });
});

test("stripInboundHtml removes scripts and markup", () => {
  assert.equal(stripInboundHtml("<script>alert(1)</script><p>Safe text</p>"), "Safe text");
});
