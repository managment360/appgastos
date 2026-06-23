/**
 * Monedas soportadas. Por defecto ARS.
 * El monto se guarda siempre en centavos enteros; la moneda es a nivel grupo.
 */
export type CurrencyCode =
  | "ARS"
  | "USD"
  | "EUR"
  | "MXN"
  | "UYU"
  | "PYG"
  | "BOB"
  | "PEN";

export type CurrencyInfo = {
  code: CurrencyCode;
  label: string;
  symbol: string;
};

export const CURRENCIES: CurrencyInfo[] = [
  { code: "ARS", label: "Peso argentino", symbol: "$" },
  { code: "USD", label: "Dólar", symbol: "US$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "MXN", label: "Peso mexicano", symbol: "MX$" },
  { code: "UYU", label: "Peso uruguayo", symbol: "$U" },
  { code: "PYG", label: "Guaraní", symbol: "₲" },
  { code: "BOB", label: "Boliviano", symbol: "Bs" },
  { code: "PEN", label: "Sol", symbol: "S/" },
];

export function currencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? `${code} `;
}

export function currencyLabel(code: string): string {
  const c = CURRENCIES.find((x) => x.code === code);
  return c ? `${c.symbol} · ${c.label}` : code;
}
