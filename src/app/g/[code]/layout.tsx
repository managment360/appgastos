import { notFound } from "next/navigation";
import { getGroupByCode, getMembers } from "@/db/queries";
import { GroupTopbar } from "@/components/group/group-topbar";
import { BottomNav } from "@/components/group/bottom-nav";
import { RememberGroup } from "@/components/group/remember-group";
import { WhoAreYou } from "@/components/group/who-are-you";

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const group = await getGroupByCode(code);
  if (!group) notFound();

  const members = await getMembers(group.id);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background shadow-sm">
      <RememberGroup code={group.code} name={group.name} icon={group.icon} />
      <WhoAreYou code={group.code} members={members.filter((m) => m.active)} />
      <GroupTopbar group={group} memberCount={members.filter((m) => m.active).length} />
      <main className="flex-1 pb-28">{children}</main>
      <BottomNav code={group.code} />
    </div>
  );
}
