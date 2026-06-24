import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { FocusEvent } from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Acerca el input enfocado si quedó tapado, sin saltos bruscos (mobile). */
export function scrollIntoCenter(e: FocusEvent<HTMLElement>) {
  const el = e.currentTarget
  setTimeout(() => {
    el.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, 300)
}
