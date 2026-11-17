# StockFlow

StockFlow is an inventory management application for small and medium-sized teams. It keeps a shared
catalog of products, categories, suppliers and warehouses; tracks per-warehouse balances; records a
permanent audit trail of every stock change; and turns that data into dashboard and report views.

The project is a full-stack TypeScript monorepo with an Express/Prisma API and a React web client.
It is intended as a working local-first MVP: Docker Compose runs PostgreSQL only, and both the API
and web app run directly with Node/Vite during development.

## Project status

All five planned phases are complete and merged into `main`:

1. Foundation, database and authentication
2. Product catalog management
3. Inventory balances and stock movements
4. Dashboard charts and reports
5. UI polish, automated tests and documentation

There is no production Dockerfile or reverse-proxy setup yet. The current Compose file is for the
local database only.

## What it does

### Catalog management

- Create, read, update and delete categories, suppliers, warehouses and products.
- Search and paginate list views using server-side `page`, `pageSize` and `search` parameters.
- Filter products by category, supplier and archived state.
- Store product SKUs, units, cost/selling prices, minimum stock thresholds, descriptions and
  supplier/category links.
- Guard destructive operations: referenced categories, suppliers and warehouses cannot be deleted;
  products with stock or movement history are archived instead of removed.

### Inventory operations

- View balances by product and warehouse with `out`, `low` and `ok` status.
- Filter balances by product, warehouse, low-stock state and archived products.
- Record receipts, issues and manual adjustments.
- Transfer stock between warehouses as one atomic operation.
- Keep signed, immutable movement history with before/after quantities, references, notes, user and
  timestamp.
- Reject invalid operations: over-issue, zero adjustments and same-warehouse transfers.

### Dashboard and reports

- Show KPI cards for catalog counts, on-hand units, stock alerts, inventory value and movement flow.
- Filter analytics by date range, product, warehouse, category, supplier and movement type.
- Visualize movement activity, stock valuation by category, warehouse distribution and movement
  type breakdown with Recharts.
- Browse server-paginated movement history, warehouse valuation and low-stock reports.
- Sync report filters with the URL so deep links and refreshes preserve the current view.

### UI and UX

- English UI, USD currency defaults, emerald primary color and Inter font.
- Responsive Ant Design layout with a mobile navigation drawer and horizontally scrollable tables.
- Shared page headers, breadcrumbs, form fields, route error fallback and branded 404 page.
- Loading, empty and error states for data-heavy pages, including retryable report errors.

## Tech stack

- **Frontend:** React 19, TypeScript, Vite 7, Ant Design 6, Tailwind CSS v4, Redux Toolkit,
  React Router 7, Axios, React Hook Form, Zod 4, Recharts, dayjs
- **Backend:** Node.js, Express 5, TypeScript ESM, Prisma 6, PostgreSQL 16, Zod 4, JWT, bcrypt
- **Tooling:** npm workspaces, Vitest, ESLint, Prettier, Docker Compose
- **Ports:** API `4000`, web `5173`, PostgreSQL `5434`

Ant Design provides the component system; Tailwind is used for layout utilities with CSS preflight
disabled to avoid conflicts. Redux holds authentication state only, while page data stays in local
component state.

## Getting started

### Prerequisites

- Node.js 20.19+
- Docker Desktop with a running engine

### Setup

```bash
npm install
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

Open:

- Web app: http://localhost:5173
- API: http://localhost:4000/api
- PostgreSQL: `localhost:5434`

The seeded demo account is:

```text
Email: admin@stockflow.dev
Password: Admin123!
```

The seed is idempotent. It creates one admin user, five categories, five suppliers, two warehouses,
twelve products, inventory balances across both warehouses, and opening-balance receipt movements.
Re-running `npm run db:seed` restores the demo dataset without duplicating stable records.

### Environment

The app uses `server/.env` for local configuration. Copy the example file if needed:

```powershell
Copy-Item server\.env.example server\.env
```

Do not commit real secrets. The JWT secret, database credentials and other local values belong only
in the ignored `.env` file. The repository uses port `5434` because local PostgreSQL installations
commonly occupy `5432` on the host.

## Scripts

Run these from the repository root:

| Command                             | Description                      |
| ----------------------------------- | -------------------------------- |
| `npm run dev`                       | Start API and web app together   |
| `npm run dev:server`                | Start API only                   |
| `npm run dev:client`                | Start web app only               |
| `npm run build`                     | Build server and client          |
| `npm run typecheck`                 | Type-check both workspaces       |
| `npm run lint`                      | Lint both workspaces             |
| `npm test`                          | Run the server Vitest unit tests |
| `npm run format`                    | Format files with Prettier       |
| `npm run db:up` / `npm run db:down` | Start/stop PostgreSQL            |
| `npm run db:migrate`                | Apply Prisma migrations          |
| `npm run db:seed`                   | Seed demo data                   |
| `npm run db:studio`                 | Open Prisma Studio               |

`prisma migrate dev` can be interactive. For non-interactive migration application, use
`npx prisma migrate deploy` from the `server/` directory.

## Architecture

```text
client/
  src/api/              Axios instance and per-resource request modules
  src/app/              Redux store and typed hooks
  src/components/       Shared UI, layout, guards, page header, form field
  src/features/auth/    Auth slice and thunks
  src/lib/              Labels, formatting and Zod validation schemas
  src/pages/            Route pages for catalog, inventory, dashboard and reports
  src/router.tsx        Route definitions
  src/theme.ts          Ant Design theme tokens
  src/index.css         Tailwind layers and global styles

server/
  src/app.ts            Express middleware, health route and router mounting
  src/config/env.ts     Zod-validated environment variables
  src/lib/prisma.ts     Prisma client singleton
  src/middleware/       Authentication, 404 and central error handling
  src/modules/auth/     Registration, login and current-user endpoints
  src/modules/catalog/  Category, supplier, warehouse and product CRUD
  src/modules/inventory/ Inventory balances and stock movement operations
  src/modules/analytics/ Dashboard and reporting aggregates
  src/utils/            AppError and response envelope helpers

server/prisma/
  schema.prisma         Data models, enums and indexes
  migrations/           Applied SQL migrations
  seed.ts               Idempotent demo data

server/tests/
  *.test.ts             Vitest unit tests for utilities and Zod schemas
```

Backend modules follow a consistent layering pattern:

```text
routes -> controller -> service -> Prisma
```

Routes declare endpoints and apply middleware. Controllers parse request input with Zod. Services
own database queries and throw `AppError` instances. Response formatting stays in `sendSuccess` so
every endpoint uses the same envelope. Server source is ESM, so relative imports include the `.js`
extension even in TypeScript files.

Frontend data flow uses the shared Axios client, which injects the bearer token and handles expired
sessions. Forms combine React Hook Form with Zod and the shared `FormField` wrapper. Protected
routes use guards, and route-level errors have a branded fallback.

## Data model

| Model           | Purpose                                                                 |
| --------------- | ----------------------------------------------------------------------- |
| `User`          | Admin account with email, bcrypt password hash, name and role           |
| `Category`      | Named product grouping with optional description                        |
| `Supplier`      | Vendor contact details and notes; name is indexed but not unique        |
| `Warehouse`     | Physical stock location with unique name and code                       |
| `Product`       | SKU, pricing, unit, thresholds and archived flag; no global stock field |
| `Inventory`     | Per-product, per-warehouse quantity with a unique pair constraint       |
| `StockMovement` | Signed audit row for every receipt, issue, adjustment and transfer leg  |

Important model decisions:

- Stock lives in `Inventory`, never directly on `Product`. Aggregate stock is the sum of inventory
  rows.
- `StockMovement.quantity` is the signed delta. Receipts and transfer-ins are positive, issues and
  transfer-outs are negative, and adjustments may be positive or negative but never zero.
- Movement rows store `previousQuantity` and `newQuantity` so the audit trail shows the balance
  before and after each operation.
- Transfers write two movement rows with a shared generated `reference`.
- Users have `ADMIN`, `MANAGER` or `STAFF` roles for display, but roles are not enforced. There is no
  RBAC layer.
- There is no sales, order or customer model. Reports describe inventory value and movement flow,
  not realized revenue or profit.

## Authentication and security

- `POST /api/auth/register` creates an admin account.
- `POST /api/auth/login` returns a JWT.
- `GET /api/auth/me` returns the current user and requires a bearer token.
- Passwords are hashed with bcrypt.
- Access tokens are valid for seven days and stored in `localStorage` under `stockflow.token`.
- There are no refresh tokens and no server-side session store.
- All non-public endpoints require `Authorization: Bearer <token>`.

This is a local MVP setup. A production deployment would need a more deliberate token strategy,
HTTPS, rate limiting and a real secret management process.

## API

All endpoints return a consistent success envelope:

```json
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "pageSize": 10, "total": 0, "totalPages": 0 }
}
```

Errors use:

```json
{
  "success": false,
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable message",
    "details": []
  }
}
```

### Auth

| Method | Endpoint             | Purpose                    |
| ------ | -------------------- | -------------------------- |
| `POST` | `/api/auth/register` | Register a new admin user  |
| `POST` | `/api/auth/login`    | Log in and receive a token |
| `GET`  | `/api/auth/me`       | Get the authenticated user |

### Catalog

| Resource   | Endpoints                                                          |
| ---------- | ------------------------------------------------------------------ |
| Categories | `GET/POST /api/categories`, `GET/PATCH/DELETE /api/categories/:id` |
| Suppliers  | `GET/POST /api/suppliers`, `GET/PATCH/DELETE /api/suppliers/:id`   |
| Warehouses | `GET/POST /api/warehouses`, `GET/PATCH/DELETE /api/warehouses/:id` |
| Products   | `GET/POST /api/products`, `GET/PATCH/DELETE /api/products/:id`     |

List endpoints accept `page`, `pageSize` and `search`. Products also accept `categoryId`,
`supplierId` and `includeArchived`. Duplicate unique values and guarded deletes return `409`.
Deleting a product that still has stock or movement history archives it instead of removing it.

### Inventory and movements

| Resource  | Endpoints                                                                           |
| --------- | ----------------------------------------------------------------------------------- |
| Balances  | `GET /api/inventory`                                                                |
| Movements | `GET/POST /api/movements`, `GET /api/movements/:id`, `POST /api/movements/transfer` |

Balance queries accept `search`, `productId`, `warehouseId`, `lowStock` and `includeArchived`; rows
include an `out`/`low`/`ok` status. Movement queries accept `search`, `productId`, `warehouseId`,
`type`, `from` and `to`. Over-issue returns `409`, while zero adjustments and same-warehouse
transfers return `422`.

### Analytics

| Endpoint                               | Purpose                                                              |
| -------------------------------------- | -------------------------------------------------------------------- |
| `GET /api/analytics/summary`           | Catalog counts, on-hand units, alerts, valuation and movement totals |
| `GET /api/analytics/stock-breakdown`   | Valuation and units grouped by category, supplier or warehouse       |
| `GET /api/analytics/low-stock`         | Paginated `out`/`low` balances with shortfall and value              |
| `GET /api/analytics/movements/trend`   | Daily, weekly or monthly movement counts and unit flow               |
| `GET /api/analytics/movements/by-type` | Counts and absolute units for all movement types                     |

Analytics endpoints are read-only and share product, warehouse, category, supplier and date filters.
Money is serialized as decimal strings to avoid floating-point drift. Reversed date ranges return
`422 VALIDATION_ERROR`.

## Verification

Run the full local check suite:

```bash
npm run typecheck
npm run lint
npm run build
npm test
```

`npm test` runs four Vitest files with 55 unit tests covering pagination metadata, text
normalization, catalog validation defaults, movement and transfer rules, boolean query coercion,
date ranges and analytics filters. The tests do not require a database or browser environment.

Browser verification is manual. There is no Playwright dependency in the repository. Check login,
navigation, create/edit/delete flows, deep-link refreshes, responsive layouts around 390px and
1440px, and the browser console for errors or failed requests.

A minimal API smoke check:

```powershell
Invoke-RestMethod http://localhost:4000/api/health
$body = @{ email = 'admin@stockflow.dev'; password = 'Admin123!' } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/auth/login `
  -ContentType 'application/json' -Body $body
Invoke-RestMethod http://localhost:4000/api/auth/me `
  -Headers @{ Authorization = "Bearer $($login.data.token)" }
```

## Known limitations

- Roles are stored and shown but not enforced; do not describe the app as having RBAC.
- There is no sales/order model, so reports do not calculate realized revenue or profit.
- Seed opening balances are receipts created at seed time, not historical business activity.
- Docker Compose provides PostgreSQL only; there is no production image or reverse proxy.
- Prisma prints a deprecation warning for the seed configuration in `package.json`.
- The root `package.json` still contains extra dependency metadata that could be cleaned up in a
  separate maintenance change.
- Browser checks are manual and no browser-testing dependency is installed.

## Development workflow

`main` is the stable branch. Feature work happens on phase or topic branches and is delivered
through pull requests using Conventional Commits, for example:

```text
feat(client): add dashboard charts
feat(server): add analytics endpoints
test(server): add schema unit tests
docs: expand project readme
```

Keep secrets, `.env`, `node_modules` and build output out of git. After a pull request is approved
and merged, switch back to `main`, pull the merge, and delete the merged branch.
