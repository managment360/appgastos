"use client";

import type { Member } from "@/db/schema";
import type { ExpenseWithDetails } from "@/db/queries";
import { categoryIcon } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { formatDayMon } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { ExpenseSheet, type ExpenseInitial } from "./expense-sheet";

export function ExpenseCard({
  expense,
  members,
  activeMembers,
  currency,
  groupCode,
  me,
  canEdit = true,
}: {
  expense: ExpenseWithDetails;
  members: Member[];
  activeMembers: Member[];
  currency: string;
  groupCode: string;
  me: string | null;
  canEdit?: boolean;
}) {
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? "?";
  const payerNames = expense.payers.map((p) => nameOf(p.memberId)).join(", ");
  const { day, mon } = formatDayMon(expense.expenseDate);

  const myPaid = expense.payers
    .filter((p) => p.memberId === me)
    .reduce((a, p) => a + p.amount, 0);
  const myShare = expense.shares
    .filter((s) => s.memberId === me)
    .reduce((a, s) => a + s.computedAmount, 0);
  const involved = me != null && (myPaid > 0 || myShare > 0);
  const myNet = myPaid - myShare;

  const initial: ExpenseInitial = {
    id: expense.id,
    amount: expense.amount,
    concept: expense.concept,
    expenseDate: expense.expenseDate,
    category: expense.category,
    splitType: expense.splitType,
    payers: expense.payers.map((p) => ({ memberId: p.memberId, amount: p.amount })),
    shares: expense.shares.map((s) => ({
      memberId: s.memberId,
      weight: s.weight,
      percent: s.percent,
      fixedAmount: s.fixedAmount,
    })),
  };

  const row = (
    <div className="flex w-full items-center gap-2.5 rounded-xl bg-muted/60 px-3 py-2.5 text-left transition active:bg-muted">
      {/* Fecha */}
      <div className="w-8 shrink-0 text-center leading-tight">
        <div className="text-sm font-bold">{day}</div>
        <div className="text-[11px] text-muted-foreground">{mon}</div>
      </div>

      {/* Ícono */}
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-navy)] text-base">
        {categoryIcon(expense.category)}
      </span>

      {/* Centro */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="max-w-[45%] truncate text-sm font-semibold leading-tight">
            {expense.concept}
          </span>
          <span className="min-w-0 truncate rounded-full bg-[#fde68a] px-1.5 py-0.5 text-[10px] font-semibold text-[#7c4a03]">
            pagó: {payerNames}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {myPaid > 0
            ? `Pagaste ${formatMoney(myPaid, currency)}`
            : `Total ${formatMoney(expense.amount, currency)}`}
        </div>
      </div>

      {/* Saldo a la derecha */}
      <div className="shrink-0 text-right leading-tight">
        {involved ? (
          <>
            <div
              className={cn(
                "text-[11px] font-medium",
                myNet > 0
                  ? "text-pos"
                  : myNet < 0
                    ? "text-neg"
                    : "text-muted-foreground"
              )}
            >
              {myNet > 0 ? "Te deben" : myNet < 0 ? "Debés" : "A mano"}
            </div>
            {myNet !== 0 && (
              <div
                className={cn(
                  "text-sm font-bold tabular",
                  myNet > 0 ? "text-pos" : "text-neg"
                )}
              >
                {formatMoney(Math.abs(myNet), currency)}
              </div>
            )}
          </>
        ) : (
          <div className="text-sm font-bold tabular text-muted-foreground">
            {formatMoney(expense.amount, currency)}
          </div>
        )}
      </div>
    </div>
  );

  if (!canEdit) return <li>{row}</li>;

  return (
    <li>
      <ExpenseSheet
        groupCode={groupCode}
        members={activeMembers}
        currency={currency}
        initial={initial}
        trigger={<button className="w-full">{row}</button>}
      />
    </li>
  );
}
