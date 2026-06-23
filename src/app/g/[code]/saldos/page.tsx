import { notFound } from "next/navigation";
import { getGroupFull } from "@/db/queries";
import { computeBalances } from "@/lib/balances";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export default async function BalancesPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const data = await getGroupFull(code);
  if (!data) notFound();

  const { group, members, expenses, settlements } = data;
  const balances = computeBalances(
    members.map((m) => m.id),
    expenses,
    settlements
  );
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? "?";
  const sorted = [...balances].sort((a, b) => b.net - a.net);
  const total = expenses.reduce((a, e) => a + e.amount, 0);

  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      <div className="rounded-2xl bg-[var(--color-navy)] px-5 py-4 text-white">
        <p className="text-xs uppercase tracking-wide text-[var(--color-sky)]">
          Total gastado
        </p>
        <p className="text-3xl font-extrabold tabular">
          {formatMoney(total, group.currency)}
        </p>
      </div>

      <h2 className="mt-1 px-1 text-lg font-bold">Balance por miembro</h2>

      <ul className="flex flex-col gap-3">
        {sorted.map((b) => {
          const positive = b.net > 0;
          const settled = b.net === 0;
          return (
            <li
              key={b.memberId}
              className="overflow-hidden rounded-2xl border bg-card shadow-sm"
            >
              <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2.5">
                <span className="text-base font-bold">
                  {nameOf(b.memberId)}
                </span>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-sm font-bold tabular",
                    settled
                      ? "bg-muted text-muted-foreground"
                      : positive
                        ? "bg-pos-soft text-pos"
                        : "bg-neg-soft text-neg"
                  )}
                >
                  {settled
                    ? "A mano"
                    : positive
                      ? `A cobrar ${formatMoney(b.net, group.currency)}`
                      : `A pagar ${formatMoney(-b.net, group.currency)}`}
                </span>
              </div>
              <div className="grid grid-cols-2 divide-x">
                <Stat label="Pagó" value={formatMoney(b.paid, group.currency)} />
                <Stat
                  label="Prorrateo (le toca)"
                  value={formatMoney(b.share, group.currency)}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <p className="px-1 pt-1 text-xs text-muted-foreground">
        <span className="font-semibold text-pos">A cobrar</span>: le deben ·{" "}
        <span className="font-semibold text-neg">A pagar</span>: debe.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-base font-semibold tabular">{value}</p>
    </div>
  );
}
