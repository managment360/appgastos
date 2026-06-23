import { notFound } from "next/navigation";
import { getGroupFull } from "@/db/queries";
import { buildReport } from "@/lib/report";
import { ReportView } from "@/components/report/report-view";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const data = await getGroupFull(code);
  if (!data) notFound();

  const { group, members, expenses, settlements } = data;
  const activeOrInvolved = members; // mostramos todos en el reporte

  // Reporte en orden ascendente: del primer gasto cargado al último.
  const ordered = [...expenses].sort((a, b) =>
    a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0
  );

  const report = buildReport(
    activeOrInvolved.map((m) => ({ id: m.id, name: m.name })),
    ordered.map((e) => ({
      id: e.id,
      concept: e.concept,
      amount: e.amount,
      expenseDate: e.expenseDate,
      payers: e.payers.map((p) => ({ memberId: p.memberId, amount: p.amount })),
      shares: e.shares.map((s) => ({
        memberId: s.memberId,
        computedAmount: s.computedAmount,
      })),
    })),
    settlements
  );

  return (
    <ReportView
      group={group}
      members={members}
      report={report}
    />
  );
}
