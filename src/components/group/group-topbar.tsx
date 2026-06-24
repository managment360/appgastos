"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import type { Group, Member, Note } from "@/db/schema";
import { ShareGroupSheet } from "./share-group-sheet";
import { NotesSheet } from "./notes-sheet";

export function GroupTopbar({
  group,
  memberCount,
  members,
  notes,
}: {
  group: Group;
  memberCount: number;
  members: Member[];
  notes: Note[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const base = `/g/${group.code}`;

  // En una sub-pantalla (saldos/saldar/reporte/miembros) la flecha vuelve a
  // Gastos; en Gastos vuelve al inicio.
  function goBack() {
    if (pathname === base) router.push("/");
    else router.push(base);
  }

  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 border-b bg-background/90 px-3 py-3 backdrop-blur">
      <button
        onClick={goBack}
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition active:scale-95"
        aria-label="Volver"
      >
        <ArrowLeft className="size-5" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-bold leading-tight">
          {group.name}
        </h1>
        <p className="text-xs text-muted-foreground">Código {group.code}</p>
      </div>

      <Link
        href={`${base}/miembros`}
        className="flex h-9 shrink-0 items-center gap-1 rounded-full bg-muted px-3 text-sm font-medium transition active:scale-95"
      >
        <Users className="size-4" />
        {memberCount}
      </Link>

      <NotesSheet code={group.code} members={members} notes={notes} />
      <ShareGroupSheet group={group} />
    </header>
  );
}
