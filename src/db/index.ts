/**
 * ⭐ ÚNICO módulo de conexión a la base de datos (PostgreSQL / Supabase).
 *
 * Usa el driver `postgres` (postgres-js) sobre el connection pooler de Supabase.
 * En runtime (Vercel) conviene el "Transaction pooler" (puerto 6543) con
 * prepare:false. Las migraciones usan DIRECT_URL (ver migrate.ts / drizzle.config).
 *
 * Variables de entorno:
 *   DATABASE_URL  -> pooler de transacción (6543) para la app
 *   DIRECT_URL    -> pooler de sesión (5432) para migraciones
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "Falta DATABASE_URL. Configurá el .env.local (local) o las Environment Variables (Vercel)."
  );
}

// Singleton: evita reabrir conexiones en el hot-reload de Next dev.
const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.pgClient ??
  postgres(connectionString, {
    // Requerido por el pooler de transacción (pgbouncer) de Supabase.
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
export { schema };
