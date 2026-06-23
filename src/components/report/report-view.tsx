"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileText, ImageDown, MessageCircle } from "lucide-react";
import type { Group, Member } from "@/db/schema";
import type { ReportModel } from "@/lib/report";
import { Button } from "@/components/ui/button";
import { ReportTable } from "./report-table";
import { formatCents } from "@/lib/money";
import { whatsappLink } from "@/lib/share";
import { todayISO } from "@/lib/dates";

export function ReportView({
  group,
  members,
  report,
}: {
  group: Group;
  members: Member[];
  report: ReportModel;
}) {
  const [exporting, setExporting] = useState(false);
  const sentDate = todayISO();
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? "?";
  const aliasOf = (id: string) =>
    members.find((m) => m.id === id)?.aliasCbu ?? null;
  const symbol = group.currency === "ARS" ? "$" : `${group.currency} `;

  async function exportPng() {
    const node = document.getElementById("reporte-print");
    if (!node) return;
    setExporting(true);
    try {
      // Carga diferida: el exportador solo se baja al usarlo (aligera la pestaña).
      const { toPng } = await import("html-to-image");
      const url = await toPng(node, { backgroundColor: "#ffffff", pixelRatio: 2 });
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

  function exportPdf() {
    // Impresión nativa: PDF vectorial nítido, A4, márgenes mínimos (ver globals.css).
    window.print();
  }

  function summaryText(): string {
    const total = report.rows.reduce((a, r) => a + r.amount, 0);
    const lines: string[] = [
      `🧾 *${group.name}* — Detalle de Gastos y Deudas`,
      `Total gastado: ${symbol}${formatCents(total)}`,
      "",
      "💰 *Saldos de cada uno*",
    ];
    for (const m of report.members) {
      const net = report.totals[m.id] ?? 0;
      if (net > 0)
        lines.push(`• ${m.name}: ${symbol}${formatCents(net)} a favor (le deben)`);
      else if (net < 0)
        lines.push(`• ${m.name}: debe ${symbol}${formatCents(-net)}`);
      else lines.push(`• ${m.name}: al día`);
    }
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
    return lines.join("\n");
  }

  return (
    <div className="flex min-w-0 flex-col px-4 py-4">
      <div className="no-print mb-3 flex items-center justify-between px-1">
        <h2 className="text-lg font-bold">Reporte</h2>
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
          PDF / Imprimir
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
          onClick={() => window.open(whatsappLink(summaryText()), "_blank")}
        >
          <MessageCircle className="size-5" />
          WhatsApp
        </Button>
      </div>

      {/* Tabla (scroll horizontal en pantalla; objetivo de impresión/captura) */}
      <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <ReportTable
          report={report}
          groupName={group.name}
          groupIcon={group.icon}
          currency={group.currency}
          sentDate={sentDate}
        />
      </div>

      <p className="no-print mt-3 px-1 text-xs text-muted-foreground">
        Los pagos para saldar están en la solapa <b>Liquidación</b>.
      </p>
    </div>
  );
}
