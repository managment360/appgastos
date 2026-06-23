"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { Member } from "@/db/schema";
import type { ExpenseWithDetails } from "@/db/queries";
import { categoryIcon } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { ExpenseSheet, type ExpenseInitial } from "./expense-sheet";
import { deleteExpense } from "@/app/actions/expenses";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const nameOf = (id: string) =>
    members.find((m) => m.id === id)?.name ?? "?";

  const payerNames = expense.payers.map((p) => nameOf(p.memberId)).join(", ");

  // Encuadre personal
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
    payers: expense.payers.map((p) => ({
      memberId: p.memberId,
      amount: p.amount,
    })),
    shares: expense.shares.map((s) => ({
      memberId: s.memberId,
      weight: s.weight,
      percent: s.percent,
      fixedAmount: s.fixedAmount,
    })),
  };

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteExpense({ id: expense.id, groupCode });
      toast.success("Gasto eliminado");
      router.refresh();
    } catch {
      toast.error("No se pudo eliminar.");
      setDeleting(false);
    }
  }

  const cardInner = (
    <>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-xl">
        {categoryIcon(expense.category)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-semibold leading-tight">
          {expense.concept}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          pagó {payerNames}
        </span>
        {involved && (
          <span
            className={cn(
              "text-xs font-medium",
              myNet > 0
                ? "text-pos"
                : myNet < 0
                  ? "text-neg"
                  : "text-muted-foreground"
            )}
          >
            {myNet > 0
              ? `pagaste, te deben ${formatMoney(myNet, currency)}`
              : myNet < 0
                ? `te toca ${formatMoney(-myNet, currency)}`
                : "estás a mano"}
          </span>
        )}
        <span className="mt-0.5 text-sm font-bold tabular">
          {formatMoney(expense.amount, currency)}
        </span>
      </span>
    </>
  );

  // Solo lectura: card sin edición ni borrar.
  if (!canEdit) {
    return (
      <li className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex w-full items-start gap-3 px-3 py-3">
          {cardInner}
        </div>
      </li>
    );
  }

  return (
    <li className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Cuerpo: abre edición */}
      <ExpenseSheet
        groupCode={groupCode}
        members={activeMembers}
        currency={currency}
        initial={initial}
        trigger={
          <button className="flex w-full items-start gap-3 py-3 pl-3 pr-12 text-left transition active:bg-muted/50">
            {cardInner}
          </button>
        }
      />

      {/* Borrar */}
      <Dialog>
        <DialogTrigger
          render={
            <button
              className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition active:bg-muted"
              aria-label="Eliminar gasto"
            >
              <Trash2 className="size-4" />
            </button>
          }
        />
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle>¿Eliminar gasto?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se va a borrar &quot;{expense.concept}&quot; ({" "}
            {formatMoney(expense.amount, currency)}).
          </p>
          <DialogFooter className="flex-row justify-end gap-2">
            <DialogClose render={<Button variant="outline">Cancelar</Button>} />
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={handleDelete}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}
