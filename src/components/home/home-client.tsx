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
import { deleteGroup } from "@/app/actions/groups";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { CreateGroupSheet } from "./create-group-sheet";
import { JoinGroupSheet } from "./join-group-sheet";
import { TextSizeControl } from "@/components/text-size-control";

export function HomeClient() {
  const router = useRouter();
  const [recent, setRecent] = useState<RecentGroup[]>([]);

  useEffect(() => {
    setRecent(getRecentGroups());
  }, []);

  const [deleting, setDeleting] = useState<string | null>(null);

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

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-8 pb-10">
      {/* Encabezado compacto */}
      <div className="mb-7 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--color-navy)] text-xl text-white">
          🧾
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold leading-tight tracking-tight">
            {t.appName}
          </h1>
          <p className="text-sm text-muted-foreground">
            La app hace las cuentas.
          </p>
        </div>
        <TextSizeControl />
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
              <li
                key={g.code}
                className="relative flex items-center rounded-2xl border bg-card shadow-sm"
              >
                <button
                  onClick={() => router.push(`/g/${g.code}`)}
                  className="flex flex-1 items-center gap-3 px-4 py-3.5 text-left transition active:scale-[0.99]"
                >
                  <span className="flex size-11 items-center justify-center rounded-xl bg-sky text-xl">
                    {g.icon}
                  </span>
                  <span className="flex-1">
                    <span className="block text-base font-semibold leading-tight">
                      {g.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Código {g.code}
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
                      Se elimina <strong>{g.name}</strong> y{" "}
                      <strong>todos sus datos</strong> (gastos, miembros, saldos)
                      para todos los integrantes. Esta acción no se puede deshacer.
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
