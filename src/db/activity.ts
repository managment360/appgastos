/**
 * Registro de actividad del grupo (logs para la campana). Server-only.
 * logActivity nunca lanza: un fallo de log no debe romper la acción principal.
 */
import "server-only";
import { db } from "./index";
import { activity, type ActivityType } from "./schema";
import { newId } from "@/lib/ids";

export async function logActivity(
  groupId: string,
  type: ActivityType,
  actorName: string | null,
  message: string
): Promise<void> {
  try {
    await db.insert(activity).values({
      id: newId(),
      groupId,
      type,
      actorName: actorName?.trim() || null,
      message,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("logActivity falló:", err);
  }
}
