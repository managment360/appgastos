"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, LogIn, Receipt } from "lucide-react";
import { getRecentGroups, type RecentGroup } from "@/lib/recent-groups";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { CreateGroupSheet } from "./create-group-sheet";
import { JoinGroupSheet } from "./join-group-sheet";

export function HomeClient() {
  const router = useRouter();
  const [recent, setRecent] = useState<RecentGroup[]>([]);

  useEffect(() => {
    setRecent(getRecentGroups());
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-12 pb-10">
      {/* Encabezado */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-3 flex size-16 items-center justify-center rounded-2xl bg-pos-soft text-3xl shadow-sm">
          🧾
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{t.appName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Viajes, asados, eventos. La app hace las cuentas.
        </p>
      </div>

      {/* Grupos recientes */}
      <section className="mb-6">
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t.home.recent}
        </h2>
        {recent.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed bg-card/50 px-4 py-8 text-center">
            <Receipt className="size-7 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t.home.noRecent}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {recent.map((g) => (
              <li key={g.code}>
                <button
                  onClick={() => router.push(`/g/${g.code}`)}
                  className="flex w-full items-center gap-3 rounded-2xl border bg-card px-4 py-3 text-left shadow-sm transition active:scale-[0.99]"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-xl">
                    {g.icon}
                  </span>
                  <span className="flex-1">
                    <span className="block font-semibold leading-tight">
                      {g.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {g.code}
                    </span>
                  </span>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Acciones */}
      <div className="mt-auto flex flex-col gap-3">
        <CreateGroupSheet
          trigger={
            <Button size="lg" className="h-13 w-full gap-2 text-base">
              <Plus className="size-5" /> {t.home.createGroup}
            </Button>
          }
        />
        <JoinGroupSheet
          trigger={
            <Button
              size="lg"
              variant="outline"
              className="h-13 w-full gap-2 text-base"
            >
              <LogIn className="size-5" /> {t.home.joinWithCode}
            </Button>
          }
        />
      </div>
    </main>
  );
}
