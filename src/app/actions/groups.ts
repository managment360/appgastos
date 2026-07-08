"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { groups, members } from "@/db/schema";
import { newId, newGroupCode, normalizeCode } from "@/lib/ids";
import { getGroupByCode, getGroupFull } from "@/db/queries";
import { computeBalances } from "@/lib/balances";
import { revalidatePath } from "next/cache";

export type HomeSummary = {
  code: string;
  found: boolean;
  name?: string;
  photo?: string | null;
  currency?: string;
  net?: number;
};

/** Resumen por grupo para la home: nombre, foto, moneda y saldo del miembro. */
export async function getHomeSummaries(
  items: { code: string; memberId: string | null }[]
): Promise<HomeSummary[]> {
  const out: HomeSummary[] = [];
  for (const it of items) {
    const data = await getGroupFull(it.code);
    if (!data) {
      out.push({ code: it.code, found: false });
      continue;
    }
    const balances = computeBalances(
      data.members.map((m) => m.id),
      data.expenses,
      data.settlements
    );
    const net = it.memberId
      ? balances.find((b) => b.memberId === it.memberId)?.net ?? 0
      : 0;
    out.push({
      code: data.group.code,
      found: true,
      name: data.group.name,
      photo: data.group.photo,
      currency: data.group.currency,
      net,
    });
  }
  return out;
}

const createSchema = z.object({
  name: z.string().trim().min(1, "Poné un nombre al grupo.").max(60),
  icon: z.string().min(1).default("🧾"),
  photo: z.string().max(3_000_000).nullable().optional(),
  description: z.string().trim().max(200).optional(),
  currency: z.string().min(1).default("ARS"),
  /**
   * Quien crea el grupo (identidad del dispositivo). Se suma como miembro
   * ADMIN automáticamente, así el creador nunca "se pierde" del grupo.
   */
  creator: z
    .object({
      name: z.string().trim().min(1),
      aliasCbu: z.string().trim().max(120).optional(),
      phone: z.string().trim().max(40).optional(),
      email: z.string().trim().max(120).optional(),
    })
    .optional(),
  /** Otros miembros iniciales (opcional), con flag de administrador. */
  members: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        isAdmin: z.boolean().optional(),
      })
    )
    .default([]),
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
    photo: data.photo ?? null,
    description: data.description,
    currency: data.currency,
    status: "active",
    createdAt: now,
  });

  // El creador entra primero, como administrador.
  let creatorMemberId: string | null = null;
  if (data.creator) {
    creatorMemberId = newId();
    await db.insert(members).values({
      id: creatorMemberId,
      groupId,
      name: data.creator.name,
      aliasCbu: data.creator.aliasCbu || null,
      phone: data.creator.phone || null,
      email: data.creator.email || null,
      active: true,
      isAdmin: true,
      createdAt: now,
    });
  }

  // Resto de miembros: evito duplicar al creador si lo tipearon de nuevo.
  const creatorName = data.creator?.name.trim().toLowerCase();
  for (const m of data.members) {
    if (creatorName && m.name.trim().toLowerCase() === creatorName) continue;
    await db.insert(members).values({
      id: newId(),
      groupId,
      name: m.name,
      active: true,
      isAdmin: m.isAdmin ?? false,
      createdAt: now,
    });
  }

  return { code, name: data.name, icon: data.icon, creatorMemberId };
}

/** Elimina el grupo y todos sus datos (cascade). Irreversible. */
export async function deleteGroup(input: { code: string }) {
  await db.delete(groups).where(eq(groups.code, normalizeCode(input.code)));
  return { ok: true };
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

const profileSchema = z.object({
  groupCode: z.string(),
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(60),
  /** data URL base64 o null para quitar. */
  photo: z.string().max(3_000_000).nullable().optional(),
});

/** Edita nombre y/o foto del grupo (Personalizar grupo). */
export async function updateGroupProfile(input: z.input<typeof profileSchema>) {
  const data = profileSchema.parse(input);
  const set: { name: string; photo?: string | null } = { name: data.name };
  if (data.photo !== undefined) set.photo = data.photo;
  await db
    .update(groups)
    .set(set)
    .where(eq(groups.code, normalizeCode(data.groupCode)));
  revalidatePath(`/g/${data.groupCode}`);
  revalidatePath(`/g/${data.groupCode}/config`);
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
