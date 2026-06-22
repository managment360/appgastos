import { defineConfig } from "drizzle-kit";

// Las migraciones se corren contra la conexión DIRECTA (session pooler, 5432),
// no contra el pooler de transacción.
// `db:generate` solo lee el schema (no conecta), por eso permitimos un
// placeholder; `push`/`studio` sí necesitan la URL real del entorno.
const url =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  "postgresql://placeholder";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});
