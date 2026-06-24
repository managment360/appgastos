"use client";

/** Tamaño de letra global (accesibilidad). Persiste en el dispositivo. */
export type TextSize = "normal" | "grande" | "xl";

const KEY = "dg:textsize";
const EVENT = "dg:textsize-changed";

const PX: Record<TextSize, string> = {
  normal: "17px",
  grande: "19px",
  xl: "22px",
};

export function getTextSize(): TextSize {
  if (typeof window === "undefined") return "normal";
  const v = window.localStorage.getItem(KEY);
  return v === "grande" || v === "xl" ? v : "normal";
}

export function applyTextSize(s: TextSize): void {
  if (typeof document === "undefined") return;
  document.documentElement.style.fontSize = PX[s];
}

export function setTextSize(s: TextSize): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, s);
  applyTextSize(s);
  window.dispatchEvent(new CustomEvent(EVENT));
}

export const TEXT_SIZE_EVENT = EVENT;
