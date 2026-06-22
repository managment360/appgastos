/**
 * Grupos abiertos recientemente en ESTE dispositivo (localStorage).
 * Reemplaza al "login": el device recuerda a qué grupos entraste.
 */
"use client";

const KEY = "dg:recent-groups";

export type RecentGroup = {
  code: string;
  name: string;
  icon: string;
  openedAt: number;
};

export function getRecentGroups(): RecentGroup[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as RecentGroup[];
    return list.sort((a, b) => b.openedAt - a.openedAt);
  } catch {
    return [];
  }
}

export function rememberGroup(g: Omit<RecentGroup, "openedAt">): void {
  if (typeof window === "undefined") return;
  const list = getRecentGroups().filter((x) => x.code !== g.code);
  list.unshift({ ...g, openedAt: Date.now() });
  window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, 12)));
}

export function forgetGroup(code: string): void {
  if (typeof window === "undefined") return;
  const list = getRecentGroups().filter((x) => x.code !== code);
  window.localStorage.setItem(KEY, JSON.stringify(list));
}
