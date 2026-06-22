import type { ReportModel } from "@/lib/report";
import { formatCents } from "@/lib/money";
import { formatDateShort } from "@/lib/dates";
import { cn } from "@/lib/utils";

/**
 * Tabla del reporte estilo Splid. Presentacional puro.
 * Se usa en pantalla (scroll horizontal) y como objetivo de export.
 */
export function ReportTable({
  report,
  groupName,
  currency,
}: {
  report: ReportModel;
  groupName: string;
  currency: string;
}) {
  const { members, rows, totals, adjustments } = report;
  const nameOf = (id: string) =>
    members.find((m) => m.id === id)?.name ?? "?";
  const symbol = currency === "ARS" ? "$" : `${currency} `;

  return (
    <div className="inline-block min-w-full bg-white p-4 text-zinc-900">
      {/* Encabezado */}
      <div className="mb-3">
        <h2 className="text-lg font-bold">{groupName}</h2>
        <p className="text-xs text-zinc-500">
          Reporte de gastos · {formatDateShort(new Date().toISOString().slice(0, 10))}
        </p>
      </div>

      <table className="border-collapse text-xs">
        <thead>
          <tr className="border-b-2 border-zinc-300">
            <th className="px-2 py-1.5 text-left font-semibold">Título</th>
            <th className="px-2 py-1.5 text-right font-semibold">Cantidad</th>
            <th className="px-2 py-1.5 text-left font-semibold">De</th>
            <th className="px-2 py-1.5 text-left font-semibold">Fecha</th>
            {members.map((m) => (
              <th
                key={m.id}
                colSpan={2}
                className="border-l border-zinc-200 px-2 py-1.5 text-center font-semibold"
              >
                {m.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.expenseId} className="border-b border-zinc-100">
              <td className="px-2 py-1.5 font-medium">{r.concept}</td>
              <td className="px-2 py-1.5 text-right tabular">
                {symbol}
                {formatCents(r.amount)}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap">{r.payerNames}</td>
              <td className="px-2 py-1.5 whitespace-nowrap">
                {formatDateShort(r.date)}
              </td>
              {members.map((m) => {
                const cell = r.cells[m.id];
                return (
                  <td
                    key={m.id}
                    colSpan={2}
                    className="border-l border-zinc-200 px-2 py-1.5 text-right tabular"
                  >
                    <div className="flex flex-col items-end leading-tight">
                      {cell.paid > 0 && (
                        <span className="font-semibold text-green-600">
                          {symbol}
                          {formatCents(cell.paid)}
                        </span>
                      )}
                      {cell.share > 0 && (
                        <span className="text-red-600">
                          -{symbol}
                          {formatCents(cell.share)}
                        </span>
                      )}
                      {cell.paid === 0 && cell.share === 0 && (
                        <span className="text-zinc-300">–</span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Fila de totales */}
          <tr className="border-t-2 border-zinc-300 font-semibold">
            <td className="px-2 py-2" colSpan={4}>
              Saldo neto
            </td>
            {members.map((m) => {
              const net = totals[m.id] ?? 0;
              return (
                <td
                  key={m.id}
                  colSpan={2}
                  className={cn(
                    "border-l border-zinc-200 px-2 py-2 text-right tabular",
                    net > 0
                      ? "text-green-600"
                      : net < 0
                        ? "text-red-600"
                        : "text-zinc-400"
                  )}
                >
                  {net > 0 ? "" : net < 0 ? "-" : ""}
                  {symbol}
                  {formatCents(Math.abs(net))}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>

      {/* Pagos para ajuste */}
      <div className="mt-4">
        <h3 className="mb-1 text-sm font-bold">Pagos para ajuste</h3>
        {adjustments.length === 0 ? (
          <p className="text-xs text-zinc-500">
            Están todos a mano, no hacen falta transferencias.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5 text-xs">
            {adjustments.map((a, i) => (
              <li key={i} className="tabular">
                <span className="font-medium">{nameOf(a.fromMemberId)}</span>
                {" → "}
                <span className="font-medium">{nameOf(a.toMemberId)}</span>
                {": "}
                <span className="font-semibold">
                  {symbol}
                  {formatCents(a.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
