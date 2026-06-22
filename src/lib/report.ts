/**
 * Modelo del REPORTE estilo Splid — FUNCIÓN PURA.
 *
 * Por cada gasto y por cada miembro hay DOS sub-valores:
 *   - paid:  lo que ese miembro PAGÓ del gasto (positivo, verde). 0 si no pagó.
 *   - share: lo que le toca pagar (negativo en la vista, rojo). 0 si no participa.
 *
 * Fila de totales: saldo neto por miembro (verde cobra / rojo paga).
 * "Pagos para ajuste": transferencias mínimas (min cash flow).
 */
import { computeBalances } from "./balances";
import { minCashFlow, type Transfer } from "./settle";

export type ReportMember = { id: string; name: string };

export type ReportCell = { paid: number; share: number };

export type ReportRow = {
  expenseId: string;
  concept: string;
  amount: number; // total del gasto (centavos)
  payerNames: string; // "De"
  date: string | null;
  cells: Record<string, ReportCell>; // memberId -> celda
};

export type ReportExpense = {
  id: string;
  concept: string;
  amount: number;
  expenseDate: string | null;
  payers: { memberId: string; amount: number }[];
  shares: { memberId: string; computedAmount: number }[];
};

export type ReportSettlement = {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  status: "pending" | "paid";
};

export type ReportModel = {
  members: ReportMember[];
  rows: ReportRow[];
  totals: Record<string, number>; // memberId -> neto
  adjustments: Transfer[];
};

export function buildReport(
  members: ReportMember[],
  expenses: ReportExpense[],
  settlements: ReportSettlement[] = []
): ReportModel {
  const nameOf = (id: string) =>
    members.find((m) => m.id === id)?.name ?? "?";

  const rows: ReportRow[] = expenses.map((e) => {
    const cells: Record<string, ReportCell> = {};
    for (const m of members) cells[m.id] = { paid: 0, share: 0 };
    for (const p of e.payers) {
      if (cells[p.memberId]) cells[p.memberId].paid += p.amount;
    }
    for (const s of e.shares) {
      if (cells[s.memberId]) cells[s.memberId].share += s.computedAmount;
    }
    return {
      expenseId: e.id,
      concept: e.concept,
      amount: e.amount,
      payerNames: e.payers.map((p) => nameOf(p.memberId)).join(", "),
      date: e.expenseDate,
      cells,
    };
  });

  const balances = computeBalances(
    members.map((m) => m.id),
    expenses.map((e) => ({ payers: e.payers, shares: e.shares })),
    settlements
  );

  const totals: Record<string, number> = {};
  for (const b of balances) totals[b.memberId] = b.net;

  const adjustments = minCashFlow(
    balances.map((b) => ({ memberId: b.memberId, net: b.net }))
  );

  return { members, rows, totals, adjustments };
}
