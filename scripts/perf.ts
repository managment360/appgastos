/* Medición de performance. Uso: tsx --env-file=.env.local scripts/perf.ts */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, inArray, sql, desc, asc } from "drizzle-orm";
import * as schema from "../src/db/schema";

const url = process.env.DATABASE_URL!;
const client = postgres(url, { prepare: false });
const db = drizzle(client, { schema });
const { groups, members, expenses, expensePayers, expenseShares, settlements, notes } = schema;
const CODE = process.env.PERF_CODE ?? "ASADO1";

async function time<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const t0 = performance.now();
  const r = await fn();
  console.log(`${label.padEnd(34)} ${(performance.now() - t0).toFixed(0)} ms`);
  return r;
}

async function main() {
  await time("ping (1 round-trip)", () => db.execute(sql`select 1`));

  const g = (
    await time("getGroupByCode", () =>
      db.select().from(groups).where(eq(groups.code, CODE)).limit(1)
    )
  )[0];
  if (!g) return console.log("no encontrado");
  const gid = g.id;

  console.log("\n--- Patrón ACTUAL (N+1) ---");
  await time("getGroupFull actual (total)", async () => {
    const [, exps] = await Promise.all([
      db.select().from(members).where(eq(members.groupId, gid)).orderBy(asc(members.createdAt)),
      db.select().from(expenses).where(eq(expenses.groupId, gid)).orderBy(desc(expenses.createdAt)),
      db.select().from(settlements).where(eq(settlements.groupId, gid)),
      db.select().from(notes).where(eq(notes.groupId, gid)),
    ]);
    // N+1: 2 consultas por gasto, secuenciales
    const detailed = await Promise.all(
      exps.map(async (e) => ({
        ...e,
        payers: await db.select().from(expensePayers).where(eq(expensePayers.expenseId, e.id)),
        shares: await db.select().from(expenseShares).where(eq(expenseShares.expenseId, e.id)),
      }))
    );
    return detailed.length;
  });

  console.log("\n--- Patrón OPTIMIZADO (consultas batcheadas) ---");
  await time("getGroupFull optimizado (total)", async () => {
    const [, exps, , ] = await Promise.all([
      db.select().from(members).where(eq(members.groupId, gid)).orderBy(asc(members.createdAt)),
      db.select().from(expenses).where(eq(expenses.groupId, gid)).orderBy(desc(expenses.createdAt)),
      db.select().from(settlements).where(eq(settlements.groupId, gid)),
      db.select().from(notes).where(eq(notes.groupId, gid)),
    ]);
    const ids = exps.map((e) => e.id);
    if (ids.length) {
      await Promise.all([
        db.select().from(expensePayers).where(inArray(expensePayers.expenseId, ids)),
        db.select().from(expenseShares).where(inArray(expenseShares.expenseId, ids)),
      ]);
    }
    return exps.length;
  });

  const exps = await db.select().from(expenses).where(eq(expenses.groupId, gid));
  console.log(`\nGastos: ${exps.length} (N+1 hace 1+${exps.length * 2} consultas; optimizado hace 3)`);
  await client.end();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
