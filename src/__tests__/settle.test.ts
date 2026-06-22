import { test } from "node:test";
import assert from "node:assert/strict";
import { minCashFlow } from "../lib/settle";

test("minCashFlow salda con transferencias mínimas", () => {
  // a debe 100, b debe 50, c cobra 150
  const t = minCashFlow([
    { memberId: "a", net: -10_000 },
    { memberId: "b", net: -5_000 },
    { memberId: "c", net: 15_000 },
  ]);
  // Suma transferida = suma de deudas
  assert.equal(t.reduce((s, x) => s + x.amount, 0), 15_000);
  // Todos los pagos van a c
  assert.ok(t.every((x) => x.toMemberId === "c"));
  assert.equal(t.length, 2);
});

test("minCashFlow no genera transferencias si están a mano", () => {
  const t = minCashFlow([
    { memberId: "a", net: 0 },
    { memberId: "b", net: 0 },
  ]);
  assert.equal(t.length, 0);
});

test("minCashFlow conserva el balance total", () => {
  const balances = [
    { memberId: "a", net: -7_000 },
    { memberId: "b", net: -3_000 },
    { memberId: "c", net: 4_000 },
    { memberId: "d", net: 6_000 },
  ];
  const t = minCashFlow(balances);
  const totalDebt = balances
    .filter((b) => b.net < 0)
    .reduce((s, b) => s - b.net, 0);
  assert.equal(t.reduce((s, x) => s + x.amount, 0), totalDebt);
  // Nadie paga ni recibe importes negativos
  assert.ok(t.every((x) => x.amount > 0));
});
