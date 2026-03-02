# Start the Tooling App – Copy & Run This

## Step 1: In the terminal, run (from the project folder):

```bash
cd /workspace && npm install && npm run db:migrate && npm run db:seed && npm run dev
```

Wait until you see: **✓ Ready** and a line like **Local: http://localhost:3000**

## Step 2: Open the app

### In Cursor
1. Open the **Ports** tab (View → Ports, or click "Ports" in the bottom panel).
2. Find port **3000** (or 3001 if 3000 was busy).
3. Click the **globe icon** or **"Open in Browser"** next to that port.

### If Ports doesn’t work
1. Press **Ctrl+Shift+P** (Mac: Cmd+Shift+P).
2. Type **Simple Browser**.
3. Press Enter.
4. Enter: `http://localhost:3000` (or 3001) and press Enter.

## Step 3: Log in

- Click one of the buttons: **Admin**, **Mechanical**, **Electrical**, or **External**
- Or enter: `admin@demo.com` / `demo123`

---

**Check the server is running:** Open `/api/health` – you should see `{"ok":true,...}`.
