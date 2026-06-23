/**
 * Manejo de dinero. Internamente TODO es centavos (enteros).
 * Formato Argentina: $1.250.000,00  (punto miles, coma decimales).
 */

import { currencySymbol } from "./currencies";

const arsFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** centavos (int) -> "1.250.000,00" (sin signo de moneda). */
export function formatCents(cents: number): string {
  return arsFormatter.format(cents / 100);
}

/** centavos (int) -> "$1.250.000,00" (según la moneda). */
export function formatMoney(cents: number, currency = "ARS"): string {
  return `${currencySymbol(currency)}${formatCents(cents)}`;
}

/** centavos con signo explícito: "+$1.000,00" / "-$1.000,00". */
export function formatSigned(cents: number, currency = "ARS"): string {
  const sign = cents > 0 ? "+" : cents < 0 ? "-" : "";
  return `${sign}${formatMoney(Math.abs(cents), currency)}`;
}

/** "1.250.000,00" o "1250000.5" -> centavos (int). Tolerante a ambos formatos. */
export function parseToCents(input: string | number): number {
  if (typeof input === "number") return Math.round(input * 100);
  const cleaned = input.trim();
  if (!cleaned) return 0;
  let normalized: string;
  if (cleaned.includes(",")) {
    // Formato AR explícito: puntos = miles, coma = decimal.
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(".")) {
    // Sin coma: el punto es ambiguo. Si hay más de un punto, o el último
    // grupo tiene exactamente 3 dígitos, son separadores de miles (AR).
    const parts = cleaned.split(".");
    const last = parts[parts.length - 1];
    const isThousands = parts.length > 2 || /^\d{3}$/.test(last);
    normalized = isThousands ? cleaned.replace(/\./g, "") : cleaned;
  } else {
    normalized = cleaned;
  }
  const value = Number(normalized.replace(/[^0-9.-]/g, ""));
  if (Number.isNaN(value)) return 0;
  return Math.round(value * 100);
}

/**
 * Reparte un total en centavos entre N porciones según pesos, sin perder
 * ni inventar centavos (el residuo va a las primeras porciones).
 * Devuelve un array de centavos que SUMA EXACTAMENTE `totalCents`.
 */
export function distributeCents(totalCents: number, weights: number[]): number[] {
  const sumW = weights.reduce((a, b) => a + b, 0);
  if (sumW <= 0) return weights.map(() => 0);

  const raw = weights.map((w) => (totalCents * w) / sumW);
  const floors = raw.map((r) => Math.floor(r));
  let remainder = totalCents - floors.reduce((a, b) => a + b, 0);

  // Repartimos el residuo (en centavos) a los de mayor parte fraccionaria.
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);

  const result = [...floors];
  for (let k = 0; remainder > 0 && k < order.length; k++, remainder--) {
    result[order[k].i] += 1;
  }
  return result;
}
