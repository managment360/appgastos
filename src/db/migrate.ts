/**
 * Aplica las migraciones a Postgres (Supabase) usando la conexión DIRECTA.
 * Uso: `npm run db:migrate`  (carga variables desde .env.local)
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error("Falta DIRECT_URL (o DATABASE_URL) en el entorno.");
}

async function main() {
  // max:1 y sin prepared statements para correr migraciones de forma segura.
  const client = postgres(url!, { max: 1, prepare: false });
  const db = drizzle(client);
  console.log("Aplicando migraciones a Postgres…");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("✓ Migraciones aplicadas.");
  await client.end();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
