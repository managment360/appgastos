"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { FileText, ImageDown, MessageCircle, Copy, ArrowRight } from "lucide-react";
import type { Group, Member } from "@/db/schema";
import type { ReportModel } from "@/lib/report";
import { Button } from "@/components/ui/button";
import { ReportTable } from "./report-table";
import { formatCents, formatMoney } from "@/lib/money";
import { copyToClipboard, whatsappLink } from "@/lib/share";

export function ReportView({
  group,
  members,
  report,
}: {
  group: Group;
  members: Member[];
  report: ReportModel;
}) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<"png" | "pdf" | null>(null);

  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? "?";
  const aliasOf = (id: string) =>
    members.find((m) => m.id === id)?.aliasCbu ?? null;
  const symbol = group.currency === "ARS" ? "$" : `${group.currency} `;

  async function snapshot(): Promise<string | null> {
    if (!tableRef.current) return null;
    return toPng(tableRef.current, {
      backgroundColor: "#ffffff",
      pixelRatio: 2,
    });
  }

  async function exportPng() {
    setExporting("png");
    try {
      const url = await snapshot();
      if (!url) return;
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte-${group.code}.png`;
      a.click();
      toast.success("Imagen descargada");
    } catch {
      toast.error("No se pudo exportar la imagen.");
    } finally {
      setExporting(null);
    }
  }

  async function exportPdf() {
    setExporting("pdf");
    try {
      const url = await snapshot();
      if (!url || !tableRef.current) return;
      const w = tableRef.current.scrollWidth;
      const h = tableRef.current.scrollHeight;
      const orientation = w >= h ? "landscape" : "portrait";
      const pdf = new jsPDF({ orientation, unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const ratio = Math.min((pageW - margin * 2) / w, (pageH - margin * 2) / h);
      pdf.addImage(url, "PNG", margin, margin, w * ratio, h * ratio);
      pdf.save(`reporte-${group.code}.pdf`);
      toast.success("PDF descargado");
    } catch {
      toast.error("No se pudo exportar el PDF.");
    } finally {
      setExporting(null);
    }
  }

  function summaryText(): string {
    const lines: string[] = [];
    lines.push(`🧾 ${group.name} — Reporte`);
    lines.push("");
    lines.push("Saldos:");
    for (const m of report.members) {
      const net = report.totals[m.id] ?? 0;
      const tag = net > 0 ? "le deben" : net < 0 ? "debe" : "a mano";
      lines.push(
        `• ${m.name}: ${net === 0 ? "a mano" : `${symbol}${formatCents(Math.abs(net))} (${tag})`}`
      );
    }
    if (report.adjustments.length) {
      lines.push("");
      lines.push("Pagos para ajuste:");
      for (const a of report.adjustments) {
        lines.push(
          `• ${nameOf(a.fromMemberId)} → ${nameOf(a.toMemberId)}: ${symbol}${formatCents(a.amount)}`
        );
      }
    }
    return lines.join("\n");
  }

  return (
    <div className="flex flex-col px-4 py-4">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-lg font-bold">Reporte</h2>
      </div>

      {/* Botones de export */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          className="h-11 flex-col gap-0.5 text-xs"
          disabled={exporting !== null}
          onClick={exportPdf}
        >
          <FileText className="size-4" />
          PDF
        </Button>
        <Button
          variant="outline"
          className="h-11 flex-col gap-0.5 text-xs"
          disabled={exporting !== null}
          onClick={exportPng}
        >
          <ImageDown className="size-4" />
          Imagen
        </Button>
        <Button
          className="h-11 flex-col gap-0.5 bg-[#25D366] text-xs text-white hover:bg-[#1da851]"
          onClick={() =>
            window.open(whatsappLink(summaryText()), "_blank")
          }
        >
          <MessageCircle className="size-4" />
          WhatsApp
        </Button>
      </div>

      {/* Tabla con scroll horizontal (objetivo de export) */}
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <div ref={tableRef}>
          <ReportTable
            report={report}
            groupName={group.name}
            currency={group.currency}
          />
        </div>
      </div>

      {/* Pagos para ajuste interactivos (alias + copiar) */}
      {report.adjustments.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-2 px-1 text-sm font-bold">Pagos para ajuste</h3>
          <ul className="flex flex-col gap-2">
            {report.adjustments.map((a, i) => {
              const alias = aliasOf(a.toMemberId);
              return (
                <li
                  key={i}
                  className="rounded-2xl border bg-card px-4 py-3 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {nameOf(a.fromMemberId)}
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                    <span className="font-semibold">{nameOf(a.toMemberId)}</span>
                    <span className="ml-auto font-bold tabular text-neg">
                      {formatMoney(a.amount, group.currency)}
                    </span>
                  </div>
                  {alias && (
                    <button
                      onClick={async () => {
                        const ok = await copyToClipboard(alias);
                        toast[ok ? "success" : "error"](
                          ok ? "¡Alias copiado!" : "No se pudo copiar."
                        );
                      }}
                      className="mt-2 flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium"
                    >
                      <Copy className="size-3.5" /> {alias}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
