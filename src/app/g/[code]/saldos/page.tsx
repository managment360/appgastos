import { notFound } from "next/navigation";
import { getGroupFull } from "@/db/queries";
import { computeBalances } from "@/lib/balances";
import { formatMoney, formatSigned } from "@/lib/money";
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
  const maxAbs = Math.max(1, ...balances.map((b) => Math.abs(b.net)));

  return (
    <div className="flex flex-col px-4 py-4">
      <h2 className="mb-1 px-1 text-lg font-bold">Saldos</h2>
      <p className="mb-4 px-1 text-sm text-muted-foreground">
        <span className="text-pos font-medium">Verde</span>: le deben ·{" "}
        <span className="text-neg font-medium">Rojo</span>: debe.
      </p>

      <ul className="flex flex-col gap-2">
        {sorted.map((b) => {
          const pct = (Math.abs(b.net) / maxAbs) * 100;
          const positive = b.net > 0;
          const settled = b.net === 0;
          return (
            <li
              key={b.memberId}
              className="rounded-2xl border bg-card px-4 py-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{nameOf(b.memberId)}</span>
                <span
                  className={cn(
                    "text-lg font-bold tabular",
                    settled
                      ? "text-muted-foreground"
                      : positive
                        ? "text-pos"
                        : "text-neg"
                  )}
                >
                  {settled ? "a mano" : formatSigned(b.net, group.currency)}
                </span>
              </div>

              {/* Barra de magnitud */}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    positive ? "bg-[var(--color-pos)]" : "bg-[var(--color-neg)]"
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="mt-2 flex justify-between text-xs text-muted-foreground tabular">
                <span>
                  Pagó{" "}
                  <span className="text-pos font-medium">
                    {formatMoney(b.paid, group.currency)}
                  </span>
                </span>
                <span>
                  Le toca{" "}
                  <span className="text-neg font-medium">
                    {formatMoney(b.share, group.currency)}
                  </span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
