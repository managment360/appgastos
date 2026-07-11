"use server";

import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { groups, members, expensePayers, expenseShares } from "@/db/schema";
import { logActivity } from "@/db/activity";
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
  isAdmin: z.boolean().optional(),
  /** Si quien lo agrega ES esta persona (se suma a sí misma al unirse). */
  claimed: z.boolean().optional(),
  /** Token del dispositivo que ocupa el lugar (cuando claimed=true). */
  deviceId: z.string().optional(),
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
    isAdmin: data.isAdmin ?? false,
    claimed: data.claimed ?? false,
    claimedBy: data.claimed ? data.deviceId || null : null,
    createdAt: new Date().toISOString(),
  });
  if (data.claimed) {
    await logActivity(groupId, "member_join", data.name, "se sumó al grupo");
  }
  revalidatePath(`/g/${data.groupCode}/miembros`);
  revalidatePath(`/g/${data.groupCode}`);
  return { id };
}

/**
 * Ocupar un lugar LIBRE al entrar como esa persona. Atómico: si otro
 * dispositivo lo tomó primero, falla (no se puede entrar dos veces al mismo).
 */
export async function claimMember(input: {
  code: string;
  memberId: string;
  deviceId: string;
}) {
  const rows = await db
    .update(members)
    .set({ claimed: true, claimedBy: input.deviceId })
    .where(and(eq(members.id, input.memberId), eq(members.claimed, false)))
    .returning({
      name: members.name,
      groupId: members.groupId,
    });

  revalidatePath(`/g/${input.code}`);

  if (rows.length === 0) {
    const [m] = await db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.id, input.memberId))
      .limit(1);
    // Existe pero ya estaba tomado, o no existe.
    return { ok: false as const, alreadyClaimed: !!m };
  }
  await logActivity(rows[0].groupId, "member_claim", rows[0].name, "reclamó su lugar");
  return { ok: true as const };
}

/**
 * "Soy yo pero desde otro dispositivo": ocupa un lugar YA tomado y expulsa al
 * anterior (su claimedBy deja de coincidir y queda afuera en su próxima carga).
 */
export async function switchDeviceClaim(input: {
  code: string;
  memberId: string;
  deviceId: string;
}) {
  const rows = await db
    .update(members)
    .set({ claimed: true, claimedBy: input.deviceId })
    .where(eq(members.id, input.memberId))
    .returning({ name: members.name, groupId: members.groupId });

  if (rows.length === 0) return { ok: false as const };
  revalidatePath(`/g/${input.code}`);
  await logActivity(
    rows[0].groupId,
    "member_switch",
    rows[0].name,
    "ingresó desde otro dispositivo"
  );
  return { ok: true as const, name: rows[0].name };
}

/**
 * Migración blanda: un dispositivo que ya "era" este miembro (de antes del
 * sistema de lugares) adopta el lugar si todavía no tiene dueño. Sin log.
 */
export async function adoptClaim(input: { memberId: string; deviceId: string }) {
  await db
    .update(members)
    .set({ claimed: true, claimedBy: input.deviceId })
    .where(and(eq(members.id, input.memberId), isNull(members.claimedBy)));
  return { ok: true as const };
}

export async function setMemberAdmin(input: {
  id: string;
  groupCode: string;
  isAdmin: boolean;
}) {
  await db
    .update(members)
    .set({ isAdmin: input.isAdmin })
    .where(eq(members.id, input.id));
  revalidatePath(`/g/${input.groupCode}/miembros`);
  revalidatePath(`/g/${input.groupCode}`);
  return { ok: true };
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
  // No permitir eliminar si participa o pagó algún gasto (hay que reasignar primero).
  const [pay] = await db
    .select({ id: expensePayers.id })
    .from(expensePayers)
    .where(eq(expensePayers.memberId, input.id))
    .limit(1);
  const [sh] = await db
    .select({ id: expenseShares.id })
    .from(expenseShares)
    .where(eq(expenseShares.memberId, input.id))
    .limit(1);
  if (pay || sh) {
    throw new Error(
      "No se puede eliminar: el miembro tiene gastos. Desactivalo en su lugar."
    );
  }
  await db.delete(members).where(eq(members.id, input.id));
  revalidatePath(`/g/${input.groupCode}/miembros`);
  revalidatePath(`/g/${input.groupCode}`);
  return { ok: true };
}
