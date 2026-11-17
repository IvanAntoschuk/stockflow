# StockFlow

Inventory management for small and medium-sized businesses. StockFlow tracks products across
multiple warehouses, records every stock movement, and surfaces low-stock and valuation insights.

## Stack

- **Frontend:** React 19, TypeScript, Vite, Ant Design 6, Tailwind CSS v4, Redux Toolkit,
  React Router, Axios, React Hook Form, Zod, Recharts
- **Backend:** Node.js, Express 5, TypeScript, Prisma, PostgreSQL, JWT, Zod
- **Infrastructure:** Docker Compose (PostgreSQL)

Project status: Phase 1 (foundation and authentication) and Phase 2 (catalog management) are
complete, verified, and merged. See the phase plan below.

## Getting started

### Prerequisites

- Node.js 20.19+
- Docker Desktop (for PostgreSQL)

### Setup

```bash
npm install
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

- Web app: http://localhost:5173
- API: http://localhost:4000/api
- PostgreSQL: `localhost:5434` (database/user/password: `stockflow` / `stockflow` / `stockflow_dev_password`)

Demo account:

```
Email: admin@stockflow.dev
Password: Admin123!
```

### Environment

Copy `server/.env.example` to `server/.env` if you need to point at a different database or
rotate the JWT secret. Never commit real secrets.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run API and web app together |
| `npm run build` | Build server and client |
| `npm run typecheck` | Type-check both workspaces |
| `npm run lint` | Lint both workspaces |
| `npm test` | Run server tests |
| `npm run db:up` / `db:down` | Start/stop PostgreSQL |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed demo data (admin, categories, suppliers, warehouses, products, stock) |
| `npm run db:studio` | Open Prisma Studio |

## Architecture

```
client/   React SPA (Vite, antd, Redux auth state, Axios API layer)
server/   Express REST API (routes -> controllers -> services -> Prisma)
```

Inventory balances live in the `Inventory` table, keyed by product and warehouse. Products never
store a global stock quantity; balances are aggregated from warehouse inventory and every change
is recorded as an immutable stock movement inside a database transaction.

### Catalog API

All catalog endpoints require a bearer token and return the shared API envelope:

| Resource | Endpoints |
| --- | --- |
| Categories | `GET/POST /api/categories`, `GET/PATCH/DELETE /api/categories/:id` |
| Suppliers | `GET/POST /api/suppliers`, `GET/PATCH/DELETE /api/suppliers/:id` |
| Warehouses | `GET/POST /api/warehouses`, `GET/PATCH/DELETE /api/warehouses/:id` |
| Products | `GET/POST /api/products`, `GET/PATCH/DELETE /api/products/:id` |

List endpoints accept `page`, `pageSize`, and `search`. Products also accept `categoryId`,
`supplierId`, and `includeArchived`. Duplicate unique values and guarded deletes return `409`.
Deleting a product that still has stock archives it instead of removing it.

## Phase plan

1. Foundation, database, authentication — complete
2. Products, categories, suppliers, warehouses — complete, verified, and merged
3. Inventory operations and stock movement history — next
4. Dashboard, charts, reports
5. UI polish, tests, documentation
