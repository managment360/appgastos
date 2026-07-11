/**
 * Ping para mantener viva la base de Supabase (el plan free se pausa tras ~7 días
 * de inactividad). Lo llama:
 *   - el cron de Vercel a diario (ver vercel.json), y
 *   - opcionalmente un pinger externo (UptimeRobot / cron-job.org) cada pocas
 *     horas, más confiable que el cron free de Vercel.
 *
 * Seguridad (opcional): si está seteada la env var CRON_SECRET, el endpoint exige
 * el token. Vercel lo manda solo en el cron interno como "Authorization: Bearer
 * <CRON_SECRET>"; el pinger externo lo pasa como header o como ?token=<secret>.
 * Si NO hay CRON_SECRET, el endpoint queda abierto (un simple SELECT 1, sin riesgo).
 */
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // sin secret configurado -> abierto (keep-alive)

  // 1) Header Bearer (cron de Vercel + pingers que soportan headers).
  if (request.headers.get("authorization") === `Bearer ${secret}`) return true;

  // 2) Query param ?token= (pingers simples que no mandan headers).
  const token = new URL(request.url).searchParams.get("token");
  return token === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, ts: new Date().toISOString() });
  } catch (err) {
    console.error("ping falló:", err);
    return Response.json({ ok: false }, { status: 500 });
  }
}
