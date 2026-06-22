import { test } from "node:test";
import assert from "node:assert/strict";
import { computeShares, validateSplit } from "../lib/split";

const members = (ids: string[]) => ids.map((memberId) => ({ memberId }));

test("equal divide parejo y suma el total", () => {
  const r = computeShares(12_000_000, "equal", members(["a", "b", "c", "d", "e", "f", "g", "h"]));
  assert.equal(r.reduce((a, s) => a + s.computedAmount, 0), 12_000_000);
  assert.ok(r.every((s) => s.computedAmount === 1_500_000));
});

test("equal con residuo lo reparte sin perder centavos", () => {
  const r = computeShares(1000, "equal", members(["a", "b", "c"]));
  assert.equal(r.reduce((a, s) => a + s.computedAmount, 0), 1000);
});

test("custom_amount respeta importes fijos", () => {
  const r = computeShares(10_000, "custom_amount", [
    { memberId: "a", fixedAmount: 7000 },
    { memberId: "b", fixedAmount: 3000 },
  ]);
  assert.equal(r.find((s) => s.memberId === "a")!.computedAmount, 7000);
  assert.equal(r.find((s) => s.memberId === "b")!.computedAmount, 3000);
});

test("percent reparte por porcentaje", () => {
  const r = computeShares(10_000, "percent", [
    { memberId: "a", percent: 25 },
    { memberId: "b", percent: 75 },
  ]);
  assert.equal(r.find((s) => s.memberId === "a")!.computedAmount, 2500);
  assert.equal(r.find((s) => s.memberId === "b")!.computedAmount, 7500);
});

test("units reparte por partes", () => {
  const r = computeShares(9000, "units", [
    { memberId: "a", weight: 2 },
    { memberId: "b", weight: 1 },
  ]);
  assert.equal(r.find((s) => s.memberId === "a")!.computedAmount, 6000);
  assert.equal(r.find((s) => s.memberId === "b")!.computedAmount, 3000);
});

test("validateSplit detecta sumas incorrectas", () => {
  assert.equal(
    validateSplit(10_000, "custom_amount", [
      { memberId: "a", fixedAmount: 5000 },
      { memberId: "b", fixedAmount: 4000 },
    ]).ok,
    false
  );
  assert.equal(
    validateSplit(10_000, "percent", [
      { memberId: "a", percent: 50 },
      { memberId: "b", percent: 40 },
    ]).ok,
    false
  );
  assert.equal(
    validateSplit(10_000, "percent", [
      { memberId: "a", percent: 50 },
      { memberId: "b", percent: 50 },
    ]).ok,
    true
  );
});
