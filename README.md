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
- `/assets` - Asset registry
- `/checkout` - Checkout/return
- `/reservations` - Calendar
- `/work-orders` - Kanban
- `/calibration` - Due/overdue
- `/finance` - Depreciation
- `/audit-logs` - Event log
- `/integrations` - Connectors (Admin)
- `/mobile/scan` - Scan flow

## Scripts

- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:migrate` - Apply migrations
- `npm run db:seed` - Seed demo data
