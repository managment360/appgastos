/**
 * Strings centralizadas (ES-AR por defecto). Punto único para i18n futuro.
 */
export const t = {
  appName: "Dividir Gastos",
  nav: {
    expenses: "Gastos",
    balances: "Balances",
    settle: "Liquidación",
    report: "Reporte",
  },
  common: {
    create: "Crear",
    join: "Unirse",
    save: "Guardar",
    cancel: "Cancelar",
    edit: "Editar",
    delete: "Eliminar",
    copy: "Copiar",
    copied: "¡Copiado!",
    share: "Compartir",
    members: "Miembros",
    total: "Total",
    you: "Vos",
  },
  home: {
    recent: "Grupos recientes",
    createGroup: "Crear grupo",
    joinWithCode: "Unirse con código",
    noRecent: "Todavía no abriste ningún grupo en este dispositivo.",
  },
} as const;

/** Categorías de gasto con su emoji. */
export const CATEGORIES = [
  { key: "comida", label: "Comida", icon: "🍽️" },
  { key: "carne", label: "Carne", icon: "🥩" },
  { key: "bebida", label: "Bebida", icon: "🥤" },
  { key: "super", label: "Super", icon: "🛒" },
  { key: "verdura", label: "Verdura", icon: "🥗" },
  { key: "pan", label: "Panadería", icon: "🥖" },
  { key: "transporte", label: "Transporte", icon: "🚗" },
  { key: "alojamiento", label: "Alojamiento", icon: "🏠" },
  { key: "entradas", label: "Entradas", icon: "🎟️" },
  { key: "otros", label: "Otros", icon: "🧾" },
] as const;

export function categoryIcon(key?: string | null): string {
  return CATEGORIES.find((c) => c.key === key)?.icon ?? "🧾";
}

/** Íconos disponibles para grupos. */
export const GROUP_ICONS = [
  "🧾", "🔥", "🍖", "🎉", "✈️", "🏖️", "🏠", "🎂", "⚽", "🍻", "🏔️", "🚗",
] as const;
