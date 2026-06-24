"use client";

import { useEffect, useState } from "react";
import {
  getTextSize,
  setTextSize,
  applyTextSize,
  TEXT_SIZE_EVENT,
  type TextSize,
} from "@/lib/text-size";
import { cn } from "@/lib/utils";

const OPTIONS: { key: TextSize; label: string; cls: string }[] = [
  { key: "normal", label: "A", cls: "text-sm" },
  { key: "grande", label: "A", cls: "text-base" },
  { key: "xl", label: "A", cls: "text-lg" },
];

/** Selector de tamaño de letra (Aa). Aplica a toda la app. */
export function TextSizeControl() {
  const [size, setSize] = useState<TextSize>("normal");

  useEffect(() => {
    const s = getTextSize();
    setSize(s);
    applyTextSize(s);
    const update = () => setSize(getTextSize());
    window.addEventListener(TEXT_SIZE_EVENT, update);
    return () => window.removeEventListener(TEXT_SIZE_EVENT, update);
  }, []);

  return (
    <div className="flex items-center gap-1 rounded-full border bg-card p-1">
      {OPTIONS.map((o) => (
        <button
          key={o.key}
          onClick={() => setTextSize(o.key)}
          aria-label={`Letra ${o.key}`}
          className={cn(
            "flex size-8 items-center justify-center rounded-full font-bold leading-none transition",
            o.cls,
            size === o.key
              ? "bg-[var(--color-navy)] text-white"
              : "text-muted-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Aplica el tamaño guardado al cargar la app (va en el layout raíz). */
export function TextSizeApplier() {
  useEffect(() => {
    applyTextSize(getTextSize());
  }, []);
  return null;
}
