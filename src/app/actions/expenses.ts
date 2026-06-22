"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  groups,
  expenses,
  expensePayers,
  expenseShares,
} from "@/db/schema";
import { newId } from "@/lib/ids";
import { computeShares, validateSplit, type ShareInput } from "@/lib/split";
import { revalidatePath } from "next/cache";

const payerSchema = z.object({
  memberId: z.string(),
  amount: z.number().int().nonnegative(),
});

const participantSchema = z.object({
  memberId: z.string(),
  weight: z.number().nonnegative().nullable().optional(),
  percent: z.number().nonnegative().nullable().optional(),
  fixedAmount: z.number().int().nonnegative().nullable().optional(),
});

const expenseSchema = z.object({
  groupCode: z.string(),
  amount: z.number().int().positive("El monto debe ser mayor a cero."),
  concept: z.string().trim().min(1, "Poné un concepto."),
  expenseDate: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  splitType: z.enum(["equal", "custom_amount", "percent", "units"]),
  payers: z.array(payerSchema).min(1, "Elegí al menos un pagador."),
  participants: z.array(participantSchema).min(1, "Elegí participantes."),
});

export type ExpenseInput = z.input<typeof expenseSchema>;

function assertConsistent(data: z.infer<typeof expenseSchema>) {
  const payersSum = data.payers.reduce((a, p) => a + p.amount, 0);
  if (payersSum !== data.amount)
    throw new Error("La suma de lo que pagó cada uno debe ser igual al total.");

  const v = validateSplit(
    data.amount,
    data.splitType,
    data.participants as ShareInput[]
  );
  if (!v.ok) throw new Error(v.message ?? "División inválida.");
}

async function getGroupIdOrThrow(code: string): Promise<string> {
  const [g] = await db
    .select()
    .from(groups)
    .where(eq(groups.code, code))
    .limit(1);
  if (!g) throw new Error("Grupo no encontrado.");
  return g.id;
}

export async function createExpense(input: ExpenseInput) {
  const data = expenseSchema.parse(input);
  assertConsistent(data);
  const groupId = await getGroupIdOrThrow(data.groupCode);

  const expenseId = newId();
  const now = new Date().toISOString();

  await db.insert(expenses).values({
    id: expenseId,
    groupId,
    amount: data.amount,
    concept: data.concept,
    expenseDate: data.expenseDate ?? now.slice(0, 10),
    splitType: data.splitType,
    category: data.category ?? null,
    createdAt: now,
  });

  await insertPayersAndShares(expenseId, data);
  revalidateGroup(data.groupCode);
  return { id: expenseId };
}

export async function updateExpense(input: ExpenseInput & { id: string }) {
  const { id, ...rest } = input;
  const data = expenseSchema.parse(rest);
  assertConsistent(data);

  await db
    .update(expenses)
    .set({
      amount: data.amount,
      concept: data.concept,
      expenseDate: data.expenseDate ?? null,
      splitType: data.splitType,
      category: data.category ?? null,
    })
    .where(eq(expenses.id, id));

  // Reemplazo total de payers/shares.
  await db.delete(expensePayers).where(eq(expensePayers.expenseId, id));
  await db.delete(expenseShares).where(eq(expenseShares.expenseId, id));
  await insertPayersAndShares(id, data);

  revalidateGroup(data.groupCode);
  return { id };
}

export async function deleteExpense(input: {
  id: string;
  groupCode: string;
}) {
  await db.delete(expenses).where(eq(expenses.id, input.id));
  revalidateGroup(input.groupCode);
  return { ok: true };
}

// ---- helpers internos ----

async function insertPayersAndShares(
  expenseId: string,
  data: z.infer<typeof expenseSchema>
) {
  for (const p of data.payers) {
    await db
      .insert(expensePayers)
      .values({ id: newId(), expenseId, memberId: p.memberId, amount: p.amount });
  }

  const computed = computeShares(
    data.amount,
    data.splitType,
    data.participants as ShareInput[]
  );
  const byMember = new Map(data.participants.map((p) => [p.memberId, p]));

  for (const c of computed) {
    const src = byMember.get(c.memberId);
    await db.insert(expenseShares).values({
      id: newId(),
      expenseId,
      memberId: c.memberId,
      weight: src?.weight ?? null,
      percent: src?.percent ?? null,
      fixedAmount: src?.fixedAmount ?? null,
      computedAmount: c.computedAmount,
    });
  }
}

function revalidateGroup(code: string) {
  revalidatePath(`/g/${code}`);
  revalidatePath(`/g/${code}/saldos`);
  revalidatePath(`/g/${code}/saldar`);
  revalidatePath(`/g/${code}/reporte`);
}
