"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Check, Plus } from "lucide-react";
import type { Group } from "@/db/schema";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getRecentGroups, type RecentGroup } from "@/lib/recent-groups";
import { cn } from "@/lib/utils";

/** Título del grupo + selector para saltar a otros grupos del dispositivo. */
export function GroupSwitcher({ group }: { group: Group }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<RecentGroup[]>([]);

  useEffect(() => {
    if (open) setRecent(getRecentGroups());
  }, [open]);

  function go(code: string) {
    setOpen(false);
    if (code !== group.code) router.push(`/g/${code}`);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button className="flex min-w-0 flex-1 items-center gap-1.5 text-left transition active:opacity-70">
            <span className="min-w-0">
              <span className="block truncate text-lg font-bold leading-tight">
                {group.name}
              </span>
              <span className="block text-xs text-muted-foreground">
                Código {group.code}
              </span>
            </span>
            <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
          </button>
        }
      />
      <SheetContent side="bottom" className="gap-0 rounded-t-3xl">
        <SheetHeader className="px-5">
          <SheetTitle className="text-xl">Tus grupos</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-2 px-4 pb-8 pt-2">
          <ul className="flex flex-col gap-2">
            {recent.map((g) => {
              const current = g.code === group.code;
              return (
                <li key={g.code}>
                  <button
                    onClick={() => go(g.code)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition active:scale-[0.99]",
                      current ? "border-primary bg-primary/5" : "bg-card"
                    )}
                  >
                    <span className="flex size-10 items-center justify-center rounded-xl bg-sky text-xl">
                      {g.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold leading-tight">
                        {g.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Código {g.code}
                      </span>
                    </span>
                    {current && <Check className="size-5 text-primary" />}
                  </button>
                </li>
              );
            })}
          </ul>

          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold"
          >
            <Plus className="size-4" /> Crear o unirse a otro grupo
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
