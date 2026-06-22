import { test } from "node:test";
import assert from "node:assert/strict";
import { parseToCents, formatCents, distributeCents } from "../lib/money";

test("parseToCents acepta formato AR", () => {
  assert.equal(parseToCents("1.250.000,00"), 125_000_000);
  assert.equal(parseToCents("17.000"), 1_700_000);
  assert.equal(parseToCents("3000"), 300_000);
  assert.equal(parseToCents("10,50"), 1050);
  assert.equal(parseToCents(""), 0);
});

test("formatCents da formato AR", () => {
  assert.equal(formatCents(125_000_000), "1.250.000,00");
  assert.equal(formatCents(1050), "10,50");
});

test("distributeCents no pierde ni inventa centavos", () => {
  const r = distributeCents(100, [1, 1, 1]); // 100 / 3
  assert.equal(r.reduce((a, b) => a + b, 0), 100);
  assert.deepEqual(r, [34, 33, 33]);
});

test("distributeCents reparte 120000.00 entre 8", () => {
  const r = distributeCents(12_000_000, [1, 1, 1, 1, 1, 1, 1, 1]);
  assert.equal(r.reduce((a, b) => a + b, 0), 12_000_000);
  // 12.000.000 / 8 = 1.500.000 exacto
  assert.ok(r.every((x) => x === 1_500_000));
});
