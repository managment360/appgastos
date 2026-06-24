"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { groups, settlements } from "@/db/schema";
import { newId } from "@/lib/ids";
import { revalidatePath } from "next/cache";

async function groupIdOf(code: string): Promise<string> {
  const [g] = await db
    .select()
    .from(groups)
    .where(eq(groups.code, code))
    .limit(1);
  if (!g) throw new Error("Grupo no encontrado.");
  return g.id;
}

const markSchema = z.object({
  groupCode: z.string(),
  fromMemberId: z.string(),
  toMemberId: z.string(),
  amount: z.number().int().positive(),
});

/** Marca una transferencia como pagada (persiste un settlement). */
export async function markTransferPaid(input: z.input<typeof markSchema>) {
  const data = markSchema.parse(input);
  const groupId = await groupIdOf(data.groupCode);
  await db.insert(settlements).values({
    id: newId(),
    groupId,
    fromMemberId: data.fromMemberId,
    toMemberId: data.toMemberId,
    amount: data.amount,
    status: "paid",
    createdAt: new Date().toISOString(),
  });
  revalidateSettle(data.groupCode);
  return { ok: true };
}

/** Deshace una transferencia saldada. */
export async function unmarkTransfer(input: {
  id: string;
  groupCode: string;
}) {
  await db.delete(settlements).where(eq(settlements.id, input.id));
  revalidateSettle(input.groupCode);
  return { ok: true };
}

export async function setGroupStatus(input: {
  groupCode: string;
  status: "active" | "pending_close" | "closed";
}) {
  await db
    .update(groups)
    .set({ status: input.status })
    .where(eq(groups.code, input.groupCode));
  revalidateSettle(input.groupCode);
  revalidatePath(`/g/${input.groupCode}/reporte`);
  return { ok: true };
}

function revalidateSettle(code: string) {
  revalidatePath(`/g/${code}/saldar`);
  revalidatePath(`/g/${code}/saldos`);
  revalidatePath(`/g/${code}`);
}
