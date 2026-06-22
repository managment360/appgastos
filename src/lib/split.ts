/**
 * División de gastos — FUNCIONES PURAS (sin UI, sin DB). Testeadas.
 * Todo en centavos (enteros). El resultado SUMA EXACTAMENTE el total.
 */
import type { SplitType } from "@/db/schema";
import { distributeCents } from "./money";

export type ShareInput = {
  memberId: string;
  /** Peso para split por unidades/partes. */
  weight?: number | null;
  /** Porcentaje 0-100 para split por porcentaje. */
  percent?: number | null;
  /** Importe fijo en centavos para split custom. */
  fixedAmount?: number | null;
};

export type ComputedShare = {
  memberId: string;
  computedAmount: number; // centavos
};

/**
 * Calcula cuánto le corresponde pagar a cada participante.
 * `participants` ya viene filtrado (solo quienes participan del gasto).
 */
export function computeShares(
  totalCents: number,
  splitType: SplitType,
  participants: ShareInput[]
): ComputedShare[] {
  if (participants.length === 0) return [];

  switch (splitType) {
    case "equal": {
      const cents = distributeCents(
        totalCents,
        participants.map(() => 1)
      );
      return participants.map((p, i) => ({
        memberId: p.memberId,
        computedAmount: cents[i],
      }));
    }

    case "units": {
      const weights = participants.map((p) => Math.max(0, p.weight ?? 0));
      const cents = distributeCents(totalCents, weights);
      return participants.map((p, i) => ({
        memberId: p.memberId,
        computedAmount: cents[i],
      }));
    }

    case "percent": {
      const weights = participants.map((p) => Math.max(0, p.percent ?? 0));
      const cents = distributeCents(totalCents, weights);
      return participants.map((p, i) => ({
        memberId: p.memberId,
        computedAmount: cents[i],
      }));
    }

    case "custom_amount": {
      // Importes fijos en centavos. Se respetan tal cual.
      return participants.map((p) => ({
        memberId: p.memberId,
        computedAmount: Math.max(0, p.fixedAmount ?? 0),
      }));
    }
  }
}

// ---- Validaciones para la UI (no lanzan, devuelven estado) ----

export function validateSplit(
  totalCents: number,
  splitType: SplitType,
  participants: ShareInput[]
): { ok: boolean; message?: string } {
  if (participants.length === 0)
    return { ok: false, message: "Elegí al menos un participante." };

  if (splitType === "custom_amount") {
    const sum = participants.reduce((a, p) => a + (p.fixedAmount ?? 0), 0);
    if (sum !== totalCents)
      return {
        ok: false,
        message: "La suma de importes debe ser igual al total.",
      };
  }

  if (splitType === "percent") {
    const sum = participants.reduce((a, p) => a + (p.percent ?? 0), 0);
    if (Math.abs(sum - 100) > 0.01)
      return { ok: false, message: "Los porcentajes deben sumar 100%." };
  }

  if (splitType === "units") {
    const sum = participants.reduce((a, p) => a + (p.weight ?? 0), 0);
    if (sum <= 0)
      return { ok: false, message: "Asigná al menos una parte." };
  }

  return { ok: true };
}
