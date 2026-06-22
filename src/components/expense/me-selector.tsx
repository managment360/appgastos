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
            "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition",
            value === m.id
              ? "border-primary bg-primary/10 text-primary"
              : "bg-card text-muted-foreground"
          )}
        >
          {m.name}
        </button>
      ))}
    </div>
  );
}
