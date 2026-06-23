"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { groups, members } from "@/db/schema";
import { newId, newGroupCode, normalizeCode } from "@/lib/ids";
import { getGroupByCode } from "@/db/queries";
import { revalidatePath } from "next/cache";

const createSchema = z.object({
  name: z.string().trim().min(1, "Poné un nombre al grupo.").max(60),
  icon: z.string().min(1).default("🧾"),
  description: z.string().trim().max(200).optional(),
  currency: z.string().min(1).default("ARS"),
  /** Nombres de miembros iniciales (opcional). */
  memberNames: z.array(z.string().trim().min(1)).default([]),
});

export type CreateGroupInput = z.input<typeof createSchema>;

export async function createGroup(input: CreateGroupInput) {
  const data = createSchema.parse(input);

  // Generamos un código único (reintenta si colisiona).
  let code = newGroupCode();
  for (let i = 0; i < 5 && (await getGroupByCode(code)); i++)
    code = newGroupCode();

  const groupId = newId();
  const now = new Date().toISOString();

  await db.insert(groups).values({
    id: groupId,
    code,
    name: data.name,
    icon: data.icon,
    description: data.description,
    currency: data.currency,
    status: "active",
    createdAt: now,
  });

  for (const name of data.memberNames) {
    await db
      .insert(members)
      .values({ id: newId(), groupId, name, active: true, createdAt: now });
  }

  return { code, name: data.name, icon: data.icon };
}

/** Verifica que exista un grupo por código (para "unirse"). */
export async function findGroup(code: string) {
  const g = await getGroupByCode(normalizeCode(code));
  if (!g) return { found: false as const };
  return { found: true as const, code: g.code, name: g.name, icon: g.icon };
}

const updateSchema = z.object({
  groupId: z.string(),
  name: z.string().trim().min(1).max(60),
  icon: z.string().min(1),
  description: z.string().trim().max(200).optional(),
});

const notesSchema = z.object({
  groupCode: z.string(),
  notes: z.string().max(4000),
});

export async function updateGroupNotes(input: z.input<typeof notesSchema>) {
  const data = notesSchema.parse(input);
  await db
    .update(groups)
    .set({ notes: data.notes })
    .where(eq(groups.code, data.groupCode));
  revalidatePath(`/g/${data.groupCode}`);
  return { ok: true };
}

export async function updateGroup(input: z.input<typeof updateSchema>) {
  const data = updateSchema.parse(input);
  const [g] = await db
    .select()
    .from(groups)
    .where(eq(groups.id, data.groupId))
    .limit(1);
  if (!g) throw new Error("Grupo no encontrado.");
  await db
    .update(groups)
    .set({ name: data.name, icon: data.icon, description: data.description })
    .where(eq(groups.id, data.groupId));
  revalidatePath(`/g/${g.code}`);
  return { ok: true };
}
