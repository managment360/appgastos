"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Plus,
  Pencil,
  Trash2,
  UserCheck,
  Smartphone,
  UserPlus,
  History,
} from "lucide-react";
import type { Activity, ActivityType } from "@/db/schema";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const SEEN_KEY = "dg:activity-seen";

function getSeen(code: string): string {
  if (typeof window === "undefined") return "";
  try {
    const map = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "{}");
    return map[code] ?? "";
  } catch {
    return "";
  }
}
function setSeen(code: string, iso: string) {
  if (typeof window === "undefined") return;
  try {
    const map = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "{}");
    map[code] = iso;
    localStorage.setItem(SEEN_KEY, JSON.stringify(map));
  } catch {}
}

function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "recién";
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `hace ${d} d`;
  const mo = Math.floor(d / 30);
  return `hace ${mo} mes${mo > 1 ? "es" : ""}`;
}

const ICON: Record<ActivityType, { icon: typeof Plus; className: string }> = {
  expense_add: { icon: Plus, className: "bg-pos-soft text-pos" },
  expense_edit: { icon: Pencil, className: "bg-muted text-foreground" },
  expense_delete: { icon: Trash2, className: "bg-neg-soft text-neg" },
  member_claim: { icon: UserCheck, className: "bg-sky text-navy" },
  member_switch: { icon: Smartphone, className: "bg-sky text-navy" },
  member_join: { icon: UserPlus, className: "bg-sky text-navy" },
};

export function ActivityBell({
  code,
  activity,
}: {
  code: string;
  activity: Activity[];
}) {
  const [open, setOpen] = useState(false);
  const [hasUnseen, setHasUnseen] = useState(false);

  const latest = activity[0]?.createdAt ?? "";

  useEffect(() => {
    setHasUnseen(!!latest && latest > getSeen(code));
  }, [code, latest]);

  function onOpenChange(o: boolean) {
    setOpen(o);
    if (o && latest) {
      setSeen(code, latest);
      setHasUnseen(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetTrigger
        render={
          <button
            aria-label="Actividad del grupo"
            className="relative flex size-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition active:scale-95"
          >
            <Bell className="size-5" />
            {hasUnseen && (
              <span className="absolute right-2 top-2 size-2 rounded-full bg-[var(--color-gold)] ring-2 ring-black/30" />
            )}
          </button>
        }
      />
      <SheetContent side="bottom" className="max-h-[80vh] gap-0 rounded-t-3xl">
        <SheetHeader className="px-5">
          <SheetTitle className="flex items-center gap-2">
            <History className="size-5" /> Actividad del grupo
          </SheetTitle>
        </SheetHeader>

        {activity.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <Bell className="size-7 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Todavía no hay actividad. Acá vas a ver cuándo se cargan gastos o
              entra gente al grupo.
            </p>
          </div>
        ) : (
          <ul className="flex max-h-[64vh] flex-col divide-y overflow-y-auto px-2 pb-8">
            {activity.map((a) => {
              const conf = ICON[a.type] ?? ICON.expense_edit;
              const Icon = conf.icon;
              return (
                <li key={a.id} className="flex items-start gap-3 px-3 py-3">
                  <span
                    className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${conf.className}`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">
                      {a.actorName && (
                        <span className="font-semibold">{a.actorName} </span>
                      )}
                      {a.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {timeAgo(a.createdAt)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
