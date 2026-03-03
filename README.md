# Industrial Tooling & Asset Management

## Quick start (cloud or local)

```bash
cd /workspace   # or your project directory
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Or run the all-in-one script:
```bash
./run.sh
```

Open the app:
- **Ports panel**: Ports tab → Open in Browser for port 3000 (or 3001)
- **Simple Browser**: `Ctrl+Shift+P` → "Simple Browser" → `http://localhost:3000`
- **Health check**: `http://localhost:3000/api/health` (should return `{"ok":true,...}`)

See [OPEN_APP.md](OPEN_APP.md) for detailed cloud workspace instructions.

## Demo login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | demo123 |
| Mechanical | mechanical@demo.com | demo123 |
| Electrical | electrical@demo.com | demo123 |
| External | external@demo.com | demo123 |

Click the role buttons for one-click sign in.

## Pages

- `/dashboard` - KPIs
- `/assets` - Tool management (with KPI tiles, import/export)
- `/trolleys` - Trolley management (tools assigned to project trolleys)
- `/tickets` - Ticket queue (issue/return with approval workflow)
- `/checkout` - Issue/return tools (linked from Tickets)
- `/reservations` - Calendar
- `/work-orders` - Kanban
- `/calibration` - Due/overdue
- `/finance` - Depreciation
- `/audit-logs` - Event log

## Scripts

- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:migrate` - Apply migrations
- `npm run db:seed` - Seed demo data
