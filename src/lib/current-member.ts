/**
 * "¿Quién sos?" por grupo, guardado en este dispositivo (localStorage).
 * Permite el encuadre personal (verde = te deben / rojo = debés) sin login.
 */
"use client";

const KEY = "dg:me";

type MeMap = Record<string, string>; // code -> memberId

function read(): MeMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as MeMap;
  } catch {
    return {};
  }
}

export function getCurrentMember(code: string): string | null {
  return read()[code] ?? null;
}

export function setCurrentMember(code: string, memberId: string): void {
  if (typeof window === "undefined") return;
  const map = read();
  map[code] = memberId;
  window.localStorage.setItem(KEY, JSON.stringify(map));
}
