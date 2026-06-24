import { notFound } from "next/navigation";
import { getGroupByCode, getMembers, getExpenses, getNotes } from "@/db/queries";
import { ConfigView } from "@/components/group/config-view";

export default async function ConfigPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const group = await getGroupByCode(code);
  if (!group) notFound();

  const [members, expenses, notes] = await Promise.all([
    getMembers(group.id),
    getExpenses(group.id),
    getNotes(group.id),
  ]);

  const withActivity = new Set<string>();
  for (const e of expenses) {
    e.payers.forEach((p) => withActivity.add(p.memberId));
    e.shares.forEach((s) => withActivity.add(s.memberId));
  }

  return (
    <ConfigView
      group={group}
      members={members}
      notes={notes}
      memberIdsWithActivity={[...withActivity]}
    />
  );
}
