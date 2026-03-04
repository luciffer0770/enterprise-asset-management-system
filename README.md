# Industrial Tooling & Asset Management

A complete, runnable web application prototype for tooling and asset management with a Bosch-like industrial UI. Built with Next.js (App Router), TypeScript, TailwindCSS, Prisma, and Auth.js.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up database (SQLite for local dev)
npm run db:migrate

# 3. Seed sample data
npm run db:seed

# 4. Start the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with demo credentials.

## Demo Credentials

| Role          | Email                 | Password |
|---------------|-----------------------|----------|
| Admin         | admin@demo.com        | demo123  |
| Lab In-Charge | lab@demo.com          | demo123  |
| Mechanical    | mechanical@demo.com   | demo123  |
| Electrical    | electrical@demo.com   | demo123  |
| External      | external@demo.com     | demo123  |

## Project Variables

Configure via `.env`:

- `TENANT_NAME` - Tenant display name (default: "Tooling Dept")
- `ASSET_VOLUME_TIER` - small \| medium \| large (default: small; affects seed count)
- `UI_DENSITY` - compact \| comfortable (default: compact)
- `AUTH_MODE` - local+rbac (default)
- `DATABASE_URL` - For Postgres: `postgresql://user:pass@host:5432/db`

## Scripts

| Script        | Description                |
|---------------|----------------------------|
| `npm run dev` | Start dev server           |
| `npm run build` | Production build         |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint               |
| `npm run test` | Run tests                |
| `npm run db:migrate` | Apply migrations   |
| `npm run db:seed` | Seed sample data      |
| `npm run db:studio` | Open Prisma Studio  |

## Pages & Routes

- `/login` - Sign in (email/password + SSO stub)
- `/switch-role` - Demo role switcher (Admin only)
- `/dashboard` - Role-aware KPIs
- `/assets` - Asset registry with filters
- `/assets/[id]` - Asset detail, history, actions
- `/checkout` - Checkout/return flow
- `/reservations` - Calendar timeline
- `/work-orders` - Kanban view
- `/calibration` - Due/overdue lists
- `/finance` - Depreciation & disposal
- `/audit-logs` - Immutable event log
- `/integrations` - Connector config (Admin)
- `/mobile/scan` - PWA-friendly scan flow

## Design System

- **Tokens**: `src/styles/tokens.css` — Bosch-like colors, spacing, radius
- **Components**: `src/components/ui/` — Button, Input, Card, Badge, etc.
- **Red sparingly**: Primary actions use brand red (#E20015)
- **Typography**: Inter fallback (no proprietary fonts)

## Documentation

- `docs/diagrams/er.mmd` - Mermaid ER diagram
- `docs/diagrams/workflows.mmd` - Workflow flowcharts
- `docs/schema.sql` - Postgres-flavored SQL schema
- `docs/permission-matrix.md` - RBAC capability matrix

## Stack

- Next.js 15 (App Router) + TypeScript
- TailwindCSS + CSS variables
- Prisma ORM (SQLite dev, Postgres prod)
- Auth.js (NextAuth) with Credentials Provider
- Zod, Radix UI, Recharts
