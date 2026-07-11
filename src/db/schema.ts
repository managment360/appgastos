/**
 * Schema de Drizzle — PostgreSQL (Supabase).
 *
 * Decisiones:
 *  - Montos en ENTEROS de centavos (sin floats).
 *  - Timestamps como ISO string (TEXT) -> simple y portable.
 *  - IDs como TEXT (uuid) generados en la app.
 *
 * Migrado desde SQLite: el resto de la app no cambia su lógica, solo
 * el dialecto y el driver (ver db/index.ts).
 */
import { pgTable, text, integer, real, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export type SplitType = "equal" | "custom_amount" | "percent" | "units";
export type GroupStatus = "active" | "pending_close" | "closed";
export type SettlementStatus = "pending" | "paid";

export const groups = pgTable("groups", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("🧾"),
  description: text("description"),
  currency: text("currency").notNull().default("ARS"),
  status: text("status").$type<GroupStatus>().notNull().default("active"),
  /** Pizarra/anotador del grupo (visible para todos). */
  notes: text("notes"),
  /** Foto de portada del grupo (data URL base64, opcional). */
  photo: text("photo"),
  createdAt: text("created_at").notNull(),
});

export const members = pgTable("members", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  aliasCbu: text("alias_cbu"),
  avatar: text("avatar"),
  active: boolean("active").notNull().default(true),
  /** Administrador del grupo (puede editar). Sin login: rol "blando". */
  isAdmin: boolean("is_admin").notNull().default(false),
  /**
   * Lugar "tomado": true cuando alguien ya entró como este miembro desde su
   * dispositivo. Se muestra en gris/bloqueado en "¿Quién sos?" para que dos
   * personas no ocupen el mismo miembro. Estado COMPARTIDO (servidor).
   */
  claimed: boolean("claimed").notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const expenses = pgTable("expenses", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  /** Monto total en CENTAVOS (entero). */
  amount: integer("amount").notNull(),
  concept: text("concept").notNull(),
  expenseDate: text("expense_date"),
  splitType: text("split_type").$type<SplitType>().notNull().default("equal"),
  category: text("category"),
  photoUrl: text("photo_url"),
  createdAt: text("created_at").notNull(),
});

export const expensePayers = pgTable("expense_payers", {
  id: text("id").primaryKey(),
  expenseId: text("expense_id")
    .notNull()
    .references(() => expenses.id, { onDelete: "cascade" }),
  memberId: text("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  /** Lo que puso este pagador, en CENTAVOS. La suma = expenses.amount. */
  amount: integer("amount").notNull(),
});

export const expenseShares = pgTable("expense_shares", {
  id: text("id").primaryKey(),
  expenseId: text("expense_id")
    .notNull()
    .references(() => expenses.id, { onDelete: "cascade" }),
  memberId: text("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  /** Peso para split por unidades/partes. */
  weight: real("weight"),
  /** Porcentaje (0-100) para split por porcentaje. */
  percent: real("percent"),
  /** Importe fijo en CENTAVOS para split custom. */
  fixedAmount: integer("fixed_amount"),
  /** Resultado final del reparto para este miembro, en CENTAVOS. */
  computedAmount: integer("computed_amount").notNull(),
});

export const notes = pgTable("notes", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  /** Autor (miembro). Nullable por si se cargó sin elegir quién sos. */
  memberId: text("member_id").references(() => members.id, {
    onDelete: "set null",
  }),
  text: text("text").notNull(),
  createdAt: text("created_at").notNull(),
});

export const settlements = pgTable("settlements", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  fromMemberId: text("from_member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  toMemberId: text("to_member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  /** Monto a transferir en CENTAVOS. */
  amount: integer("amount").notNull(),
  status: text("status").$type<SettlementStatus>().notNull().default("pending"),
  createdAt: text("created_at").notNull(),
});

// ---- Relaciones ----
export const groupsRelations = relations(groups, ({ many }) => ({
  members: many(members),
  expenses: many(expenses),
  settlements: many(settlements),
}));

export const membersRelations = relations(members, ({ one }) => ({
  group: one(groups, { fields: [members.groupId], references: [groups.id] }),
}));

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  group: one(groups, { fields: [expenses.groupId], references: [groups.id] }),
  payers: many(expensePayers),
  shares: many(expenseShares),
}));

export const expensePayersRelations = relations(expensePayers, ({ one }) => ({
  expense: one(expenses, {
    fields: [expensePayers.expenseId],
    references: [expenses.id],
  }),
  member: one(members, {
    fields: [expensePayers.memberId],
    references: [members.id],
  }),
}));

export const expenseSharesRelations = relations(expenseShares, ({ one }) => ({
  expense: one(expenses, {
    fields: [expenseShares.expenseId],
    references: [expenses.id],
  }),
  member: one(members, {
    fields: [expenseShares.memberId],
    references: [members.id],
  }),
}));

// ---- Tipos inferidos ----
export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type ExpensePayer = typeof expensePayers.$inferSelect;
export type ExpenseShare = typeof expenseShares.$inferSelect;
export type Settlement = typeof settlements.$inferSelect;
export type Note = typeof notes.$inferSelect;
