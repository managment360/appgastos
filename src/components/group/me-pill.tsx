"use client";

import { UserRound } from "lucide-react";
import type { Member } from "@/db/schema";
import { useCurrentMember } from "@/lib/current-member";

/**
 * Pastilla "Vos: {nombre}" dentro del grupo. Muestra con qué miembro entraste
 * en este dispositivo (identidad por grupo). Si todavía no elegiste, no aparece
 * (el diálogo "¿Quién sos?" ya te lo pregunta al entrar).
 */
export function MePill({ code, members }: { code: string; members: Member[] }) {
  const meId = useCurrentMember(code);
  const me = members.find((m) => m.id === meId);
  if (!me) return null;

  return (
    <span className="flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1.5 text-sm font-medium text-white backdrop-blur">
      <UserRound className="size-3.5" />
      <span className="max-w-[8rem] truncate">Vos: {me.name}</span>
    </span>
  );
}
