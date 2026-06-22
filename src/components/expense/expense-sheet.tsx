"use client";

import { useMemo, useState } from "react";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Member, SplitType } from "@/db/schema";
import { CATEGORIES } from "@/lib/i18n";
import { formatCents, parseToCents } from "@/lib/money";
import { todayISO } from "@/lib/dates";
import { DateField } from "@/components/ui/date-field";
import { computeShares, validateSplit } from "@/lib/split";
import {
  createExpense,
  updateExpense,
  type ExpenseInput,
} from "@/app/actions/expenses";

export type ExpenseInitial = {
  id: string;
  amount: number;
  concept: string;
  expenseDate: string | null;
  category: string | null;
  splitType: SplitType;
  payers: { memberId: string; amount: number }[];
  shares: {
    memberId: string;
    weight: number | null;
    percent: number | null;
    fixedAmount: number | null;
  }[];
};

const SPLIT_TABS: { key: SplitType; label: string }[] = [
  { key: "equal", label: "Igual" },
  { key: "custom_amount", label: "Importes" },
  { key: "percent", label: "%" },
  { key: "units", label: "Partes" },
];

export function ExpenseSheet({
  groupCode,
  members,
  currency,
  trigger,
  initial,
}: {
  groupCode: string;
  members: Member[];
  currency: string;
  trigger: React.ReactElement;
  initial?: ExpenseInitial;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // --- estado base ---
  const [amountStr, setAmountStr] = useState(
    initial ? formatCents(initial.amount) : ""
  );
  const [concept, setConcept] = useState(initial?.concept ?? "");
  const [date, setDate] = useState(initial?.expenseDate ?? todayISO());
  const [category, setCategory] = useState<string>(initial?.category ?? "");
  const [splitType, setSplitType] = useState<SplitType>(
    initial?.splitType ?? "equal"
  );
  const [saving, setSaving] = useState(false);

  const totalCents = parseToCents(amountStr);

  // --- pagadores ---
  const [multiPayer, setMultiPayer] = useState(
    (initial?.payers.length ?? 0) > 1
  );
  const [singlePayer, setSinglePayer] = useState<string>(
    initial && initial.payers.length === 1
      ? initial.payers[0].memberId
      : members[0]?.id ?? ""
  );
  const [payerAmounts, setPayerAmounts] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    initial?.payers.forEach((p) => (m[p.memberId] = formatCents(p.amount)));
    return m;
  });

  // --- participantes ---
  const [participants, setParticipants] = useState<Set<string>>(
    () =>
      new Set(
        initial ? initial.shares.map((s) => s.memberId) : members.map((m) => m.id)
      )
  );

  // valores por participante según tipo
  const [customAmt, setCustomAmt] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    initial?.shares.forEach((s) => {
      if (s.fixedAmount != null) m[s.memberId] = formatCents(s.fixedAmount);
    });
    return m;
  });
  const [percentVal, setPercentVal] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    initial?.shares.forEach((s) => {
      if (s.percent != null) m[s.memberId] = String(s.percent);
    });
    return m;
  });
  const [units, setUnits] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    initial?.shares.forEach((s) => {
      if (s.weight != null) m[s.memberId] = String(s.weight);
    });
    return m;
  });

  const activeMembers = members; // ya vienen filtrados activos

  function toggleParticipant(id: string) {
    setParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Construye los inputs de participantes para computeShares / validación.
  const participantInputs = useMemo(() => {
    return activeMembers
      .filter((m) => participants.has(m.id))
      .map((m) => ({
        memberId: m.id,
        weight: units[m.id] != null ? Number(units[m.id]) : 1,
        percent: percentVal[m.id] != null ? Number(percentVal[m.id]) : 0,
        fixedAmount: parseToCents(customAmt[m.id] ?? "0"),
      }));
  }, [activeMembers, participants, units, percentVal, customAmt]);

  // Preview de lo que le toca a cada uno.
  const preview = useMemo(() => {
    if (totalCents <= 0) return new Map<string, number>();
    const shares = computeShares(totalCents, splitType, participantInputs);
    return new Map(shares.map((s) => [s.memberId, s.computedAmount]));
  }, [totalCents, splitType, participantInputs]);

  function buildPayers(): { memberId: string; amount: number }[] {
    if (!multiPayer) {
      return [{ memberId: singlePayer, amount: totalCents }];
    }
    return Object.entries(payerAmounts)
      .map(([memberId, v]) => ({ memberId, amount: parseToCents(v) }))
      .filter((p) => p.amount > 0);
  }

  async function handleSubmit() {
    if (totalCents <= 0) return toast.error("Ingresá un monto.");
    if (!concept.trim()) return toast.error("Poné un concepto.");

    const payers = buildPayers();
    const payersSum = payers.reduce((a, p) => a + p.amount, 0);
    if (payers.length === 0) return toast.error("Elegí quién pagó.");
    if (payersSum !== totalCents)
      return toast.error(
        `Lo que pusieron ($${formatCents(payersSum)}) no coincide con el total.`
      );

    const v = validateSplit(totalCents, splitType, participantInputs);
    if (!v.ok) return toast.error(v.message!);

    const payload: ExpenseInput = {
      groupCode,
      amount: totalCents,
      concept: concept.trim(),
      expenseDate: date || null,
      category: category || null,
      splitType,
      payers,
      participants: participantInputs.map((p) => ({
        memberId: p.memberId,
        weight: splitType === "units" ? p.weight : null,
        percent: splitType === "percent" ? p.percent : null,
        fixedAmount: splitType === "custom_amount" ? p.fixedAmount : null,
      })),
    };

    setSaving(true);
    try {
      if (initial) await updateExpense({ ...payload, id: initial.id });
      else await createExpense(payload);
      toast.success(initial ? "Gasto actualizado" : "Gasto agregado");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  const participantCount = participants.size;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger} />
      <SheetContent
        side="bottom"
        className="max-h-[94vh] gap-0 overflow-y-auto rounded-t-3xl"
      >
        <SheetHeader className="px-5">
          <SheetTitle className="text-xl">
            {initial ? "Editar gasto" : "Nuevo gasto"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-5 pb-6">
          {/* Monto grande */}
          <div className="flex flex-col items-center pt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-muted-foreground">
                $
              </span>
              <input
                inputMode="decimal"
                placeholder="0"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                autoFocus={!initial}
                className="w-48 bg-transparent text-center text-4xl font-bold tabular outline-none placeholder:text-muted-foreground/40"
              />
            </div>
          </div>

          {/* Concepto */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="ex-concept">Concepto</Label>
            <Input
              id="ex-concept"
              placeholder="Ej. Carne"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
            />
          </div>

          {/* Categoría */}
          <div className="flex flex-col gap-2">
            <Label>Categoría (opcional)</Label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() =>
                    setCategory((prev) => (prev === c.key ? "" : c.key))
                  }
                  className={cn(
                    "flex items-center justify-center gap-1 rounded-xl border px-2 py-2 text-xs transition",
                    category === c.key
                      ? "border-primary bg-primary/10"
                      : "bg-card"
                  )}
                >
                  <span className="text-sm">{c.icon}</span>
                  <span className="truncate">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pagadores */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>¿Quién pagó?</Label>
              <button
                type="button"
                onClick={() => setMultiPayer((v) => !v)}
                className="text-xs font-medium text-primary"
              >
                {multiPayer ? "Un solo pagador" : "Varios pagadores"}
              </button>
            </div>

            {!multiPayer ? (
              <div className="flex flex-wrap gap-2">
                {activeMembers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSinglePayer(m.id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition",
                      singlePayer === m.id
                        ? "border-primary bg-primary/10 font-medium"
                        : "bg-card"
                    )}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2 rounded-xl border bg-card/50 p-3">
                {activeMembers.map((m) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <span className="flex-1 text-sm">{m.name}</span>
                    <span className="text-sm text-muted-foreground">$</span>
                    <Input
                      inputMode="decimal"
                      placeholder="0"
                      value={payerAmounts[m.id] ?? ""}
                      onChange={(e) =>
                        setPayerAmounts((prev) => ({
                          ...prev,
                          [m.id]: e.target.value,
                        }))
                      }
                      className="h-9 w-28 text-right tabular"
                    />
                  </div>
                ))}
                <PayerSumHint
                  payers={Object.values(payerAmounts)}
                  total={totalCents}
                />
              </div>
            )}
          </div>

          {/* Participantes + división */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1">
                <Users className="size-4" /> Participan ({participantCount})
              </Label>
              <button
                type="button"
                className="text-xs font-medium text-primary"
                onClick={() =>
                  setParticipants(
                    participantCount === activeMembers.length
                      ? new Set()
                      : new Set(activeMembers.map((m) => m.id))
                  )
                }
              >
                {participantCount === activeMembers.length
                  ? "Ninguno"
                  : "Todos"}
              </button>
            </div>

            {/* Tabs de tipo de división */}
            <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1">
              {SPLIT_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSplitType(tab.key)}
                  className={cn(
                    "rounded-lg py-1.5 text-sm font-medium transition",
                    splitType === tab.key
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Lista de miembros con su input según tipo */}
            <ul className="flex flex-col gap-1.5 pt-1">
              {activeMembers.map((m) => {
                const on = participants.has(m.id);
                const toca = preview.get(m.id) ?? 0;
                return (
                  <li
                    key={m.id}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-2 transition",
                      on ? "bg-card" : "bg-muted/40 opacity-60"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleParticipant(m.id)}
                      className={cn(
                        "flex size-5 items-center justify-center rounded-md border",
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-background"
                      )}
                    >
                      {on && "✓"}
                    </button>
                    <span className="flex-1 text-sm">{m.name}</span>

                    {on && splitType === "equal" && (
                      <span className="text-sm tabular text-muted-foreground">
                        ${formatCents(toca)}
                      </span>
                    )}
                    {on && splitType === "custom_amount" && (
                      <Input
                        inputMode="decimal"
                        placeholder="0"
                        value={customAmt[m.id] ?? ""}
                        onChange={(e) =>
                          setCustomAmt((p) => ({ ...p, [m.id]: e.target.value }))
                        }
                        className="h-8 w-24 text-right tabular"
                      />
                    )}
                    {on && splitType === "percent" && (
                      <div className="flex items-center gap-1">
                        <Input
                          inputMode="decimal"
                          placeholder="0"
                          value={percentVal[m.id] ?? ""}
                          onChange={(e) =>
                            setPercentVal((p) => ({
                              ...p,
                              [m.id]: e.target.value,
                            }))
                          }
                          className="h-8 w-16 text-right tabular"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    )}
                    {on && splitType === "units" && (
                      <Input
                        inputMode="numeric"
                        placeholder="1"
                        value={units[m.id] ?? ""}
                        onChange={(e) =>
                          setUnits((p) => ({ ...p, [m.id]: e.target.value }))
                        }
                        className="h-8 w-16 text-right tabular"
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Fecha */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="ex-date">Fecha (opcional)</Label>
            <DateField id="ex-date" value={date} onChange={setDate} />
          </div>

          <Button
            size="lg"
            className="h-12 text-base"
            disabled={saving}
            onClick={handleSubmit}
          >
            {saving ? "Guardando…" : initial ? "Guardar cambios" : "Agregar gasto"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function PayerSumHint({
  payers,
  total,
}: {
  payers: string[];
  total: number;
}) {
  const sum = payers.reduce((a, v) => a + parseToCents(v), 0);
  const ok = sum === total && total > 0;
  return (
    <p
      className={cn(
        "pt-1 text-right text-xs tabular",
        ok ? "text-pos" : "text-muted-foreground"
      )}
    >
      Suma: ${formatCents(sum)} / ${formatCents(total)}
    </p>
  );
}
