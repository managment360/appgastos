/**
 * "¿Quién sos?" por grupo, guardado en este dispositivo (localStorage).
 * Reemplaza al login: el device recuerda con qué miembro entraste y, según
 * su rol, puede editar o solo ver.
 */
"use client";

import { useEffect, useState } from "react";
import type { Member } from "@/db/schema";

const KEY = "dg:me";
const EVENT = "dg:me-changed";

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
  window.dispatchEvent(new CustomEvent(EVENT));
}

/** Hook reactivo: devuelve el memberId actual (o null) y se actualiza al cambiar. */
export function useCurrentMember(code: string): string | null {
  const [me, setMe] = useState<string | null>(null);
  useEffect(() => {
    const update = () => setMe(getCurrentMember(code));
    update();
    window.addEventListener(EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, [code]);
  return me;
}

/**
 * ¿Puede editar (cargar/editar gastos, liquidar, gestionar miembros)?
 * Solo el/los admin. Los integrantes ven pero no cargan.
 *  - Grupos viejos sin ningún admin -> todos pueden (no quedan trabados).
 *  - Grupos nuevos -> solo si "quién sos" es admin.
 */
export function useCanEdit(code: string, members: Member[]): boolean {
  const me = useCurrentMember(code);
  const [can, setCan] = useState(true);
  useEffect(() => {
    const admins = members.filter((m) => m.isAdmin);
    if (admins.length === 0) {
      setCan(true);
      return;
    }
    const meMember = members.find((m) => m.id === me);
    setCan(!!meMember?.isAdmin);
  }, [me, members]);
  return can;
}
