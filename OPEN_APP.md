# How to Open the Tooling Management App (Cloud Workspace)

## 1. Start the app (run from project folder: `/workspace`)

```bash
cd /workspace
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Wait until you see: `✓ Ready in ...` — check the output: **Local: http://localhost:3000** or **http://localhost:3001** (if 3000 is busy).

## 2. Open in Cursor

### Ports panel (recommended)
1. Open **Ports** tab (View → Ports, or Terminal panel → Ports)
2. Find the port in the dev output (**3000** or **3001**)
3. Click the **globe** icon or **Open in Browser** for that port
4. This opens the public URL (e.g. `https://xxxx-3000.preview.app.github.dev` or similar)

### Simple Browser
1. `Ctrl+Shift+P` (or `Cmd+Shift+P`) → type **Simple Browser**
2. Enter: `http://localhost:3000` or `http://localhost:3001` (match the port from step 1)

## 3. Verify the app is running

Open: `/api/health` — you should see `{"ok":true,"message":"Industrial Tooling Management API is running",...}`

## 4. Log in

- **Quick**: Click **Admin**, **Mechanical**, **Electrical**, or **External**
- **Manual**: `admin@demo.com` / `demo123`

## 5. Demo credentials

| Role       | Email               | Password |
| ---------- | ------------------- | -------- |
| Admin      | admin@demo.com      | demo123  |
| Mechanical | mechanical@demo.com | demo123  |
| Electrical | electrical@demo.com | demo123  |
| External   | external@demo.com   | demo123  |
