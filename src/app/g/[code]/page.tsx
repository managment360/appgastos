import { notFound } from "next/navigation";
import { getGroupFull } from "@/db/queries";
import { computeBalances } from "@/lib/balances";
import { ExpensesView } from "@/components/expense/expenses-view";

export default async function ExpensesPage({
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

  return (
    <ExpensesView
      group={group}
      members={members}
      expenses={expenses}
      balances={balances}
    />
  );
}
