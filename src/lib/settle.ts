/**
 * Liquidación con MÍNIMO de transferencias (greedy min cash flow).
 * FUNCIÓN PURA (sin UI, sin DB). Todo en centavos.
 *
 * Estrategia: en cada paso, se cruza al mayor acreedor con el mayor deudor.
 * Esto produce, en la práctica, la menor cantidad de transferencias sin
 * deudas intermedias (cada quien paga directo a quien tiene que cobrar).
 */

export type Transfer = {
  fromMemberId: string;
  toMemberId: string;
  amount: number; // centavos, siempre > 0
};

export type NetBalance = { memberId: string; net: number };

export function minCashFlow(balances: NetBalance[]): Transfer[] {
  // Copia con netos; ignoramos los que están en cero.
  const creditors = balances
    .filter((b) => b.net > 0)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.net - a.net);
  const debtors = balances
    .filter((b) => b.net < 0)
    .map((b) => ({ memberId: b.memberId, net: -b.net })) // deuda positiva
    .sort((a, b) => b.net - a.net);

  const transfers: Transfer[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci];
    const debt = debtors[di];
    const amount = Math.min(credit.net, debt.net);

    if (amount > 0) {
      transfers.push({
        fromMemberId: debt.memberId,
        toMemberId: credit.memberId,
        amount,
      });
      credit.net -= amount;
      debt.net -= amount;
    }

    if (credit.net === 0) ci++;
    if (debt.net === 0) di++;
  }

  return transfers;
}
