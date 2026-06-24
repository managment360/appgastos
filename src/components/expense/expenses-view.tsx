"use client";

import { useMemo } from "react";
import { Receipt, Plus } from "lucide-react";
import { ExpenseSheet } from "./expense-sheet";
import type { Group, Member } from "@/db/schema";
import type { ExpenseWithDetails } from "@/db/queries";
import type { MemberBalance } from "@/lib/balances";
import { formatMoney } from "@/lib/money";
import { formatMonthYear, monthKey } from "@/lib/dates";
import {
  setCurrentMember,
  useCurrentMember,
  useCanEdit,
} from "@/lib/current-member";
import { ExpenseCard } from "./expense-card";
import { MeSelector } from "./me-selector";

export function ExpensesView({
  group,
  members,
  expenses,
  balances,
}: {
  group: Group;
  members: Member[];
  expenses: ExpenseWithDetails[];
  balances: MemberBalance[];
}) {
  const me = useCurrentMember(group.code);
  const canEdit = useCanEdit(group.code, members);

  function chooseMe(id: string) {
    setCurrentMember(group.code, id);
  }

  const total = expenses.reduce((a, e) => a + e.amount, 0);
  const myBalance = balances.find((b) => b.memberId === me);

  // Agrupar por mes (desc).
  const groupsByMonth = useMemo(() => {
    const map = new Map<string, ExpenseWithDetails[]>();
    for (const e of expenses) {
      const key = monthKey(e.expenseDate);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [expenses]);

  const activeMembers = members.filter((m) => m.active);

  const meMember = members.find((m) => m.id === me);

  return (
    <div className="flex flex-col">
      {/* Tu balance */}
      <div className="border-b bg-card px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-bold uppercase">
            {meMember ? meMember.name.slice(0, 1) : "?"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Tu balance</p>
            {myBalance ? (
              myBalance.net > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Te deben un total de:{" "}
                  <span className="font-bold text-pos">
                    {formatMoney(myBalance.net, group.currency)}
                  </span>
                </p>
              ) : myBalance.net < 0 ? (
                <p className="text-sm text-muted-foreground">
                  Debés un total de:{" "}
                  <span className="font-bold text-neg">
                    {formatMoney(-myBalance.net, group.currency)}
                  </span>
                </p>
              ) : (
                <p className="text-sm font-medium text-muted-foreground">
                  Estás a mano 👌
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                Elegí quién sos abajo
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Total grupo
            </p>
            <p className="text-sm font-bold tabular">
              {formatMoney(total, group.currency)}
            </p>
          </div>
        </div>
        <MeSelector members={activeMembers} value={me} onChange={chooseMe} />
      </div>

      {/* Feed */}
      {expenses.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-4 px-4 py-4">
          {groupsByMonth.map(([key, items]) => (
            <section key={key}>
              <h3 className="mb-2 px-1 text-base font-bold">
                {formatMonthYear(key === "0000-00" ? null : `${key}-01`)}
              </h3>
              <ul className="flex flex-col gap-1.5">
                {items.map((e) => (
                  <ExpenseCard
                    key={e.id}
                    expense={e}
                    members={members}
                    currency={group.currency}
                    groupCode={group.code}
                    me={me}
                    activeMembers={activeMembers}
                    canEdit={canEdit}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* FAB de gasto — chico, abajo a la izquierda, solo "+" (solo en Gastos y si puede editar) */}
      {canEdit && (
        <div className="no-print pointer-events-none fixed inset-x-0 bottom-28 z-30 mx-auto flex w-full max-w-md justify-end px-4">
          <ExpenseSheet
            groupCode={group.code}
            members={activeMembers}
            currency={group.currency}
            trigger={
              <button
                className="pointer-events-auto flex size-12 items-center justify-center rounded-full bg-[var(--color-gold)] text-white shadow-lg shadow-black/20 transition active:scale-95"
                aria-label="Añadir gasto"
              >
                <Plus className="size-6" />
              </button>
            }
          />
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-3xl">
        🧾
      </div>
      <h3 className="text-lg font-semibold">Todavía no hay gastos</h3>
      <p className="max-w-xs text-base text-muted-foreground">
        Tocá el botón <span className="font-semibold text-gold">＋</span> (abajo a
        la derecha) para cargar el primero. La app hace las cuentas.
      </p>
      <Receipt className="size-5 text-muted-foreground" />
    </div>
  );
}
