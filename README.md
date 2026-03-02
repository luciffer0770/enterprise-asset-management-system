# Industrial Tooling & Asset Management

## Quick start

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open **http://localhost:3000** and sign in with **admin@demo.com** / **demo123**.

**In Cursor**: Use Simple Browser (`Ctrl+Shift+P` → "Simple Browser" → `http://localhost:3000`) or the Ports panel to open the forwarded URL. See [OPEN_APP.md](OPEN_APP.md) for details.

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
