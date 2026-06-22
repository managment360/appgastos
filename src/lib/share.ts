/**
 * Utilidades para compartir (link, código, WhatsApp).
 */

/** URL absoluta del grupo según el origin actual (cliente). */
export function groupUrl(code: string): string {
  if (typeof window === "undefined") return `/g/${code}`;
  return `${window.location.origin}/g/${code}`;
}

/** Link a WhatsApp con texto pre-cargado. */
export function whatsappLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** Copia texto al portapapeles. Devuelve true si pudo. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Mensaje de invitación para compartir un grupo. */
export function inviteMessage(groupName: string, code: string): string {
  return `Te invito a dividir los gastos de "${groupName}" 🧾\nEntrá con el código ${code}:\n${groupUrl(code)}`;
}
