"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Formatea AR a medida que se tipea: puntos de miles y coma decimal.
 * "1250000" -> "1.250.000" · "1250000,5" -> "1.250.000,5"
 */
export function formatMoneyTyping(raw: string): string {
  let s = raw.replace(/[^\d,]/g, "");
  const firstComma = s.indexOf(",");
  if (firstComma !== -1) {
    s = s.slice(0, firstComma + 1) + s.slice(firstComma + 1).replace(/,/g, "");
  }
  // eslint-disable-next-line prefer-const
  let [int = "", dec] = s.split(",");
  int = int.replace(/^0+(?=\d)/, "");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (dec !== undefined) return `${grouped || "0"},${dec.slice(0, 2)}`;
  return grouped;
}

type Props = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value" | "type"
> & {
  value: string;
  onChange: (formatted: string) => void;
};

/** Input controlado de monto con máscara AR en vivo. */
export function MoneyInput({ value, onChange, className, ...props }: Props) {
  return (
    <input
      {...props}
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(formatMoneyTyping(e.target.value))}
      className={cn("tabular", className)}
    />
  );
}
