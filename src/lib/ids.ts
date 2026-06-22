import { randomUUID } from "node:crypto";

/** ID único para registros (portable: lo genera la app, no la DB). */
export function newId(): string {
  return randomUUID();
}

// Sin caracteres ambiguos (0/O, 1/I/L).
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Código de grupo legible, ej. "AB12CD" (default 6 chars). */
export function newGroupCode(length = 6): string {
  let out = "";
  const bytes = randomUUID().replace(/-/g, "");
  for (let i = 0; i < length; i++) {
    const n = parseInt(bytes[i * 2] + bytes[i * 2 + 1], 16);
    out += CODE_ALPHABET[n % CODE_ALPHABET.length];
  }
  return out;
}

/** Normaliza un código ingresado por el usuario (mayúsculas, sin espacios). */
export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}
