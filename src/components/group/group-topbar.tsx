"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import type { Group, Member, Note } from "@/db/schema";
import { ShareGroupSheet } from "./share-group-sheet";
import { NotesSheet } from "./notes-sheet";
import { GroupSwitcher } from "./group-switcher";

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

      <div className="flex min-w-0 flex-1 items-center">
        <GroupSwitcher group={group} />
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
