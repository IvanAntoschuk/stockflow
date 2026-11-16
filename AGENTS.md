# AGENTS.md — StockFlow handoff

Operational instructions for future coding sessions. Read this file first, then `README.md`.
If these notes conflict with a direct user instruction, the user wins.

Last updated: 2026-11-16 (end of Phase 2 implementation; verification and merge pending).

## 1. How to resume tomorrow

1. Read this file and `README.md`.
2. Inspect git state before changing anything:
   ```powershell
   git status -sb
   git log --oneline --decorate -8
   git branch -vv
   git fetch origin
   ```
3. Check infrastructure:
   ```powershell
   docker compose ps
   Test-Path -LiteralPath "server\.env"
   ```
   The database container is `stockflow-db` (PostgreSQL 16) on `localhost:5434`.
   If it is not running: `npm run db:up`.
4. Resume the active phase branch. Phase 2 work lives on `feature/phase-2-catalog`:
   ```powershell
   git switch feature/phase-2-catalog
   git pull --ff-only
   ```
   After Phase 2 is approved and merged, start Phase 3 from an updated `main`:
   ```powershell
   git switch main
   git pull --ff-only
   git switch feature/phase-3-inventory
   ```
5. Check GitHub CLI auth before relying on PR commands:
   ```powershell
   gh auth status
   ```
   Last check: token for `vanya12312e` was invalid. SSH push works as `IvanAntoschuk`.
   If `gh` is still unauthenticated, ask the user to run `gh auth login -h github.com`.
6. Briefly report the plan, implement, commit, push, and open a PR. The user often runs verification
   personally; do not block on long checks unless asked. **Pause for approval** before merging.
   The user wants one phase at a time.

## 2. Status snapshot

- Phase 1 (foundation + authentication) is **complete, verified, and pushed**.
- Phase 2 (catalog schema, seed, CRUD APIs, and UI pages) is **implemented** on
  `feature/phase-2-catalog`. User verification and the PR merge are pending.
- `main` is at `d2f0d07` (`docs: add agent handoff notes`).
- Remote: `git@github.com:IvanAntoschuk/stockflow.git` (SSH).
- `main` and the four phase branches started from `d2f0d07`. `feature/phase-2-catalog` carries the
  Phase 2 commits:
  - `feature/phase-2-catalog` (active)
  - `feature/phase-3-inventory`
  - `feature/phase-4-dashboard`
  - `feature/phase-5-polish`
- Database migrations: `20261116160905_init_auth` is applied; `20261116172753_add_catalog` is part
  of the Phase 2 branch. Run `npm run db:migrate` after pulling Phase 2.
- Seed upserts one ADMIN user (`admin@stockflow.dev` / `Admin123!`, Olivia Bennett), five
  categories, five suppliers, two warehouses, twelve products, and inventory rows across both
  warehouses with some intentionally low-stock items.
- `.env` exists locally and is ignored; never commit it.
- Docker container is healthy; local PostgreSQL 17 already uses 5432, so the project uses 5434.
- `gh` token is invalid; SSH push works. Git identity: `Ivan Antoschuk <antoschukivan2010@gmail.com>`.
- No automated test files exist yet (`vitest run --passWithNoTests`).

## 3. Stack and environment

- Windows, PowerShell 5.1. Use `workdir` instead of `cd` in tool calls.
- Node `v24.16.0`, npm `11.13.0`; engines require Node >= 20.19.
- npm workspaces: `server/` and `client/`; dependencies are hoisted.
- API: Express 5 + TypeScript ESM + Prisma 6.19.3 + PostgreSQL + Zod 4 + JWT + bcrypt.
- Web: React 19 + Vite 7 + Ant Design 6 + Tailwind CSS v4 (preflight disabled) + Redux Toolkit +
  React Router 7 + Axios + RHF 7 + Zod 4 + Recharts + dayjs.
- Ports: API `4000`, Vite `5173`, PostgreSQL `5434`.
- Dev proxy: `/api` -> `http://localhost:4000` (see `client/vite.config.ts`).
- UI language is English; currency defaults to USD. Theme primary is emerald `#059669`,
  layout background `#f5f6f7`, 8px radius, Inter font.

## 4. Commands

Run from `C:\www\Stockflow` unless noted.

```powershell
npm run dev          # API + web together
npm run dev:server   # API only
npm run dev:client   # web only
npm run build        # build both workspaces
npm run typecheck    # both workspaces
npm run lint         # both workspaces
npm test             # server Vitest (currently no test files)
npm run db:up        # docker compose up -d
npm run db:down      # docker compose down
npm run db:migrate   # prisma migrate dev
npm run db:seed      # prisma db seed
npm run db:studio    # Prisma Studio
npm run format       # Prettier
```

Create a migration with a name (run in `server/`):

```powershell
npx prisma migrate dev --name add_catalog
```

API smoke test (PowerShell):

```powershell
Invoke-RestMethod http://localhost:4000/api/health
$body = @{ email = 'admin@stockflow.dev'; password = 'Admin123!' } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/auth/login `
  -ContentType 'application/json' -Body $body
Invoke-RestMethod http://localhost:4000/api/auth/me `
  -Headers @{ Authorization = "Bearer $($login.data.token)" }
```

Expected API envelope:

```json
{ "success": true, "data": {}, "meta": { "page": 1, "pageSize": 10, "total": 0, "totalPages": 0 } }
```

Errors always use:

```json
{ "success": false, "error": { "code": "STRING_CODE", "message": "Human readable", "details": [] } }
```

## 5. Architecture map

```text
client/src/
  api/                 Axios instance and per-resource request functions
  app/                 Redux store and typed hooks
  components/          Shared UI, layout, guards, PageHeader, FormField
  features/auth/       Auth slice and thunks
  lib/                 Labels and Zod validation schemas
  pages/               Route pages (placeholders for Phase 2 modules)
  router.tsx           All routes
  theme.ts             Ant Design tokens
  index.css            Tailwind v4 layers; preflight intentionally omitted

server/src/
  app.ts               Express wiring, middleware, routes, health
  config/env.ts        Zod-validated environment
  lib/prisma.ts        Prisma singleton
  middleware/          Central error handler and 404
  modules/auth/        routes -> controller -> service, Zod schemas, JWT middleware
  types/express.d.ts   `req.user` declaration merging
  utils/               AppError and response envelope

server/prisma/
  schema.prisma        Only Role + User today
  migrations/          Applied migrations
  seed.ts              Idempotent admin upsert
```

Backend pattern to follow:

- `routes.ts` declares endpoints and applies middleware.
- `controller.ts` parses input with Zod and calls the service.
- `service.ts` owns Prisma queries and throws `AppError`.
- Keep response formatting in `sendSuccess`; do not hand-roll envelopes.
- Express 5 forwards rejected async handlers; still call `next(error)` in middleware.
- Server is ESM: **relative imports must end in `.js`**, even in TypeScript files.
- Add new routers in `server/src/app.ts` under `/api`.
- Protect non-public routes with `authenticate` from `modules/auth/auth.middleware.ts`.

Frontend pattern to follow:

- Use the shared `api` Axios instance from `client/src/api/client.ts`; it injects the Bearer token
  and handles 401 session expiry. Token key: `stockflow.token`.
- Type API responses with `ApiSuccess<T>` / `ApiErrorResponse` from `client/src/types/api.ts`.
- Use `getApiErrorMessage(error)` for user-facing errors.
- Forms use React Hook Form + `zodResolver` + the `FormField` wrapper (existing auth pages).
- Use `App.useApp()` for `message`/`modal`; avoid antd static methods.
- Use `PageHeader` on every page. Use antd `Table`, `Drawer`/`Modal`, `Popconfirm`, `Descriptions`.
- Alias `@/` maps to `client/src`.
- Do not re-enable Tailwind preflight; it conflicts with antd.
- Do not introduce another UI library, data-fetching library, or state library without approval.
  Redux currently holds auth only; local `useState`/`useEffect` is fine for page data.

## 6. Locked product and security decisions

- Authentication: bcrypt hashing, 7-day access JWT stored in `localStorage`, no refresh tokens.
- Registration creates an `ADMIN`; all registered users share the same workspace.
- Roles (`ADMIN`, `MANAGER`, `STAFF`) are stored and displayed but **not enforced**. Do not claim
  RBAC exists or add permission checks unless the user explicitly changes this decision.
- Product deletion rule: hard-delete only when the product has no stock and no movements;
  otherwise set `isArchived = true`.
- Remove products from normal lists by default; support an `includeArchived` query flag.
- No production Dockerfiles or nginx yet; database-only Docker Compose for now.
- Do not commit secrets, `.env`, `node_modules`, or build output.
- The demo password is documented intentionally. Real secrets never go in git.

## 7. Git workflow

- `main` is the stable branch. Never develop directly on `main`.
- One long-lived feature branch per phase, created from `main`:
  - `feature/phase-2-catalog`
  - `feature/phase-3-inventory`
  - `feature/phase-4-dashboard`
  - `feature/phase-5-polish`
- Commit style: Conventional Commits, for example
  `feat(server): add catalog crud endpoints`,
  `feat(client): add product management pages`,
  `chore: clean root package manifest`,
  `docs: update phase status`.
- Push the branch, open a PR to `main`, report the PR URL, and **wait for approval before merging**.
- Preferred PR command after `gh auth login`:
  ```powershell
  gh pr create --base main --head feature/phase-2-catalog `
    --title "Phase 2: Catalog management" --body "<summary and verification>"
  ```
- Fallback compare URL:
  `https://github.com/IvanAntoschuk/stockflow/compare/main...feature/phase-2-catalog?expand=1`
- Never force-push. Never rewrite `main`. Never merge without user approval.
- After an approved merge: switch to `main`, pull, and delete the merged local/remote branch.
- Before every commit: check `git diff --cached --name-only` for `.env`, `dist/`, `node_modules/`.
- Phase cadence: implement, verify, report, pause. Do not start the next phase automatically.

## 8. Phase 2 — catalog management (implemented, verification pending)

Goal: Product / Category / Supplier / Warehouse schema, CRUD APIs, seed data, and real UI pages
replacing the corresponding `PlaceholderPage` routes.

Status: implemented on `feature/phase-2-catalog` with migration `20261116172753_add_catalog`.
The subsections below document the delivered behavior and serve as a review reference.

Delivered layout: `server/src/modules/catalog/` (routes -> controller -> service -> schemas for all
four resources, plus `catalog.utils.ts`), client pages in `client/src/pages/catalog/`, request
modules in `client/src/api/`, types in `client/src/types/catalog.ts`, and validation in
`client/src/lib/validation/catalog.ts`.

Notable deviations from the original plan:

- `Supplier.name` is not unique in the schema; the API searches by name and the seed upserts by it.
- Warehouse delete is blocked whenever inventory rows exist, including zero-quantity rows.
- Product delete archives when any inventory quantity is non-zero; otherwise it deletes the
  zero-quantity inventory rows and the product in one transaction.
- Product `stock` is computed by summing the included inventory rows instead of a separate
  aggregate query.

### 8.1 Prisma models

Add and migrate (suggested migration name: `add_catalog`):

- `Category`
  - `id String @id @default(cuid())`
  - `name String @unique`
  - `description String?`
  - `products Product[]`
  - `createdAt`, `updatedAt`
- `Supplier`
  - `id`, `name`, optional `contactName`, `email`, `phone`, `address`, `notes`
  - `products Product[]`
  - `createdAt`, `updatedAt`
  - index on `name`
- `Warehouse`
  - `id`, `name @unique`, `code @unique`, optional `address`, `city`
  - `inventory Inventory[]`
  - `createdAt`, `updatedAt`
- `Product`
  - `id`, `sku String @unique`, `name`, `description String?`
  - `categoryId` + required relation, `supplierId String?` + optional relation
  - `unit String @default("pcs")`
  - `costPrice Decimal @db.Decimal(12, 2)`
  - `sellingPrice Decimal @db.Decimal(12, 2)`
  - `minStock Int @default(0)`
  - `isArchived Boolean @default(false)`
  - `inventory Inventory[]`
  - `createdAt`, `updatedAt`
  - indexes on `name`, `categoryId`, `supplierId`, `isArchived`
- `Inventory` (minimal, to support stock aggregates and delete protection)
  - `id`, `productId`, `warehouseId`, `quantity Int @default(0)`
  - relations to `Product` and `Warehouse`
  - `createdAt`, `updatedAt`
  - `@@unique([productId, warehouseId])`, index on `warehouseId`

Do **not** add stock quantity to `Product`. Stock lives in `Inventory`.
Phase 3 will add stock-movement history and operations.

Delete behavior:

- Category/Supplier referenced by products: return `409` (do not cascade, do not orphan).
- Warehouse with inventory rows: return `409`.
- Product with inventory quantity or movement history: archive instead of delete.
  In Phase 2 only `Inventory` exists; Phase 3 must extend the check to movements.
  For zero-quantity inventory rows, remove them in the same transaction before hard delete,
  or archive if that is safer. Document the chosen behavior.

### 8.2 Seed

Extend `server/prisma/seed.ts` idempotently with demo data:

- 4–5 categories, 4–5 suppliers, 2–3 warehouses.
- 8–12 realistic products with SKUs, units, prices, min stock, and category/supplier links.
- Inventory quantities across warehouses so the product list can show aggregate stock and at
  least one low-stock item.
- Keep the existing admin upsert and credentials unchanged.
- Use `upsert` or stable unique keys so `npm run db:seed` can run repeatedly.

### 8.3 API

Add authenticated CRUD endpoints (all require `authenticate`):

```text
GET    /api/categories            list (search, pagination)
POST   /api/categories            create
GET    /api/categories/:id        detail
PATCH  /api/categories/:id        update
DELETE /api/categories/:id        guarded delete

GET    /api/suppliers             same shape
POST   /api/suppliers
GET    /api/suppliers/:id
PATCH  /api/suppliers/:id
DELETE /api/suppliers/:id

GET    /api/warehouses
POST   /api/warehouses
GET    /api/warehouses/:id
PATCH  /api/warehouses/:id
DELETE /api/warehouses/:id

GET    /api/products              search, filters, pagination, includeArchived
POST   /api/products
GET    /api/products/:id          include category, supplier, inventory
PATCH  /api/products/:id
DELETE /api/products/:id          hard delete or archive per rule
```

List query conventions:

- `page` default 1, `pageSize` default 10, max 100.
- `search` matches product name/SKU (case-insensitive), category/supplier/warehouse name.
- Product filters: `categoryId`, `supplierId`, `includeArchived` (default false).
- Validate query params with Zod; return `meta` via `sendSuccess(res, items, 200, meta)`.
- Duplicate unique fields: return `409` with a specific code such as `SKU_IN_USE`,
  `CATEGORY_IN_USE`, `WAREHOUSE_CODE_IN_USE`.
- Validate prices as non-negative, two decimals; use Prisma `Decimal`, never float math.
- Product response may include `stock` (sum of inventory quantities) computed with Prisma
  aggregate/groupBy. Prisma `Decimal` serializes to string in JSON; keep that predictable.
- Use a transaction for product delete/archive decisions and any inventory cleanup.

Suggested module layout: one `server/src/modules/catalog/` module containing routes, controllers,
services, and schemas for the four resources, mounted at `/api`. Alternatively one folder per
resource, but stay consistent with the existing `routes -> controller -> service -> schemas` split.

### 8.4 Client pages

Replace placeholders for `/products`, `/categories`, `/warehouses`, `/suppliers` in `router.tsx`.
Keep `/inventory`, `/movements`, and `/reports` as placeholders until later phases.

- Products:
  - Server-driven antd `Table`: SKU, name, category, supplier, unit, cost, selling price,
    min stock, current stock, status, actions.
  - Search input and category/supplier filters; sync product search with the URL (`useSearchParams`)
    because the header search navigates to `/products?search=...`.
  - Create/edit in a `Drawer` (or wide `Modal`) using RHF + Zod; category/supplier selects loaded
    from the API; `InputNumber` for prices/min stock.
  - Detail view in a `Drawer` using antd `Descriptions`.
  - `Popconfirm` delete; surface archive-vs-delete outcome with a message.
  - Show `—` / "Awaiting inventory" rather than fabricating stock if aggregates are not ready.
- Categories, suppliers, warehouses:
  - Similar table + create/edit drawer + guarded delete.
  - Show product counts where useful.
- Add per-resource request modules under `client/src/api/`.
- Add types under `client/src/types/` and Zod schemas under `client/src/lib/validation/`.
- Use `pageSize`, `current`, `total` from the API `meta`; do not client-paginate.
- Keep mobile usable: table `scroll={{ x: ... }}`, drawers sized for small screens, no overflow.
- Update the dashboard setup card after catalog data exists if it improves coherence, but do not
  build analytics yet.

### 8.5 Phase 2 commits

1. `feat(server): add catalog schema, seed and crud endpoints`
2. `feat(client): add catalog management pages`
3. `docs: update readme and handoff notes for phase 2`

Split further if a commit becomes hard to review. Push the branch and open the PR when done.

## 9. Verification protocol (every phase)

Run and report:

```powershell
npm run typecheck
npm run lint
npm run build
npm test
```

API checks:

- Health endpoint returns 200.
- Login works; requests without a token return 401.
- Create/list/detail/update/delete for each new resource.
- Duplicate unique values return 409.
- Guarded deletes return 409 when references exist.
- Archived products disappear from the default list and reappear with `includeArchived=true`.
- Product stock equals the sum of inventory quantities.

Browser checks:

- Login -> each new page -> create -> edit -> search/filter -> detail -> delete/archive.
- Refresh on a deep link works (SPA routing).
- Mobile around 390px and desktop around 1440px; no horizontal overflow.
- No console errors and no failed network requests.
- Clean up test data or re-run the idempotent seed afterwards.

There is no Playwright dependency in the repo. Prior verification used an ad-hoc `playwright-core`
install outside the repo. Do not add browser-test dependencies without user approval.

The user may prefer to run verification personally. Never run long-lived commands (`npm run dev`,
`tsx watch`, `prisma studio`) as part of verification, and prefer non-interactive variants
(`prisma migrate deploy`, `vitest run`) with explicit timeouts. If a command needs input or exceeds
the tool timeout, stop and report instead of retrying blindly.

## 10. Known issues and gotchas

- **Root `package.json` is polluted.** It currently lists the entire dependency tree under
  `dependencies`, plus `main`, `keywords`, `author`, `license`, and `type: commonjs`. Those belong
  in the workspace manifests. Proposed cleanup: keep only `name`, `version`, `private`,
  `description`, `workspaces`, `engines`, `scripts`, and devDependencies (`concurrently`,
  `prettier`); remove the rest; run `npm install --package-lock-only`; then re-run typecheck, lint,
  build. Do this as `chore: clean root package manifest` only after user approval.
- Prisma 6.19.3 prints a deprecation warning for `package.json#prisma` seed config. Leave it for
  now; do not bump Prisma major versions without a migration plan.
- `prisma migrate dev` is interactive and can wait for input. Use `npm run db:migrate` normally;
  use `npx prisma migrate deploy` for non-interactive runs. The same applies to seed confirmations.
- `npm audit --omit=dev` was clean at Phase 1. The 3 high / 7 moderate findings are dev-only
  (`deepmerge-ts` via Prisma CLI, `minimatch` via typescript-eslint). Never run
  `npm audit fix --force`.
- Docker must be running. If the daemon is down, start Docker Desktop and wait for the engine.
- Do not change the DB port to 5432; local PostgreSQL 17 occupies it.
- Ant Design 6 APIs differ from v5 (`Divider orientation`, `Drawer size`). Use installed typings.
- `server/.env` contains the real local JWT secret. Do not print or commit it.
- Git may warn about LF/CRLF; `.gitattributes` normalizes text to LF.
- Commit attribution depends on `antoschukivan2010@gmail.com` being verified on the GitHub account.

## 11. Definition of done for a phase

- Feature works end to end against PostgreSQL.
- Typecheck, lint, build, and available tests pass.
- API and browser verification completed; no console/network errors.
- Responsive check passed at 390px and 1440px.
- README and this file updated with the new status and next step.
- Changes committed with clear messages and pushed; PR opened; user informed.
- Stop and wait for approval before merging or starting the next phase.
