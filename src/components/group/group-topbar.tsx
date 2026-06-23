"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 border-b bg-background/90 px-3 py-3 backdrop-blur">
      <button
        onClick={() => router.push("/")}
        className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition active:scale-95"
        aria-label="Volver"
      >
        <ArrowLeft className="size-5" />
      </button>

      <div className="flex flex-1 items-center gap-2.5 overflow-hidden">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-lg">
          {group.icon}
        </span>
        <div className="overflow-hidden">
          <h1 className="truncate font-semibold leading-tight">{group.name}</h1>
          <p className="text-xs text-muted-foreground">Código {group.code}</p>
        </div>
      </div>

      <Link
        href={`/g/${group.code}/miembros`}
        className="flex h-9 items-center gap-1 rounded-full bg-muted px-3 text-sm font-medium transition active:scale-95"
      >
        <Users className="size-4" />
        {memberCount}
      </Link>

      <NotesSheet code={group.code} members={members} notes={notes} />
      <ShareGroupSheet group={group} />
    </header>
  );
}
