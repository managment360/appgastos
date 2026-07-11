/**
 * Lecturas a la base. Server-only. Async (Postgres / postgres-js).
 */
import "server-only";
import { cache } from "react";
import { eq, asc, desc, inArray } from "drizzle-orm";
import { db } from "./index";
import {
  groups,
  members,
  expenses,
  expensePayers,
  expenseShares,
  settlements,
  notes,
  type Group,
  type Member,
  type Expense,
  type ExpensePayer,
  type ExpenseShare,
  type Settlement,
  type Note,
} from "./schema";
import { normalizeCode } from "@/lib/ids";

export const getGroupByCode = cache(
  async (code: string): Promise<Group | undefined> => {
    const normalized = normalizeCode(code);
    const run = () =>
      db.select().from(groups).where(eq(groups.code, normalized)).limit(1);

    let rows = await run();
    // Reintento anti-404: cuando la base free recién despierta, una lectura
    // inmediatamente después de crear el grupo puede volver vacía por un
    // instante. Antes de rendirnos (notFound), reintentamos una vez para no
    // tirar un 404 duro sobre un grupo que SÍ existe.
    if (rows.length === 0) {
      await new Promise((r) => setTimeout(r, 300));
      rows = await run();
    }
    return rows[0];
  }
);

export const getMembers = cache(
  async (groupId: string): Promise<Member[]> => {
    return db
      .select()
      .from(members)
      .where(eq(members.groupId, groupId))
      .orderBy(asc(members.createdAt));
  }
);

export type ExpenseWithDetails = Expense & {
  payers: ExpensePayer[];
  shares: ExpenseShare[];
};

export const getExpenses = cache(async (
  groupId: string
): Promise<ExpenseWithDetails[]> => {
  const rows = await db
    .select()
    .from(expenses)
    .where(eq(expenses.groupId, groupId))
    .orderBy(desc(expenses.expenseDate), desc(expenses.createdAt));

  if (rows.length === 0) return [];

  // Una sola consulta para TODOS los pagadores y otra para TODAS las shares
  // (evita el N+1: 3 consultas en vez de 1 + 2·N).
  const ids = rows.map((e) => e.id);
  const [payers, shares] = await Promise.all([
    db.select().from(expensePayers).where(inArray(expensePayers.expenseId, ids)),
    db.select().from(expenseShares).where(inArray(expenseShares.expenseId, ids)),
  ]);

  const payersByExpense = new Map<string, ExpensePayer[]>();
  for (const p of payers) {
    const arr = payersByExpense.get(p.expenseId);
    if (arr) arr.push(p);
    else payersByExpense.set(p.expenseId, [p]);
  }
  const sharesByExpense = new Map<string, ExpenseShare[]>();
  for (const s of shares) {
    const arr = sharesByExpense.get(s.expenseId);
    if (arr) arr.push(s);
    else sharesByExpense.set(s.expenseId, [s]);
  }

  return rows.map((e) => ({
    ...e,
    payers: payersByExpense.get(e.id) ?? [],
    shares: sharesByExpense.get(e.id) ?? [],
  }));
});

export const getSettlements = cache(
  async (groupId: string): Promise<Settlement[]> => {
    return db.select().from(settlements).where(eq(settlements.groupId, groupId));
  }
);

export const getNotes = cache(async (groupId: string): Promise<Note[]> => {
  return db
    .select()
    .from(notes)
    .where(eq(notes.groupId, groupId))
    .orderBy(desc(notes.createdAt));
});

export type GroupFull = {
  group: Group;
  members: Member[];
  expenses: ExpenseWithDetails[];
  settlements: Settlement[];
};

/** Carga completa del grupo para las pantallas de cálculo/reporte. */
export async function getGroupFull(
  code: string
): Promise<GroupFull | undefined> {
  const group = await getGroupByCode(code);
  if (!group) return undefined;
  const [m, e, s] = await Promise.all([
    getMembers(group.id),
    getExpenses(group.id),
    getSettlements(group.id),
  ]);
  return { group, members: m, expenses: e, settlements: s };
}
