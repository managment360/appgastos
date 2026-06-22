# Dividir Gastos 🧾

App **mobile-first** para dividir gastos de grupos (viajes, asados, cumpleaños,
eventos). Inspirada en Splitwise y Splid. **Sin login**: cada grupo se comparte
por un código/link único.

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS** + **shadcn/ui** (base-ui)
- **PostgreSQL** (Supabase) con **Drizzle ORM** (driver `postgres`/postgres-js)
- Lógica de cálculo (división + liquidación) en **funciones puras testeadas**
- Export del reporte a **PDF / imagen** y resumen para **WhatsApp**

---

## Correr en local

Requisitos: **Node 20+** y una base **Postgres** (lo más simple: un proyecto
gratis en [Supabase](https://supabase.com)).

```bash
npm install
cp .env.example .env.local      # completá DATABASE_URL y DIRECT_URL
npm run db:migrate              # crea las tablas
npm run db:seed                 # carga el grupo demo "Asado Mariano" (código ASADO1)
npm run dev                     # http://localhost:3000
```

### Variables de entorno (`.env.local`)

| Variable | Qué es | Dónde |
|---|---|---|
| `DATABASE_URL` | **Transaction pooler** (puerto 6543). La usa la app. | Supabase → Settings → Database → Connection string |
| `DIRECT_URL` | **Session pooler** (puerto 5432). La usan las migraciones. | idem |

> El pooler de transacción no admite *prepared statements*; por eso el driver
> usa `prepare: false` (ver [`src/db/index.ts`](src/db/index.ts)).

### Scripts

| Script | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run db:generate` | Genera SQL de migración desde el schema |
| `npm run db:migrate` | Aplica migraciones a la base |
| `npm run db:seed` | Carga el grupo demo |
| `npm run db:studio` | Drizzle Studio (explorar la base) |
| `npm test` | Tests de las funciones de cálculo |
| `npm run build` | Build de producción |

---

## Estructura

```
src/
├─ app/
│  ├─ page.tsx              # Entrada: grupos recientes + crear/unirse
│  ├─ g/[code]/             # Grupo (gastos, saldos, saldar, reporte, miembros)
│  ├─ actions/              # Server actions (groups, members, expenses, settlements)
│  └─ api/ping/             # Keep-alive de Supabase (cron de Vercel)
├─ db/
│  ├─ index.ts              # ⭐ ÚNICO módulo de conexión a la base
│  ├─ schema.ts             # Schema Drizzle (Postgres)
│  ├─ queries.ts            # Lecturas
│  ├─ migrate.ts            # Runner de migraciones
│  └─ seed.ts               # Grupo demo "Asado Mariano"
├─ lib/                     # money, split, settle, balances, report (PUROS + testeados)
└─ components/              # UI (sheets, cards, nav, reporte, export)
```

La conexión a la base está **aislada en [`src/db/index.ts`](src/db/index.ts)**:
cambiar de proveedor de Postgres es tocar solo ese archivo + las variables de entorno.

---

## Deploy en producción (Supabase + Vercel)

1. **Supabase**: creá un proyecto, copiá las dos connection strings (transaction
   6543 y session 5432) a las *Environment Variables* de Vercel como
   `DATABASE_URL` y `DIRECT_URL`.
2. **Migraciones**: corré `npm run db:migrate` (y `npm run db:seed` si querés el demo)
   apuntando a la base de producción.
3. **Vercel**: importá el repo de GitHub. Next.js se detecta solo.
4. El **cron** de [`vercel.json`](vercel.json) llama a `/api/ping` a diario para
   que la base free de Supabase no se pause por inactividad.

### Pendiente para más adelante (no implementado)
- **Login** (Google/email) y roles: la estructura sin-cuenta está lista para sumarlo.
- Conversión de monedas (el modelo ya soporta varias monedas).
