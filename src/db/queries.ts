/**
 * Lecturas a la base. Server-only. Async (Postgres / postgres-js).
 */
import "server-only";
import { eq, asc, desc } from "drizzle-orm";
import { db } from "./index";
import {
  groups,
  members,
  expenses,
  expensePayers,
  expenseShares,
  settlements,
  type Group,
  type Member,
  type Expense,
  type ExpensePayer,
  type ExpenseShare,
  type Settlement,
} from "./schema";
import { normalizeCode } from "@/lib/ids";

export async function getGroupByCode(code: string): Promise<Group | undefined> {
  const rows = await db
    .select()
    .from(groups)
    .where(eq(groups.code, normalizeCode(code)))
    .limit(1);
  return rows[0];
}

export async function getMembers(groupId: string): Promise<Member[]> {
  return db
    .select()
    .from(members)
    .where(eq(members.groupId, groupId))
    .orderBy(asc(members.createdAt));
}

export type ExpenseWithDetails = Expense & {
  payers: ExpensePayer[];
  shares: ExpenseShare[];
};

export async function getExpenses(
  groupId: string
): Promise<ExpenseWithDetails[]> {
  const rows = await db
    .select()
    .from(expenses)
    .where(eq(expenses.groupId, groupId))
    .orderBy(desc(expenses.expenseDate), desc(expenses.createdAt));

  return Promise.all(
    rows.map(async (e) => ({
      ...e,
      payers: await db
        .select()
        .from(expensePayers)
        .where(eq(expensePayers.expenseId, e.id)),
      shares: await db
        .select()
        .from(expenseShares)
        .where(eq(expenseShares.expenseId, e.id)),
    }))
  );
}

export async function getSettlements(groupId: string): Promise<Settlement[]> {
  return db.select().from(settlements).where(eq(settlements.groupId, groupId));
}

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
