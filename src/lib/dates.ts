/** Formateo de fechas en ES-AR. */

const longFmt = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const shortFmt = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** "2026-06-20" -> "viernes 20 de junio" (sin desfase de timezone). */
export function formatDateLong(iso: string | null): string {
  if (!iso) return "Sin fecha";
  const d = parseLocal(iso);
  if (!d) return "Sin fecha";
  return longFmt.format(d);
}

/** "2026-06-20" -> "20/06/2026". */
export function formatDateShort(iso: string | null): string {
  if (!iso) return "–";
  const d = parseLocal(iso);
  if (!d) return "–";
  return shortFmt.format(d);
}

const monthYearFmt = new Intl.DateTimeFormat("es-AR", {
  month: "long",
  year: "numeric",
});
const monShortFmt = new Intl.DateTimeFormat("es-AR", { month: "short" });

/** "2026-06-20" -> "Junio de 2026". */
export function formatMonthYear(iso: string | null): string {
  const d = iso ? parseLocal(iso) : null;
  if (!d) return "Sin fecha";
  const s = monthYearFmt.format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "2026-06-20" -> { day: "20", mon: "jun" }. */
export function formatDayMon(iso: string | null): { day: string; mon: string } {
  const d = iso ? parseLocal(iso) : null;
  if (!d) return { day: "–", mon: "" };
  return {
    day: String(d.getDate()),
    mon: monShortFmt.format(d).replace(".", ""),
  };
}

/** Clave de agrupación por mes: "YYYY-MM". */
export function monthKey(iso: string | null): string {
  return iso ? iso.slice(0, 7) : "0000-00";
}

/** Fecha de hoy como "YYYY-MM-DD" en horario local (sin desfase UTC). */
export function todayISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** "YYYY-MM-DD" -> "dd/mm/aaaa" (para mostrar/editar). "" si vacío. */
export function isoToDisplay(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

/** "dd/mm/aaaa" -> "YYYY-MM-DD". null si está incompleta o es inválida. */
export function displayToIso(display: string): string | null {
  const m = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const dd = +m[1];
  const mm = +m[2];
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** Parse de "YYYY-MM-DD" como fecha local (evita corrimiento UTC). */
function parseLocal(iso: string): Date | null {
  const m = iso.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}
