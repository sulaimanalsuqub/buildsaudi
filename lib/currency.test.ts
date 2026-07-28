import assert from "node:assert/strict";
import test from "node:test";
import { convertToSar, normalizeCurrencyCode } from "./currency.ts";

test("normalizes SAR, USD and EUR aliases", () => {
  assert.equal(normalizeCurrencyCode("ريال سعودي"), "SAR");
  assert.equal(normalizeCurrencyCode("$"), "USD");
  assert.equal(normalizeCurrencyCode("eur"), "EUR");
  assert.equal(normalizeCurrencyCode("unknown currency"), null);
});

test("converts Odoo inverse rates to SAR without double conversion", () => {
  const rates = new Map([
    ["SAR", 1],
    ["USD", 0.266667],
    ["EUR", 0.2457],
  ]);
  assert.equal(convertToSar(100, "SAR", rates), 100);
  assert.equal(convertToSar(100, "USD", rates), 375);
  assert.equal(convertToSar(100, "EUR", rates), 407);
});

test("rejects unavailable, zero, invalid and negative conversion inputs", () => {
  assert.equal(convertToSar(100, "EUR", new Map()), null);
  assert.equal(convertToSar(100, "EUR", new Map([["EUR", 0]])), null);
  assert.equal(convertToSar(Number.NaN, "SAR", new Map([["SAR", 1]])), null);
  assert.equal(convertToSar(-1, "SAR", new Map([["SAR", 1]])), null);
});

test("a seemingly cheaper USD quote is ranked by its real SAR value", () => {
  const rates = new Map([
    ["SAR", 1],
    ["USD", 0.266667],
  ]);
  const sarQuote = convertToSar(360, "SAR", rates);
  const usdQuote = convertToSar(100, "USD", rates);
  assert.equal(sarQuote, 360);
  assert.equal(usdQuote, 375);
  assert.ok((sarQuote ?? Infinity) < (usdQuote ?? Infinity));
});
