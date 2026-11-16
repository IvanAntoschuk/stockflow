# StockFlow

Inventory management for small and medium-sized businesses. StockFlow tracks products across
multiple warehouses, records every stock movement, and surfaces low-stock and valuation insights.

## Stack

- **Frontend:** React 19, TypeScript, Vite, Ant Design 6, Tailwind CSS v4, Redux Toolkit,
  React Router, Axios, React Hook Form, Zod, Recharts
- **Backend:** Node.js, Express 5, TypeScript, Prisma, PostgreSQL, JWT, Zod
- **Infrastructure:** Docker Compose (PostgreSQL)

Project status: Phase 1 (foundation and authentication) complete. See the phase plan below.

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
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |

## Architecture

```
client/   React SPA (Vite, antd, Redux auth state, Axios API layer)
server/   Express REST API (routes -> controllers -> services -> Prisma)
```

Inventory balances live in the `Inventory` table, keyed by product and warehouse. Products never
store a global stock quantity; balances are aggregated from warehouse inventory and every change
is recorded as an immutable stock movement inside a database transaction.

## Phase plan

1. Foundation, database, authentication
2. Products, categories, suppliers, warehouses
3. Inventory operations and stock movement history
4. Dashboard, charts, reports
5. UI polish, tests, documentation
