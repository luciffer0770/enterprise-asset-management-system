# Access the App in Cursor Cloud

Tool and trolley management with tickets, KPIs, Excel import/export. The app runs on **port 3000** inside this workspace.

## If "Site can't be reached"

### 1. Confirm the server is running

In the terminal, run:
```bash
cd /workspace
npm run dev
```
Wait for **✓ Ready**. Leave this running.

### 2. Forward the port

1. Open the **Ports** tab (View → Ports, or bottom panel).
2. Click **Forward a Port**.
3. Enter **3000** and press Enter.
4. Wait until the port shows as **Forwarded** (or has a globe icon).
5. Click the **globe icon** or **Open in Browser** next to port 3000.

### 3. Use the exact URL from the Ports panel

Do **not** type `localhost:3000` in a regular browser. Use the URL shown in the Ports panel for port 3000 (e.g. `https://....preview....`). That URL tunnels to this workspace.

### 4. Try Simple Browser inside Cursor

1. **Ctrl+Shift+P** (Mac: **Cmd+Shift+P**)
2. Type **Simple Browser**
3. Select **Simple Browser: Show**
4. Enter: `http://localhost:3000`

The Simple Browser runs inside Cursor and may be able to reach the workspace server.

### 5. Try port 8080 if 3000 fails

Some environments prefer port 8080. Stop the server (Ctrl+C), then:
```bash
npm run dev:8080
```
Then forward **port 8080** in the Ports tab and open that URL.

---

## Login

**Admin** | **Mechanical** | **Electrical** | **External**  
Or: `admin@demo.com` / `demo123`
