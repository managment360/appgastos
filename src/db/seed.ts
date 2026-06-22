/**
 * Seed del grupo demo "Asado Mariano".
 * Uso: `npm run db:seed`  (borra y recrea el grupo demo, idempotente).
 *
 * Gastos:
 *  - Carne   $120.000  pagó Mariano  (entre todos, 8)
 *  - Tarta   $10.500   pagó Matías   (entre todos, 8)
 *  - Verdura $17.000   pagó Mariano  (entre todos, 8)
 *  - Pan     $3.000    pagó Matías   (entre todos, 8)
 *  - Gaseosa $14.000   pagó Matías   (solo entre algunos)
 */
import { eq } from "drizzle-orm";
import { db } from "./index";
import {
  groups,
  members,
  expenses,
  expensePayers,
  expenseShares,
} from "./schema";
import { newId } from "../lib/ids";
import { computeShares } from "../lib/split";

const DEMO_CODE = "ASADO1";
const NOW = "2026-06-20T18:00:00.000Z";

const MEMBER_NAMES = [
  "Flaco",
  "Gordo",
  "Horacio",
  "Jesús",
  "José",
  "Lugones",
  "Mariano",
  "Matías",
];

async function main() {
  // Limpieza idempotente del grupo demo (cascade borra hijos).
  const [existing] = await db
    .select()
    .from(groups)
    .where(eq(groups.code, DEMO_CODE))
    .limit(1);
  if (existing) {
    await db.delete(groups).where(eq(groups.id, existing.id));
    console.log("• Grupo demo previo eliminado.");
  }

  const groupId = newId();
  await db.insert(groups).values({
    id: groupId,
    code: DEMO_CODE,
    name: "Asado Mariano",
    icon: "🔥",
    description: "Asado del finde",
    currency: "ARS",
    status: "active",
    createdAt: NOW,
  });

  // Miembros
  const memberIds: Record<string, string> = {};
  for (const name of MEMBER_NAMES) {
    const id = newId();
    memberIds[name] = id;
    await db.insert(members).values({
      id,
      groupId,
      name,
      aliasCbu: `${name.toLowerCase()}.mp`,
      active: true,
      createdAt: NOW,
    });
  }

  const allIds = MEMBER_NAMES.map((n) => memberIds[n]);

  // (concepto, centavos, pagador, participantes, categoría)
  const data: Array<{
    concept: string;
    cents: number;
    payer: string;
    participants: string[];
    category: string;
  }> = [
    { concept: "Carne", cents: 12_000_000, payer: "Mariano", participants: allIds, category: "carne" },
    { concept: "Tarta", cents: 1_050_000, payer: "Matías", participants: allIds, category: "comida" },
    { concept: "Verdura", cents: 1_700_000, payer: "Mariano", participants: allIds, category: "verdura" },
    { concept: "Pan", cents: 300_000, payer: "Matías", participants: allIds, category: "pan" },
    {
      concept: "Gaseosa",
      cents: 1_400_000,
      payer: "Matías",
      // Solo algunos toman gaseosa: Flaco, Gordo, Matías, Mariano.
      participants: [
        memberIds["Flaco"],
        memberIds["Gordo"],
        memberIds["Matías"],
        memberIds["Mariano"],
      ],
      category: "bebida",
    },
  ];

  for (const d of data) {
    const expenseId = newId();
    await db.insert(expenses).values({
      id: expenseId,
      groupId,
      amount: d.cents,
      concept: d.concept,
      expenseDate: NOW.slice(0, 10),
      splitType: "equal",
      category: d.category,
      createdAt: NOW,
    });

    // Pagador único
    await db.insert(expensePayers).values({
      id: newId(),
      expenseId,
      memberId: memberIds[d.payer],
      amount: d.cents,
    });

    // Reparto igualitario entre participantes
    const shares = computeShares(
      d.cents,
      "equal",
      d.participants.map((memberId) => ({ memberId }))
    );
    for (const s of shares) {
      await db.insert(expenseShares).values({
        id: newId(),
        expenseId,
        memberId: s.memberId,
        computedAmount: s.computedAmount,
      });
    }
  }

  console.log(`✓ Seed listo. Grupo demo "Asado Mariano" -> código ${DEMO_CODE}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
