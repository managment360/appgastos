/**
 * Cálculo de saldos por miembro — FUNCIONES PURAS (sin UI, sin DB).
 * Todo en centavos (enteros).
 *
 * Convención de signo (semántica contable):
 *   net > 0  -> le deben / está a favor  (VERDE)
 *   net < 0  -> debe                      (ROJO)
 */

export type ExpenseForBalance = {
  payers: { memberId: string; amount: number }[];
  shares: { memberId: string; computedAmount: number }[];
};

export type SettlementForBalance = {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  status: "pending" | "paid";
};

export type MemberBalance = {
  memberId: string;
  /** Total que puso en gastos (centavos). */
  paid: number;
  /** Total que le corresponde por su consumo (centavos). */
  share: number;
  /** Ajuste por pagos de liquidación ya saldados (centavos, con signo). */
  settlementAdj: number;
  /** Saldo neto = paid - share + settlementAdj. + a favor / - debe. */
  net: number;
};

export function computeBalances(
  memberIds: string[],
  expenses: ExpenseForBalance[],
  settlements: SettlementForBalance[] = []
): MemberBalance[] {
  const paid = new Map<string, number>();
  const share = new Map<string, number>();
  const adj = new Map<string, number>();
  for (const id of memberIds) {
    paid.set(id, 0);
    share.set(id, 0);
    adj.set(id, 0);
  }

  for (const e of expenses) {
    for (const p of e.payers) {
      if (paid.has(p.memberId))
        paid.set(p.memberId, paid.get(p.memberId)! + p.amount);
    }
    for (const s of e.shares) {
      if (share.has(s.memberId))
        share.set(s.memberId, share.get(s.memberId)! + s.computedAmount);
    }
  }

  // Pagos de liquidación ya realizados: el que paga sube su neto, el que cobra baja.
  for (const s of settlements) {
    if (s.status !== "paid") continue;
    if (adj.has(s.fromMemberId))
      adj.set(s.fromMemberId, adj.get(s.fromMemberId)! + s.amount);
    if (adj.has(s.toMemberId))
      adj.set(s.toMemberId, adj.get(s.toMemberId)! - s.amount);
  }

  return memberIds.map((id) => {
    const p = paid.get(id)!;
    const sh = share.get(id)!;
    const a = adj.get(id)!;
    return { memberId: id, paid: p, share: sh, settlementAdj: a, net: p - sh + a };
  });
}
