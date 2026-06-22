"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Copy, Check, PartyPopper, RotateCcw } from "lucide-react";
import type { Group, Member, Settlement } from "@/db/schema";
import type { Transfer } from "@/lib/settle";
import { formatMoney } from "@/lib/money";
import { copyToClipboard } from "@/lib/share";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  markTransferPaid,
  unmarkTransfer,
  setGroupStatus,
} from "@/app/actions/settlements";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export function SettleView({
  group,
  members,
  pending,
  paid,
}: {
  group: Group;
  members: Member[];
  pending: Transfer[];
  paid: Settlement[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const memberOf = (id: string) => members.find((m) => m.id === id);
  const nameOf = (id: string) => memberOf(id)?.name ?? "?";

  async function pay(t: Transfer) {
    const key = `${t.fromMemberId}-${t.toMemberId}`;
    setBusy(key);
    try {
      await markTransferPaid({
        groupCode: group.code,
        fromMemberId: t.fromMemberId,
        toMemberId: t.toMemberId,
        amount: t.amount,
      });
      toast.success("¡Pago registrado!");
      router.refresh();
    } catch {
      toast.error("No se pudo registrar.");
    } finally {
      setBusy(null);
    }
  }

  async function undo(s: Settlement) {
    setBusy(s.id);
    try {
      await unmarkTransfer({ id: s.id, groupCode: group.code });
      router.refresh();
    } catch {
      toast.error("No se pudo deshacer.");
    } finally {
      setBusy(null);
    }
  }

  async function copyAlias(alias?: string | null) {
    if (!alias) return toast.error("Sin alias/CBU cargado.");
    const ok = await copyToClipboard(alias);
    toast[ok ? "success" : "error"](ok ? "¡Alias copiado!" : "No se pudo copiar.");
  }

  const allSettled = pending.length === 0;

  return (
    <div className="flex flex-col px-4 py-4">
      <h2 className="mb-1 px-1 text-lg font-bold">Saldar</h2>
      <p className="mb-4 px-1 text-sm text-muted-foreground">
        Mínimo de transferencias para quedar a mano.
      </p>

      {/* Pendientes */}
      {allSettled ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border bg-pos-soft px-6 py-10 text-center">
          <PartyPopper className="size-8 text-pos" />
          <p className="font-semibold">¡Están todos a mano!</p>
          <p className="text-sm text-muted-foreground">
            No quedan transferencias pendientes.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {pending.map((t) => {
            const key = `${t.fromMemberId}-${t.toMemberId}`;
            const to = memberOf(t.toMemberId);
            return (
              <li
                key={key}
                className="rounded-2xl border bg-card px-4 py-3 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{nameOf(t.fromMemberId)}</span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                  <span className="font-semibold">{nameOf(t.toMemberId)}</span>
                  <span className="ml-auto text-lg font-bold tabular text-neg">
                    {formatMoney(t.amount, group.currency)}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  {to?.aliasCbu ? (
                    <button
                      onClick={() => copyAlias(to.aliasCbu)}
                      className="flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium"
                    >
                      <Copy className="size-3.5" />
                      {to.aliasCbu}
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Sin alias de {to?.name}
                    </span>
                  )}
                  <Button
                    size="sm"
                    className="ml-auto h-8 gap-1"
                    disabled={busy === key}
                    onClick={() => pay(t)}
                  >
                    <Check className="size-4" /> Pagada
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Saldadas */}
      {paid.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Saldadas
          </h3>
          <ul className="flex flex-col gap-2">
            {paid.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-2 rounded-2xl border bg-muted/40 px-4 py-2.5"
              >
                <Check className="size-4 text-pos" />
                <span className="text-sm">
                  {nameOf(s.fromMemberId)} → {nameOf(s.toMemberId)}
                </span>
                <span className="ml-auto text-sm font-medium tabular text-muted-foreground line-through">
                  {formatMoney(s.amount, group.currency)}
                </span>
                <button
                  onClick={() => undo(s)}
                  disabled={busy === s.id}
                  className="text-muted-foreground"
                  aria-label="Deshacer"
                >
                  <RotateCcw className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cerrar / reabrir grupo */}
      <div className="mt-8">
        {group.status === "active" ? (
          <Dialog>
            <DialogTrigger
              render={
                <Button variant="outline" className="h-11 w-full">
                  Cerrar grupo
                </Button>
              }
            />
            <DialogContent className="max-w-xs rounded-2xl">
              <DialogHeader>
                <DialogTitle>¿Cerrar grupo?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Marca el grupo como cerrado. Podés reabrirlo cuando quieras.
              </p>
              <DialogFooter className="flex-row justify-end gap-2">
                <DialogClose render={<Button variant="outline">Cancelar</Button>} />
                <DialogClose
                  render={
                    <Button
                      onClick={async () => {
                        await setGroupStatus({
                          groupCode: group.code,
                          status: "closed",
                        });
                        toast.success("Grupo cerrado");
                        router.refresh();
                      }}
                    >
                      Cerrar grupo
                    </Button>
                  }
                />
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <Button
            variant="outline"
            className="h-11 w-full"
            onClick={async () => {
              await setGroupStatus({ groupCode: group.code, status: "active" });
              toast.success("Grupo reabierto");
              router.refresh();
            }}
          >
            Reabrir grupo
          </Button>
        )}
      </div>
    </div>
  );
}
