"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { isoToDisplay, displayToIso } from "@/lib/dates";

/**
 * Campo de fecha con formato AR dd/mm/aaaa (con barras automáticas).
 * Internamente trabaja en ISO "YYYY-MM-DD". onChange recibe "" si está incompleta.
 */
export function DateField({
  value,
  onChange,
  id,
}: {
  value: string; // ISO "YYYY-MM-DD" o ""
  onChange: (iso: string) => void;
  id?: string;
}) {
  const [text, setText] = useState(() => isoToDisplay(value));

  // Sincroniza si el valor cambia desde afuera (ej. al abrir en modo edición).
  useEffect(() => {
    setText(isoToDisplay(value));
  }, [value]);

  function handle(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    let out = digits;
    if (digits.length > 4)
      out = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    else if (digits.length > 2)
      out = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    setText(out);
    onChange(displayToIso(out) ?? "");
  }

  return (
    <Input
      id={id}
      inputMode="numeric"
      placeholder="dd/mm/aaaa"
      value={text}
      onChange={(e) => handle(e.target.value)}
    />
  );
}
