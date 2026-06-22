import { notFound } from "next/navigation";
import { getGroupFull } from "@/db/queries";
import { computeBalances } from "@/lib/balances";
import { minCashFlow } from "@/lib/settle";
import { SettleView } from "@/components/settle/settle-view";

export default async function SettlePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const data = await getGroupFull(code);
  if (!data) notFound();

  const { group, members, expenses, settlements } = data;
  const balances = computeBalances(
    members.map((m) => m.id),
    expenses,
    settlements
  );
  const pending = minCashFlow(
    balances.map((b) => ({ memberId: b.memberId, net: b.net }))
  );

  const paid = settlements.filter((s) => s.status === "paid");

  return (
    <SettleView
      group={group}
      members={members}
      pending={pending}
      paid={paid}
    />
  );
}
