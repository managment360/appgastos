import type { ReportModel } from "@/lib/report";
import { formatCents } from "@/lib/money";
import { formatDateShort } from "@/lib/dates";

/**
 * Tabla del reporte estilo Splid. Presentacional puro.
 * Colores HEX inline (no clases oklch) para que el export a imagen/PDF salga fiel.
 */
const NAVY = "#15253f";
const NAVY_SOFT = "#22375c";
const GREEN = "#1f8a4c";
const RED = "#c0392b";
const SKY = "#c7dcef";
const GROUP = "#15253f"; // separador fuerte ENTRE miembros (navy)
const MUTED = "#5f718c";
const TINT = "#eef3f9"; // fondo claro de cada celda de monto
const WHITE = "#ffffff"; // líneas blancas (solo en la fila navy "Gasto Total")
const DARK = "#1a2740"; // líneas oscuras que dividen cada monto en el cuerpo

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
  sentDate: string;
}) {
  const { members, rows } = report;
  const symbol = currency === "ARS" ? "$" : `${currency} `;

  const tot: Record<string, { paid: number; share: number }> = {};
  members.forEach((m) => (tot[m.id] = { paid: 0, share: 0 }));
  rows.forEach((r) =>
    members.forEach((m) => {
      tot[m.id].paid += r.cells[m.id].paid;
      tot[m.id].share += r.cells[m.id].share;
    })
  );
  const grandTotal = rows.reduce((a, r) => a + r.amount, 0);

  // Líneas oscuras dividen cada monto en el cuerpo; el separador entre miembros
  // (navy, 3px) marca dónde empieza cada persona. La fila navy "Gasto Total"
  // usa líneas blancas (override más abajo).
  const border = `1px solid ${DARK}`;
  const groupBorder = `3px solid ${GROUP}`;

  const th: React.CSSProperties = {
    background: NAVY,
    color: "#fff",
    fontWeight: 600,
    padding: "7px 9px",
    border: `2px solid ${NAVY_SOFT}`,
    whiteSpace: "nowrap",
  };
  const sub: React.CSSProperties = {
    background: NAVY_SOFT,
    color: "#fff",
    fontWeight: 600,
    padding: "5px 9px",
    border: `2px solid ${NAVY}`,
    fontSize: "11px",
    textAlign: "center",
  };
  const td: React.CSSProperties = {
    padding: "6px 9px",
    border,
    background: TINT,
    textAlign: "right",
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
  };
  const tdL: React.CSSProperties = { ...td, textAlign: "left" };
  const foot: React.CSSProperties = {
    ...td,
    background: SKY,
    fontWeight: 700,
    borderTop: `3px solid ${NAVY}`,
  };

  // Bordes que marcan el inicio de cada miembro (separador fuerte).
  const gl = { borderLeft: groupBorder } as React.CSSProperties;

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
              <th
                key={m.id}
                colSpan={2}
                style={{ ...th, ...gl, textAlign: "center" }}
              >
                {m.name}
              </th>
            ))}
          </tr>
          <tr>
            {members.map((m) => (
              <FragmentSub key={m.id} sub={sub} gl={gl} />
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
                    gl={gl}
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
          {/* Totales por columna (celdas reales, alineadas) */}
          <tr>
            <td style={{ ...foot, textAlign: "left" }} colSpan={3}>
              Totales
            </td>
            <td style={foot}>
              {symbol}
              {formatCents(grandTotal)}
            </td>
            {members.map((m) => (
              <FragmentTotal
                key={m.id}
                foot={foot}
                gl={gl}
                symbol={symbol}
                paid={tot[m.id].paid}
                share={tot[m.id].share}
              />
            ))}
          </tr>
          {/* Diferencia (Gasto Total) — fila navy con líneas BLANCAS */}
          <tr>
            <td
              style={{
                ...foot,
                textAlign: "left",
                background: NAVY,
                color: "#fff",
                border: `2px solid ${WHITE}`,
                borderTop: `3px solid ${NAVY}`,
              }}
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
                    border: `2px solid ${WHITE}`,
                    borderLeft: `3px solid ${WHITE}`,
                    borderTop: `3px solid ${NAVY}`,
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

function FragmentSub({
  sub,
  gl,
}: {
  sub: React.CSSProperties;
  gl: React.CSSProperties;
}) {
  return (
    <>
      <th style={{ ...sub, ...gl }}>Pagó</th>
      <th style={sub}>Prorrateo</th>
    </>
  );
}

function FragmentCell({
  td,
  gl,
  symbol,
  paid,
  share,
}: {
  td: React.CSSProperties;
  gl: React.CSSProperties;
  symbol: string;
  paid: number;
  share: number;
}) {
  return (
    <>
      <td style={{ ...td, ...gl, color: GREEN, fontWeight: 600 }}>
        {paid ? `${symbol}${formatCents(paid)}` : ""}
      </td>
      <td style={{ ...td, color: RED }}>
        {share ? `-${symbol}${formatCents(share)}` : ""}
      </td>
    </>
  );
}

function FragmentTotal({
  foot,
  gl,
  symbol,
  paid,
  share,
}: {
  foot: React.CSSProperties;
  gl: React.CSSProperties;
  symbol: string;
  paid: number;
  share: number;
}) {
  return (
    <>
      <td style={{ ...foot, ...gl, color: GREEN }}>
        {paid ? `${symbol}${formatCents(paid)}` : "–"}
      </td>
      <td style={{ ...foot, color: RED }}>
        {share ? `-${symbol}${formatCents(share)}` : "–"}
      </td>
    </>
  );
}
