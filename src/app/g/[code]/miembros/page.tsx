import { notFound } from "next/navigation";
import { getGroupByCode, getMembers, getExpenses } from "@/db/queries";
import { MembersView } from "@/components/members/members-view";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const group = await getGroupByCode(code);
  if (!group) notFound();

  const [members, expenses] = await Promise.all([
    getMembers(group.id),
    getExpenses(group.id),
  ]);

  // Marca qué miembros ya tienen movimientos (no se pueden borrar sin más).
  const withActivity = new Set<string>();
  for (const e of expenses) {
    e.payers.forEach((p) => withActivity.add(p.memberId));
    e.shares.forEach((s) => withActivity.add(s.memberId));
  }

  return (
    <MembersView
      group={group}
      members={members}
      memberIdsWithActivity={[...withActivity]}
    />
  );
}
