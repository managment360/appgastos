"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, ImageDown, MessageCircle, Lock, LockOpen, ClipboardCheck } from "lucide-react";
import type { Group, Member } from "@/db/schema";
import type { ReportModel } from "@/lib/report";
import { Button } from "@/components/ui/button";
import { ReportTable } from "./report-table";
import { formatCents } from "@/lib/money";
import { whatsappLink } from "@/lib/share";
import { todayISO } from "@/lib/dates";
import { useCanEdit } from "@/lib/current-member";
import { setGroupStatus } from "@/app/actions/settlements";
import { cn } from "@/lib/utils";

export function ReportView({
  group,
  members,
  report,
}: {
  group: Group;
  members: Member[];
  report: ReportModel;
}) {
  const router = useRouter();
  const canEdit = useCanEdit(group.code, members);
  const [exporting, setExporting] = useState(false);
  const [incBalances, setIncBalances] = useState(true);
  const [incSettle, setIncSettle] = useState(true);
  const [busy, setBusy] = useState(false);
  const sentDate = todayISO();
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? "?";
  const aliasOf = (id: string) =>
    members.find((m) => m.id === id)?.aliasCbu ?? null;
  const symbol = group.currency === "ARS" ? "$" : `${group.currency} `;

  async function snapshot(node: HTMLElement) {
    const { toPng } = await import("html-to-image");
    // pixelRatio alto -> nítido en PC (no pixelado).
    return toPng(node, { backgroundColor: "#ffffff", pixelRatio: 3 });
  }

  async function exportPng() {
    const node = document.getElementById("reporte-print");
    if (!node) return;
    setExporting(true);
    try {
      const url = await snapshot(node);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte-${group.code}.png`;
      a.click();
      toast.success("Imagen descargada");
    } catch {
      toast.error("No se pudo exportar la imagen.");
    } finally {
      setExporting(false);
    }
  }

  async function exportPdf() {
    const node = document.getElementById("reporte-print");
    if (!node) return;
    setExporting(true);
    try {
      const [dataUrl, { jsPDF }] = await Promise.all([
        snapshot(node),
        import("jspdf"),
      ]);
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("img"));
      });
      const landscape = img.width >= img.height;
      const pdf = new jsPDF({
        orientation: landscape ? "landscape" : "portrait",
        unit: "pt",
        format: "a4",
      });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 14;
      const ratio = Math.min(
        (pageW - margin * 2) / img.width,
        (pageH - margin * 2) / img.height
      );
      const w = img.width * ratio;
      const h = img.height * ratio;
      pdf.addImage(dataUrl, "PNG", (pageW - w) / 2, margin, w, h, undefined, "FAST");
      pdf.save(`reporte-${group.code}.pdf`);
      toast.success("PDF descargado");
    } catch {
      toast.error("No se pudo generar el PDF.");
    } finally {
      setExporting(false);
    }
  }

  function summaryText(): string {
    const total = report.rows.reduce((a, r) => a + r.amount, 0);
    const titleTag =
      group.status === "pending_close"
        ? " (PENDIENTE DE CIERRE)"
        : group.status === "closed"
          ? " (CUENTA CERRADA)"
          : "";
    const lines: string[] = [
      `🧾 *${group.name}* — Detalle de Gastos y Deudas${titleTag}`,
      `Total gastado: ${symbol}${formatCents(total)}`,
    ];
    if (group.status === "pending_close") {
      lines.push(
        "",
        "⚠️ Verificá los movimientos para poder cerrar las cuentas."
      );
    }
    if (incBalances) {
      lines.push("", "💰 *Saldos de cada uno*");
      for (const m of report.members) {
        const net = report.totals[m.id] ?? 0;
        if (net > 0)
          lines.push(`• ${m.name}: ${symbol}${formatCents(net)} a favor (le deben)`);
        else if (net < 0)
          lines.push(`• ${m.name}: debe ${symbol}${formatCents(-net)}`);
        else lines.push(`• ${m.name}: al día`);
      }
    }
    if (incSettle) {
      if (report.adjustments.length) {
        lines.push("", "🔄 *Para saldar* (quién le transfiere a quién)");
        for (const a of report.adjustments) {
          const alias = aliasOf(a.toMemberId);
          lines.push(
            `• ${nameOf(a.fromMemberId)} le paga a ${nameOf(a.toMemberId)}: ${symbol}${formatCents(a.amount)}`
          );
          lines.push(
            alias
              ? `   📋 Alias de ${nameOf(a.toMemberId)}: ${alias}`
              : `   (${nameOf(a.toMemberId)} no cargó alias)`
          );
        }
      } else {
        lines.push("", "✅ Están todos a mano, no hacen falta transferencias.");
      }
    }
    return lines.join("\n");
  }

  async function changeStatus(status: "active" | "pending_close" | "closed") {
    setBusy(true);
    try {
      await setGroupStatus({ groupCode: group.code, status });
      toast.success(
        status === "pending_close"
          ? "Marcado como pendiente de cierre"
          : status === "closed"
            ? "Cuenta cerrada"
            : "Grupo reabierto"
      );
      router.refresh();
    } catch {
      toast.error("No se pudo cambiar el estado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col px-4 py-4">
      <div className="no-print mb-3 flex items-center justify-between px-1">
        <h2 className="text-lg font-bold">Reporte</h2>
      </div>

      {/* Qué incluir al enviar */}
      <div className="no-print mb-2 flex items-center gap-2 px-1 text-sm">
        <span className="text-muted-foreground">Enviar:</span>
        <Chip on={incBalances} onClick={() => setIncBalances((v) => !v)}>
          Saldos
        </Chip>
        <Chip on={incSettle} onClick={() => setIncSettle((v) => !v)}>
          Liquidación
        </Chip>
      </div>

      {/* Botones de export */}
      <div className="no-print mb-4 grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          className="h-14 flex-col gap-1 text-xs"
          disabled={exporting}
          onClick={exportPdf}
        >
          <FileText className="size-5" />
          PDF
        </Button>
        <Button
          variant="outline"
          className="h-14 flex-col gap-1 text-xs"
          disabled={exporting}
          onClick={exportPng}
        >
          <ImageDown className="size-5" />
          Imagen
        </Button>
        <Button
          className="h-14 flex-col gap-1 bg-[#25D366] text-xs text-white hover:bg-[#1da851]"
          disabled={!incBalances && !incSettle}
          onClick={() => window.open(whatsappLink(summaryText()), "_blank")}
        >
          <MessageCircle className="size-5" />
          WhatsApp
        </Button>
      </div>

      {/* Tabla */}
      <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <ReportTable
          report={report}
          groupName={group.name}
          groupIcon={group.icon}
          currency={group.currency}
          sentDate={sentDate}
          status={group.status}
        />
      </div>

      {/* Estado / cierre de cuentas (solo admin) */}
      {canEdit && (
        <div className="no-print mt-4 flex flex-col gap-2 rounded-2xl border bg-card p-4">
          <p className="text-sm font-semibold">
            Estado:{" "}
            <span
              className={cn(
                group.status === "closed"
                  ? "text-pos"
                  : group.status === "pending_close"
                    ? "text-[var(--color-gold)]"
                    : "text-muted-foreground"
              )}
            >
              {group.status === "closed"
                ? "Cuenta cerrada"
                : group.status === "pending_close"
                  ? "Pendiente de cierre"
                  : "Abierto"}
            </span>
          </p>

          <div className="flex flex-wrap gap-2">
            {group.status === "active" && (
              <Button
                variant="outline"
                className="h-10 gap-2"
                disabled={busy}
                onClick={() => changeStatus("pending_close")}
              >
                <ClipboardCheck className="size-4" /> Marcar pendiente de cierre
              </Button>
            )}
            {group.status === "pending_close" && (
              <>
                <Button
                  className="h-10 gap-2 bg-[var(--color-pos)] text-white hover:opacity-90"
                  disabled={busy}
                  onClick={() => changeStatus("closed")}
                >
                  <Lock className="size-4" /> Cerrar cuenta (definitivo)
                </Button>
                <Button
                  variant="outline"
                  className="h-10 gap-2"
                  disabled={busy}
                  onClick={() => changeStatus("active")}
                >
                  <LockOpen className="size-4" /> Reabrir
                </Button>
              </>
            )}
            {group.status === "closed" && (
              <Button
                variant="outline"
                className="h-10 gap-2"
                disabled={busy}
                onClick={() => changeStatus("active")}
              >
                <LockOpen className="size-4" /> Reabrir grupo
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            En “pendiente de cierre” podés enviar el reporte para que los miembros
            verifiquen; al cerrar queda como definitivo (igual se puede reabrir).
          </p>
        </div>
      )}

      <p className="no-print mt-3 px-1 text-xs text-muted-foreground">
        Los pagos para saldar están en la solapa <b>Liquidación</b>.
      </p>
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-semibold transition",
        on
          ? "border-[var(--color-navy)] bg-[var(--color-navy)] text-white"
          : "bg-card text-muted-foreground"
      )}
    >
      {children}
    </button>
  );
}
