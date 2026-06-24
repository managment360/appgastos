"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, LogIn, Receipt, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  getRecentGroups,
  forgetGroup,
  type RecentGroup,
} from "@/lib/recent-groups";
import { getCurrentMember } from "@/lib/current-member";
import {
  deleteGroup,
  getHomeSummaries,
  type HomeSummary,
} from "@/app/actions/groups";
import { formatMoney } from "@/lib/money";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { CreateGroupSheet } from "./create-group-sheet";
import { JoinGroupSheet } from "./join-group-sheet";
import { TextSizeControl } from "@/components/text-size-control";

export function HomeClient() {
  const router = useRouter();
  const [recent, setRecent] = useState<RecentGroup[]>([]);
  const [summaries, setSummaries] = useState<Record<string, HomeSummary>>({});
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const list = getRecentGroups();
    setRecent(list);
    if (list.length === 0) return;
    const items = list.map((g) => ({
      code: g.code,
      memberId: getCurrentMember(g.code),
    }));
    getHomeSummaries(items)
      .then((res) => {
        const map: Record<string, HomeSummary> = {};
        for (const s of res) map[s.code] = s;
        setSummaries(map);
        // Limpio del dispositivo los grupos que ya no existen.
        const gone = res.filter((s) => !s.found).map((s) => s.code);
        if (gone.length) {
          gone.forEach(forgetGroup);
          setRecent((prev) => prev.filter((g) => !gone.includes(g.code)));
        }
      })
      .catch(() => {});
  }, []);

  async function removeGroup(code: string) {
    setDeleting(code);
    try {
      await deleteGroup({ code });
      forgetGroup(code);
      setRecent((prev) => prev.filter((g) => g.code !== code));
      toast.success("Grupo eliminado");
    } catch {
      toast.error("No se pudo eliminar el grupo.");
    } finally {
      setDeleting(null);
    }
  }

  // Total general (suma de saldos conocidos).
  const found = recent.map((g) => summaries[g.code]).filter(Boolean);
  const totalNet = found.reduce((a, s) => a + (s?.net ?? 0), 0);
  const totalCurrency = found.find((s) => s?.currency)?.currency ?? "ARS";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-6 pb-10">
      {/* Top: marca chica, sin logo */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold leading-tight tracking-tight">
            {t.appName}
          </h1>
          <p className="text-xs text-muted-foreground">La app hace las cuentas.</p>
        </div>
        <TextSizeControl />
      </div>

      {/* Grupos */}
      <section className="mb-6">
        <h2 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t.home.recent}
        </h2>

        {recent.length > 0 && (
          <p className="mb-3 px-1 text-base font-bold">
            {totalNet > 0 ? (
              <>
                Te deben un total de:{" "}
                <span className="text-pos">
                  {formatMoney(totalNet, totalCurrency)}
                </span>
              </>
            ) : totalNet < 0 ? (
              <>
                Debés un total de:{" "}
                <span className="text-neg">
                  {formatMoney(-totalNet, totalCurrency)}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">Estás a mano</span>
            )}
          </p>
        )}

        {recent.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed bg-card/50 px-4 py-8 text-center">
            <Receipt className="size-7 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t.home.noRecent}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {recent.map((g) => {
              const s = summaries[g.code];
              const net = s?.net ?? 0;
              const cur = s?.currency ?? "ARS";
              const photo = s?.photo;
              const name = s?.name ?? g.name;
              return (
                <li
                  key={g.code}
                  className="relative flex items-center rounded-2xl border bg-card shadow-sm"
                >
                  <button
                    onClick={() => router.push(`/g/${g.code}`)}
                    className="flex flex-1 items-center gap-3 px-3 py-3 text-left transition active:scale-[0.99]"
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sky text-lg font-bold uppercase">
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        name.slice(0, 1)
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-bold leading-tight">
                        {name}
                      </span>
                      <span
                        className={cn(
                          "block text-sm font-medium",
                          net > 0
                            ? "text-pos"
                            : net < 0
                              ? "text-neg"
                              : "text-muted-foreground"
                        )}
                      >
                        {!s
                          ? "…"
                          : net > 0
                            ? `Te deben ${formatMoney(net, cur)}`
                            : net < 0
                              ? `Debés ${formatMoney(-net, cur)}`
                              : "Estás a mano"}
                      </span>
                    </span>
                    <ChevronRight className="size-5 text-muted-foreground" />
                  </button>

                  <Dialog>
                    <DialogTrigger
                      render={
                        <button
                          aria-label="Eliminar grupo"
                          className="mr-2 flex size-9 items-center justify-center rounded-full text-[var(--color-neg)] transition active:bg-neg-soft"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      }
                    />
                    <DialogContent className="max-w-xs rounded-2xl">
                      <DialogHeader>
                        <DialogTitle>¿Eliminar grupo?</DialogTitle>
                      </DialogHeader>
                      <p className="text-sm text-muted-foreground">
                        Se elimina <strong>{name}</strong> y{" "}
                        <strong>todos sus datos</strong> para todos. No se puede
                        deshacer.
                      </p>
                      <DialogFooter className="flex-row justify-end gap-2">
                        <DialogClose
                          render={<Button variant="outline">Cancelar</Button>}
                        />
                        <DialogClose
                          render={
                            <Button
                              variant="destructive"
                              disabled={deleting === g.code}
                              onClick={() => removeGroup(g.code)}
                            >
                              Eliminar grupo
                            </Button>
                          }
                        />
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </li>
              );
            })}
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
