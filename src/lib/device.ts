/**
 * Identidad del DISPOSITIVO (no de la persona): un token estable por navegador,
 * guardado en localStorage. Sirve para saber qué dispositivo ocupa un lugar y
 * poder "entrar desde otro dispositivo" expulsando al anterior.
 */
"use client";

const KEY = "dg:device";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    window.localStorage.setItem(KEY, id);
  }
  return id;
}
