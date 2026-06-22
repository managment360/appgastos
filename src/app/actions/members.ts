"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { groups, members } from "@/db/schema";
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
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(60),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().max(120).optional(),
  aliasCbu: z.string().trim().max(120).optional(),
});

export async function addMember(input: z.input<typeof addSchema>) {
  const data = addSchema.parse(input);
  const groupId = await groupIdOf(data.groupCode);
  const id = newId();
  await db.insert(members).values({
    id,
    groupId,
    name: data.name,
    phone: data.phone || null,
    email: data.email || null,
    aliasCbu: data.aliasCbu || null,
    active: true,
    createdAt: new Date().toISOString(),
  });
  revalidatePath(`/g/${data.groupCode}/miembros`);
  return { id };
}

const updateSchema = addSchema.extend({ id: z.string() });

export async function updateMember(input: z.input<typeof updateSchema>) {
  const data = updateSchema.parse(input);
  await db
    .update(members)
    .set({
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      aliasCbu: data.aliasCbu || null,
    })
    .where(eq(members.id, data.id));
  revalidatePath(`/g/${data.groupCode}/miembros`);
  return { ok: true };
}

export async function setMemberActive(input: {
  id: string;
  groupCode: string;
  active: boolean;
}) {
  await db
    .update(members)
    .set({ active: input.active })
    .where(eq(members.id, input.id));
  revalidatePath(`/g/${input.groupCode}/miembros`);
  return { ok: true };
}

export async function deleteMember(input: { id: string; groupCode: string }) {
  // Cascade borra payers/shares de ese miembro.
  await db.delete(members).where(eq(members.id, input.id));
  revalidatePath(`/g/${input.groupCode}/miembros`);
  revalidatePath(`/g/${input.groupCode}`);
  return { ok: true };
}
