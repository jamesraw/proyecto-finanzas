# Casa & Caja

Tracker de finanzas para una pareja (Chino y Rosario) que vive junta y comparte gastos de
la casa. Pensado para cargar gastos en segundos desde el celular, en pesos (ARS), dólares
(USD) o reales (BRL), y ver cuánto queda en la "caja compartida" y cuánto está ahorrando
cada uno.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui (sobre [Base UI](https://base-ui.com), no Radix)
- Prisma ORM 5 + PostgreSQL (Neon / Vercel Postgres)
- Server Actions para todas las mutaciones (sin API REST separada)
- Auth mínima: PIN compartido + selector de persona (ver abajo)

> **Nota sobre versiones**: este proyecto usa Next.js 16, una versión muy reciente cuyas
> convenciones difieren de las de Next 13/14 (por ejemplo, `middleware.ts` está deprecado
> a favor de `proxy.ts`). Next genera automáticamente `AGENTS.md`/`CLAUDE.md` en la raíz
> con notas sobre esos cambios — no los borres, son una ayuda para agentes de IA que
> trabajen en este repo. Lo mismo pasa con shadcn/ui: la versión instalada usa `@base-ui/react`
> en vez de `@radix-ui/*`, así que las props de algunos primitivos difieren (por ejemplo,
> `ToggleGroup` recibe `value`/`onValueChange` como array de strings, y los triggers usan
> `render={<Componente />}` en vez de `asChild`).

## Modelo de auth (deliberadamente simple)

Esto **no** es un sistema de autenticación por usuario. Es una app privada para 2 personas:

1. Un PIN compartido (`APP_PIN`) desbloquea toda la app desde `/login`. Al acertarlo se
   graba una cookie httpOnly firmada con HMAC-SHA256 (`SESSION_SECRET`), válida 180 días.
2. `src/proxy.ts` (el equivalente a middleware en Next 16) protege todas las rutas excepto
   `/login`, verificando la firma de esa cookie.
3. Una vez adentro, cada quien elige "Soy Chino" / "Soy Rosario" desde el header. Esto
   guarda una cookie simple (no firmada, no es información sensible) que se usa para
   pre-completar el campo "persona" al cargar gastos/ingresos. Se puede cambiar en
   cualquier momento, no hay contraseñas individuales.

No hay recuperación de contraseña, ni roles, ni invitaciones — si se pierde el PIN, se
cambia la variable de entorno `APP_PIN` en Vercel y listo.

## Variables de entorno

Copiá `.env.example` a `.env` y completá:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Connection string de Postgres (Neon, Vercel Postgres, o cualquier Postgres). |
| `APP_PIN` | El PIN compartido para entrar a la app. |
| `SESSION_SECRET` | Secreto random para firmar la cookie de sesión. Generalo con `openssl rand -hex 32`. |

## Puesta en marcha local

```bash
npm install                 # también corre `prisma generate` (postinstall)
cp .env.example .env        # completá DATABASE_URL, APP_PIN, SESSION_SECRET
npm run db:migrate          # crea las tablas (prisma migrate dev)
npm run db:seed             # carga personas, categorías y cotizaciones por defecto
npm run dev                 # http://localhost:3000
```

Necesitás una base Postgres accesible en `DATABASE_URL` para `db:migrate` y para que la
app funcione en runtime (todas las páginas leen datos vía Prisma). Opciones rápidas:

- **Neon** (recomendado, tiene free tier): creá un proyecto en [neon.tech](https://neon.tech),
  copiá el connection string (con `?sslmode=require`) a `DATABASE_URL`.
- **Postgres local**: `brew install postgresql@16 && brew services start postgresql@16`,
  después `createdb thimphu` y usá `postgresql://localhost:5432/thimphu`.
- **Docker**: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16`.

### Cotizaciones y categorías

El seed (`prisma/seed.ts`) carga:

- Personas: Chino y Rosario (con colores para tags en la UI).
- Categorías de gasto: Alquiler, Supermercado, Servicios, Salidas, Transporte, Salud,
  Ahorro, Otros.
- Categorías de ingreso: Sueldo, Freelance, Otro.
- Cotizaciones **placeholder** (1 USD = 1000 ARS, 1 BRL = 180 ARS) — hay que
  actualizarlas a mano desde **Ajustes** apenas se usa la app, y de ahí en adelante cada
  vez que cambien. No hay integración con ninguna API de cotizaciones.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | ESLint |
| `npm run db:migrate` | `prisma migrate dev` (crea/actualiza tablas en desarrollo) |
| `npm run db:deploy` | `prisma migrate deploy` (aplica migraciones en producción) |
| `npm run db:seed` | Corre `prisma/seed.ts` |
| `npm run db:studio` | Abre Prisma Studio |

## Modelo de datos (resumen)

- **Person**: Chino / Rosario, con color para la UI.
- **Category**: categorías de gasto o ingreso, con emoji + color.
- **Account** ("cajas"): etiquetas de cuentas/efectivo (ej. "Efectivo Chino", "Caja
  compartida casa"). Es una tabla de referencia liviana, pensada para futuras vistas por
  cuenta; hoy los cálculos del dashboard no dependen de ella.
- **ExchangeRate**: cotización manual de USD/BRL a ARS (ARS es la moneda base).
- **Transaction**: gasto personal o compartido. Los compartidos guardan `splitType`
  (`equal` / `custom` / `byIncome`) y las fracciones `payerShare`/`otherShare` que le
  corresponden a quien pagó y a la otra persona respectivamente.
- **Income**: ingresos por persona, con fuente, moneda y flag de recurrencia.
- **RecurringTransaction**: plantillas de gastos/ingresos fijos (alquiler, servicios) con
  día del mes. El botón "Generar fijos del mes" en `/recurring` crea transacciones
  **draft** (con el monto estimado) que hay que confirmar/editar — pensado para servicios
  que varían de monto mes a mes.

## Cómo se calcula el dashboard

Ver `src/lib/dashboard.ts`. Para cada persona se suma:

- Gasto personal del mes (convertido a ARS con la cotización manual vigente).
- Su parte proporcional de los gastos compartidos del mes (según `payerShare`/`otherShare`
  de cada transacción compartida).
- Ingresos del mes (convertidos a ARS).
- Ahorro neto = ingresos − gasto personal − parte de gastos compartidos.

El "settle-up" (quién le debe a quién) se calcula neteando, para cada gasto compartido,
cuánto le debe la persona que no pagó a la que pagó, y compensando las deudas cruzadas
entre ambos.

## Deploy a Vercel + Neon

1. Creá una base en [Neon](https://neon.tech) (o Vercel Postgres desde el dashboard de
   Vercel). Copiá el connection string.
2. Importá el repo en Vercel.
3. En **Settings → Environment Variables** del proyecto en Vercel, cargá `DATABASE_URL`,
   `APP_PIN` y `SESSION_SECRET` (generá este último con `openssl rand -hex 32`).
4. Antes del primer deploy (o desde tu máquina apuntando a la base de producción), corré:
   ```bash
   DATABASE_URL="<tu-connection-string>" npx prisma migrate deploy
   DATABASE_URL="<tu-connection-string>" npx prisma db seed
   ```
5. Deploy. Vercel corre `npm install` (que dispara `prisma generate` vía `postinstall`) y
   `npm run build` automáticamente.

Para migraciones futuras: corré `npm run db:migrate` en local (contra una base de
desarrollo) para generar el archivo de migración, commiteá `prisma/migrations/`, y en
producción aplicalo con `npm run db:deploy` (o dejá que corra en tu pipeline de deploy).

## Qué se probó y qué falta probar en runtime

Este proyecto se armó sin acceso a un Postgres real (no había `psql`/Docker disponibles en
el entorno de build). Se verificó:

- `npx prisma validate` — schema válido.
- `npx prisma generate` — cliente generado sin errores.
- `npx tsc --noEmit` — sin errores de tipos.
- `npm run lint` — sin errores.
- `npm run build` — build de producción completo y exitoso.
- `npm run dev` + `curl` — `/login` renderiza, y las rutas protegidas redirigen
  correctamente a `/login` cuando no hay sesión (vía `src/proxy.ts`).

Lo que **no** se pudo probar sin una base de datos real (queda para hacerlo apenas se
conecte una):

- `npx prisma migrate dev` (crear las tablas de verdad).
- `npm run db:seed` contra una base real.
- El flujo completo de login vía Server Action (los Server Actions usan un formato de
  request especial que no es trivial de simular con `curl`; hace falta un navegador).
- Los flujos de alta de gasto/ingreso, generación de fijos, edición de cotizaciones, etc.
  de punta a punta.

Recomendación: conectar una base Neon gratuita, correr `db:migrate` + `db:seed`, y probar
manualmente el flujo de carga de gastos desde el celular (es la pantalla más importante).
