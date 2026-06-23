import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { FocusEvent } from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Centra el input enfocado dentro del sheet (evita scrollear a mano en mobile). */
export function scrollIntoCenter(e: FocusEvent<HTMLElement>) {
  const el = e.currentTarget
  setTimeout(() => {
    el.scrollIntoView({ behavior: "smooth", block: "center" })
  }, 250)
}
