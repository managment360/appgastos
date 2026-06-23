"use client";

import type { Member } from "@/db/schema";
import { cn } from "@/lib/utils";

/** Selector liviano de "¿quién sos?" para el encuadre personal verde/rojo. */
export function MeSelector({
  members,
  value,
  onChange,
}: {
  members: Member[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  if (members.length === 0) return null;
  return (
    <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
      <span className="shrink-0 text-xs text-muted-foreground">Sos:</span>
      {members.map((m) => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
            value === m.id
              ? "border-[var(--color-navy)] bg-[var(--color-navy)] text-white"
              : "border-border bg-card text-muted-foreground"
          )}
        >
          {m.name}
        </button>
      ))}
    </div>
  );
}
