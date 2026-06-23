"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { groups, notes } from "@/db/schema";
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

const addSchema = z.object({
  groupCode: z.string(),
  memberId: z.string().nullable().optional(),
  text: z.string().trim().min(1, "Escribí algo.").max(1000),
});

export async function addNote(input: z.input<typeof addSchema>) {
  const data = addSchema.parse(input);
  const groupId = await groupIdOf(data.groupCode);
  await db.insert(notes).values({
    id: newId(),
    groupId,
    memberId: data.memberId ?? null,
    text: data.text,
    createdAt: new Date().toISOString(),
  });
  revalidatePath(`/g/${data.groupCode}`);
  return { ok: true };
}

export async function deleteNote(input: { id: string; groupCode: string }) {
  await db.delete(notes).where(eq(notes.id, input.id));
  revalidatePath(`/g/${input.groupCode}`);
  return { ok: true };
}
