"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Check, PartyPopper, MessageCircle } from "lucide-react";
import type { Group, Member, Settlement } from "@/db/schema";
import type { Transfer } from "@/lib/settle";
import { formatMoney } from "@/lib/money";
import { copyToClipboard, whatsappLink } from "@/lib/share";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { markTransferPaid, unmarkTransfer } from "@/app/actions/settlements";
import { useCanEdit } from "@/lib/current-member";

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
  const canEdit = useCanEdit(group.code, members);
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

  function sendWhatsApp() {
    const lines = [`💸 *${group.name}* — Liquidación`, ""];
    for (const t of pending) {
      const alias = memberOf(t.toMemberId)?.aliasCbu;
      lines.push(
        `• ${nameOf(t.fromMemberId)} le debe a ${nameOf(t.toMemberId)}: ${formatMoney(
          t.amount,
          group.currency
        )}`
      );
      lines.push(
        alias
          ? `   📋 Alias de ${nameOf(t.toMemberId)}: ${alias}`
          : `   (${nameOf(t.toMemberId)} no cargó alias)`
      );
    }
    window.open(whatsappLink(lines.join("\n")), "_blank");
  }

  const allSettled = pending.length === 0;

  return (
    <div className="flex flex-col gap-2 px-4 py-4">
      {/* Leyenda */}
      <div className="rounded-2xl border border-[var(--color-gold)]/40 bg-[var(--color-gold-soft)] px-4 py-2.5 text-[var(--color-navy)]">
        <p className="text-sm font-bold">Cuentas claras conservan la amistad 🤝</p>
        <p className="text-xs">Reintegremos a quienes pagaron los gastos.</p>
      </div>

      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-bold">Liquidación</h2>
        {!allSettled && (
          <button
            onClick={sendWhatsApp}
            className="flex items-center gap-1 text-sm font-semibold text-gold"
          >
            <MessageCircle className="size-4" /> Enviar
          </button>
        )}
      </div>

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
                className="overflow-hidden rounded-xl border border-[#94a3b8] bg-card shadow-sm"
              >
                {/* Fila 1: quién le debe a quién + importe */}
                <div className="flex items-center gap-2 px-4 pt-2.5">
                  <span className="text-sm font-semibold leading-tight">
                    {nameOf(t.fromMemberId)}{" "}
                    <span className="font-normal text-muted-foreground">
                      le debe a
                    </span>{" "}
                    {nameOf(t.toMemberId)}
                  </span>
                  <span className="ml-auto text-lg font-extrabold tabular text-neg">
                    {formatMoney(t.amount, group.currency)}
                  </span>
                </div>
                {/* Fila 2: alias + acción */}
                <div className="flex items-center gap-2 px-4 pb-2.5 pt-2">
                  {to?.aliasCbu ? (
                    <button
                      onClick={() => copyAlias(to.aliasCbu)}
                      className="flex items-center gap-1.5 text-sm font-semibold text-[#2563eb] underline"
                    >
                      <Copy className="size-3.5" />
                      {to.aliasCbu}
                    </button>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {to?.name} sin alias
                    </span>
                  )}
                  {canEdit && (
                    <Button
                      className="ml-auto h-10 gap-1.5 bg-[var(--color-neg)] px-4 text-white hover:opacity-90"
                      disabled={busy === key}
                      onClick={() => pay(t)}
                    >
                      Registrar Pago
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Saldadas */}
      {paid.length > 0 && (
        <div className="mt-3">
          <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pagos cancelados
          </h3>
          <ul className="flex flex-col gap-2">
            {paid.map((s) => (
              <li
                key={s.id}
                className="overflow-hidden rounded-xl border border-[#94a3b8] bg-card shadow-sm"
              >
                <div className="flex items-center gap-2 px-4 pt-2.5">
                  <span className="text-sm font-semibold leading-tight">
                    {nameOf(s.fromMemberId)}{" "}
                    <span className="font-normal text-muted-foreground">
                      le pagó a
                    </span>{" "}
                    {nameOf(s.toMemberId)}
                  </span>
                  <span className="ml-auto text-base font-bold tabular text-muted-foreground line-through">
                    {formatMoney(s.amount, group.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2 px-4 pb-2.5 pt-2">
                  {canEdit ? (
                    <Button
                      className="h-10 gap-1.5 bg-[var(--color-pos)] px-4 text-white hover:opacity-90"
                      disabled={busy === s.id}
                      onClick={() => undo(s)}
                    >
                      <Check className="size-4" /> Cancelado
                    </Button>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-pos">
                      <Check className="size-4" /> Cancelado
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
