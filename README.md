# Industrial Tooling & Asset Management

Tool and trolley management with ticketing workflow, role-based access, and Excel import/export.

## Features

- **Tools** – Add, edit, assign to trolleys; manual location; Excel import/export
- **Trolleys** – Project-based trolleys (Mechanical/Electrical) where tools are mounted
- **Tickets** – Issue/return flow; return creates approval ticket for Admin/Lab In-Charge
- **Dashboard** – Role-aware KPIs, charts, quick actions
- **Roles** – Admin, Lab In-Charge, Mechanical, Electrical, External (RBAC enforced)

No mobile scan or external integrations (removed).

---

## Quick start (cloud or local)

```bash
cd /workspace   # or your project directory
rm -f prisma/dev.db   # optional: fresh DB
npm run setup         # installs deps, migrates, seeds
npm run dev
```

**Note:** `npm run setup` runs `npm install` first, then migrations and seed. Use it instead of separate `db:migrate` + `db:seed`.

**If you see "Prisma 7" or "datasource url no longer supported":** The project uses Prisma 5. Run `rm -rf node_modules package-lock.json && npm install && npm run setup` to get the correct versions.

**If setup fails with "column does not exist" or migration errors:** Reset the database:
```bash
rm -f prisma/dev.db
npm run setup
```

Open the app:
- **Ports panel**: Ports tab → Open in Browser for port 3000 (or 3001)
- **Simple Browser**: `Ctrl+Shift+P` → "Simple Browser" → `http://localhost:3000`
- **Health check**: `http://localhost:3000/api/health` (should return `{"ok":true,...}`)

See [OPEN_APP.md](OPEN_APP.md) for detailed cloud workspace instructions.

---

## Demo login

| Role      | Email              | Password |
| --------- | ------------------ | -------- |
| Admin     | admin@demo.com     | demo123  |
| Mechanical| mechanical@demo.com| demo123  |
| Electrical| electrical@demo.com| demo123  |
| External  | external@demo.com  | demo123  |

Click the role buttons on the login page for one-click sign in.

---

## Pages

| Path        | Description |
| ----------- | ----------- |
| `/dashboard` | KPIs, charts, role-aware widgets |
| `/assets`    | **Tools** – KPI tiles, table, Add Tool, Export/Import Excel |
| `/trolleys`  | Trolley management – project, department, tools assigned |
| `/tickets`   | Ticket queue – pending approval, active, overdue; Approve/Reject |
| `/checkout`  | Issue/return tools (linked from Tickets page) |
| `/reservations` | Calendar |
| `/work-orders`  | Kanban |
| `/calibration`  | Due/overdue |
| `/finance`      | Depreciation |
| `/audit-logs`   | Event log |

---

## Scripts

| Command          | Purpose |
| ---------------- | ------- |
| `npm run setup`  | Create .env, run migrations, seed database |
| `npm run dev`    | Start dev server (ports 3000 or 3001) |
| `npm run build`  | Build for production |
| `npm run start`  | Start production server |
| `npm run db:seed`| Re-seed only (after setup) |
| `npm run db:studio` | Prisma Studio (database UI) |

---

## Branch

Latest changes are on **`cursor/industrial-tooling-management-1b99`**. In Codespaces or a clone:

```bash
git fetch origin
git checkout cursor/industrial-tooling-management-1b99
git pull
npm run setup
npm run dev
```
