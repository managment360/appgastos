import type { ReportModel } from "@/lib/report";
import { formatCents } from "@/lib/money";
import { formatDateShort } from "@/lib/dates";

/**
 * Tabla del reporte estilo Splid. Presentacional puro.
 * Usa colores HEX inline (no clases oklch de Tailwind) para que el export a
 * imagen/PDF salga fiel. Se usa en pantalla y como objetivo de impresión/captura.
 */
const NAVY = "#15253f";
const NAVY_SOFT = "#22375c";
const GREEN = "#1f8a4c";
const RED = "#c0392b";
const SKY = "#c7dcef";
const LINE = "#d8e1ee";
const MUTED = "#5f718c";

export function ReportTable({
  report,
  groupName,
  groupIcon,
  currency,
  sentDate,
}: {
  report: ReportModel;
  groupName: string;
  groupIcon?: string;
  currency: string;
  /** Fecha de envío (ISO YYYY-MM-DD). */
  sentDate: string;
}) {
  const { members, rows } = report;
  const symbol = currency === "ARS" ? "$" : `${currency} `;

  // Totales por miembro (pagó / prorrateo) y diferencia.
  const tot: Record<string, { paid: number; share: number }> = {};
  members.forEach((m) => (tot[m.id] = { paid: 0, share: 0 }));
  rows.forEach((r) =>
    members.forEach((m) => {
      tot[m.id].paid += r.cells[m.id].paid;
      tot[m.id].share += r.cells[m.id].share;
    })
  );
  const grandTotal = rows.reduce((a, r) => a + r.amount, 0);

  const th: React.CSSProperties = {
    background: NAVY,
    color: "#fff",
    fontWeight: 600,
    padding: "7px 9px",
    border: `1px solid ${NAVY_SOFT}`,
    whiteSpace: "nowrap",
  };
  const sub: React.CSSProperties = {
    background: NAVY_SOFT,
    color: "#fff",
    fontWeight: 600,
    padding: "5px 9px",
    border: `1px solid ${NAVY}`,
    fontSize: "11px",
    textAlign: "center",
  };
  const td: React.CSSProperties = {
    padding: "6px 9px",
    border: `1px solid ${LINE}`,
    textAlign: "right",
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
  };
  const tdL: React.CSSProperties = { ...td, textAlign: "left" };
  const foot: React.CSSProperties = {
    ...td,
    background: SKY,
    fontWeight: 700,
    borderTop: `2px solid ${NAVY}`,
  };

  return (
    <div
      id="reporte-print"
      style={{
        background: "#fff",
        color: NAVY,
        padding: "18px",
        display: "inline-block",
        minWidth: "100%",
        fontFamily:
          "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif",
      }}
    >
      {/* Encabezado */}
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 19, fontWeight: 800, margin: 0 }}>
          {groupIcon ? `${groupIcon} ` : ""}
          {groupName}
        </h2>
        <p style={{ fontSize: 14, fontWeight: 600, color: NAVY, margin: "2px 0 0" }}>
          Detalle de Gastos y Deudas
        </p>
        <p style={{ fontSize: 12, color: MUTED, margin: "2px 0 0" }}>
          Enviado el {formatDateShort(sentDate)}
        </p>
      </div>

      <table style={{ borderCollapse: "collapse", fontSize: 12.5 }}>
        <thead>
          <tr>
            <th rowSpan={2} style={{ ...th, textAlign: "left" }}>
              Gasto
            </th>
            <th rowSpan={2} style={th}>
              Importe
            </th>
            <th rowSpan={2} style={{ ...th, textAlign: "left" }}>
              Pagó
            </th>
            <th rowSpan={2} style={th}>
              Fecha
            </th>
            {members.map((m) => (
              <th key={m.id} colSpan={2} style={{ ...th, textAlign: "center" }}>
                {m.name}
              </th>
            ))}
          </tr>
          <tr>
            {members.map((m) => (
              <FragmentSub key={m.id} sub={sub} />
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.expenseId}>
              <td style={{ ...tdL, fontWeight: 600 }}>{r.concept}</td>
              <td style={td}>
                {symbol}
                {formatCents(r.amount)}
              </td>
              <td style={tdL}>{r.payerNames}</td>
              <td style={td}>{formatDateShort(r.date)}</td>
              {members.map((m) => {
                const cell = r.cells[m.id];
                return (
                  <FragmentCell
                    key={m.id}
                    td={td}
                    symbol={symbol}
                    paid={cell.paid}
                    share={cell.share}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          {/* Totales por columna */}
          <tr>
            <td style={{ ...foot, textAlign: "left" }} colSpan={3}>
              Totales
            </td>
            <td style={foot}>
              {symbol}
              {formatCents(grandTotal)}
            </td>
            {members.map((m) => (
              <td key={m.id} colSpan={2} style={{ ...foot, padding: 0 }}>
                <div style={{ display: "flex" }}>
                  <span
                    style={{
                      flex: 1,
                      padding: "6px 9px",
                      color: GREEN,
                      borderRight: `1px solid ${NAVY}`,
                    }}
                  >
                    {tot[m.id].paid ? `${symbol}${formatCents(tot[m.id].paid)}` : "–"}
                  </span>
                  <span style={{ flex: 1, padding: "6px 9px", color: RED }}>
                    {tot[m.id].share ? `-${symbol}${formatCents(tot[m.id].share)}` : "–"}
                  </span>
                </div>
              </td>
            ))}
          </tr>
          {/* Diferencia (Gasto Total) */}
          <tr>
            <td
              style={{ ...foot, textAlign: "left", background: NAVY, color: "#fff" }}
              colSpan={4}
            >
              Gasto Total
            </td>
            {members.map((m) => {
              const diff = tot[m.id].paid - tot[m.id].share;
              return (
                <td
                  key={m.id}
                  colSpan={2}
                  style={{
                    ...foot,
                    background: NAVY,
                    color: diff > 0 ? "#7ee2a6" : diff < 0 ? "#ff9b8f" : "#fff",
                    textAlign: "center",
                    fontWeight: 800,
                  }}
                >
                  {diff < 0 ? "-" : ""}
                  {symbol}
                  {formatCents(Math.abs(diff))}
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function FragmentSub({ sub }: { sub: React.CSSProperties }) {
  return (
    <>
      <th style={sub}>Pagó</th>
      <th style={sub}>Prorrateo</th>
    </>
  );
}

function FragmentCell({
  td,
  symbol,
  paid,
  share,
}: {
  td: React.CSSProperties;
  symbol: string;
  paid: number;
  share: number;
}) {
  const GREENc = "#1f8a4c";
  const REDc = "#c0392b";
  return (
    <>
      <td style={{ ...td, color: GREENc, fontWeight: 600 }}>
        {paid ? `${symbol}${formatCents(paid)}` : ""}
      </td>
      <td style={{ ...td, color: REDc }}>
        {share ? `-${symbol}${formatCents(share)}` : ""}
      </td>
    </>
  );
}
