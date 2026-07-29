import assert from "node:assert/strict";
import test from "node:test";
import { QuoteExtractionRetryableError, extractQuoteFromReply } from "./quote-extraction.ts";

test("missing DeepSeek configuration is retryable, not a terminal no-quote result", async () => {
  const old = process.env.DEEPSEEK_API_KEY; delete process.env.DEEPSEEK_API_KEY;
  try { await assert.rejects(() => extractQuoteFromReply("Total 1000 SAR"), QuoteExtractionRetryableError); }
  finally { if (old === undefined) delete process.env.DEEPSEEK_API_KEY; else process.env.DEEPSEEK_API_KEY = old; }
});
