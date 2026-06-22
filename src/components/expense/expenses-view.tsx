"use client";

import { useEffect, useMemo, useState } from "react";
import { Receipt } from "lucide-react";
import type { Group, Member } from "@/db/schema";
import type { ExpenseWithDetails } from "@/db/queries";
import type { MemberBalance } from "@/lib/balances";
import { formatMoney, formatSigned } from "@/lib/money";
import { formatDateLong } from "@/lib/dates";
import { getCurrentMember, setCurrentMember } from "@/lib/current-member";
import { cn } from "@/lib/utils";
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
  const [me, setMe] = useState<string | null>(null);
  useEffect(() => setMe(getCurrentMember(group.code)), [group.code]);

  function chooseMe(id: string) {
    setCurrentMember(group.code, id);
    setMe(id);
  }

  const total = expenses.reduce((a, e) => a + e.amount, 0);
  const myBalance = balances.find((b) => b.memberId === me);

  // Agrupar por fecha (desc).
  const groupsByDate = useMemo(() => {
    const map = new Map<string, ExpenseWithDetails[]>();
    for (const e of expenses) {
      const key = e.expenseDate ?? "Sin fecha";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [expenses]);

  const activeMembers = members.filter((m) => m.active);

  return (
    <div className="flex flex-col">
      {/* Resumen */}
      <div className="border-b bg-card px-5 py-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Total gastado
            </p>
            <p className="text-2xl font-bold tabular">
              {formatMoney(total, group.currency)}
            </p>
          </div>
          {myBalance && (
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Tu posición
              </p>
              <p
                className={cn(
                  "text-xl font-bold tabular",
                  myBalance.net > 0
                    ? "text-pos"
                    : myBalance.net < 0
                      ? "text-neg"
                      : "text-muted-foreground"
                )}
              >
                {formatSigned(myBalance.net, group.currency)}
              </p>
            </div>
          )}
        </div>
        <MeSelector
          members={activeMembers}
          value={me}
          onChange={chooseMe}
        />
      </div>

      {/* Feed */}
      {expenses.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-4 px-4 py-4">
          {groupsByDate.map(([date, items]) => (
            <section key={date}>
              <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {formatDateLong(date === "Sin fecha" ? null : date)}
              </h3>
              <ul className="flex flex-col gap-2">
                {items.map((e) => (
                  <ExpenseCard
                    key={e.id}
                    expense={e}
                    members={members}
                    currency={group.currency}
                    groupCode={group.code}
                    me={me}
                    activeMembers={activeMembers}
                  />
                ))}
              </ul>
            </section>
          ))}
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
      <p className="max-w-xs text-sm text-muted-foreground">
        Tocá el botón <span className="font-semibold text-primary">+</span> de
        abajo para cargar el primero. La app hace las cuentas.
      </p>
      <Receipt className="size-5 text-muted-foreground" />
    </div>
  );
}
