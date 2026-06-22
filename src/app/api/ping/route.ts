/**
 * Ping para mantener viva la base de Supabase (plan free se pausa tras ~7 días
 * de inactividad). Lo llama un cron de Vercel a diario (ver vercel.json).
 */
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, ts: new Date().toISOString() });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
