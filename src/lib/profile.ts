/**
 * Identidad GLOBAL del dispositivo (no por grupo). Es el "quién sos" de la app:
 * se pide al entrar por primera vez y se reusa para crearte como miembro admin
 * cuando armás un grupo. Guardado en localStorage (sin login).
 *
 * Ojo: distinto de current-member.ts, que es la identidad POR grupo
 * (code -> memberId). El perfil es el default para armar esa identidad.
 */
"use client";

import { useEffect, useState } from "react";

const KEY = "dg:profile";
const EVENT = "dg:profile-changed";

export type Profile = {
  name: string;
  aliasCbu?: string;
  phone?: string;
  email?: string;
};

export function getProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Profile;
    return p.name?.trim() ? p : null;
  } catch {
    return null;
  }
}

export function setProfile(p: Profile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new CustomEvent(EVENT));
}

/** Hook reactivo: perfil actual (o null) que se actualiza al cambiar. */
export function useProfile(): Profile | null {
  const [profile, setProfileState] = useState<Profile | null>(null);
  useEffect(() => {
    const update = () => setProfileState(getProfile());
    update();
    window.addEventListener(EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return profile;
}
