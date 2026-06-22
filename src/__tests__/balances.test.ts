import { test } from "node:test";
import assert from "node:assert/strict";
import { computeBalances } from "../lib/balances";

test("computeBalances: caso Asado Mariano (gastos igualitarios)", () => {
  // Simplificado: 1 gasto de 120.000 pagado por Mariano entre 8.
  const ids = ["Flaco", "Gordo", "Horacio", "Jesus", "Jose", "Lugones", "Mariano", "Matias"];
  const shareEach = 1_500_000; // 15.000,00
  const balances = computeBalances(
    ids,
    [
      {
        payers: [{ memberId: "Mariano", amount: 12_000_000 }],
        shares: ids.map((memberId) => ({ memberId, computedAmount: shareEach })),
      },
    ]
  );
  const mariano = balances.find((b) => b.memberId === "Mariano")!;
  // Mariano pagó 120.000 y consumió 15.000 -> a favor 105.000
  assert.equal(mariano.net, 12_000_000 - 1_500_000);
  const flaco = balances.find((b) => b.memberId === "Flaco")!;
  assert.equal(flaco.net, -1_500_000);
  // La suma de netos es cero
  assert.equal(balances.reduce((s, b) => s + b.net, 0), 0);
});

test("computeBalances: los settlements pagados ajustan el neto", () => {
  const balances = computeBalances(
    ["a", "b"],
    [
      {
        payers: [{ memberId: "a", amount: 10_000 }],
        shares: [
          { memberId: "a", computedAmount: 5_000 },
          { memberId: "b", computedAmount: 5_000 },
        ],
      },
    ],
    [{ fromMemberId: "b", toMemberId: "a", amount: 5_000, status: "paid" }]
  );
  // Tras pagar, ambos quedan a mano.
  assert.equal(balances.find((b) => b.memberId === "a")!.net, 0);
  assert.equal(balances.find((b) => b.memberId === "b")!.net, 0);
});
