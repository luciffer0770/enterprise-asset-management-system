# Access the Tool in Cursor Cloud – Fix "Request Could Not Be Routed"

Cursor's built-in port forwarding can fail with "The request could not be routed." Use **localtunnel** instead to get a public URL that works reliably.

## Option A: Run with tunnel (recommended for cloud)

In the terminal (from `/workspace`):

```bash
# 1. Setup and start the server
npm run setup
npm run dev
```

Leave that running. In a **second terminal**:

```bash
# 2. Create a public tunnel
npx localtunnel --port 3000
```

You'll see something like:
```
your url is: https://random-words-here.loca.lt
```

**Open that URL in your browser.** On first visit, click "Click to Continue" if prompted, then use the app.

Login: **Admin** button or `admin@demo.com` / `demo123`

---

## Option B: One-command script

```bash
chmod +x run-with-tunnel.sh
./run-with-tunnel.sh
```

Then open the URL shown (e.g. `https://xxx.loca.lt`).

---

## Option C: Cursor Ports (may fail in cloud)

If port forwarding works: Ports tab → port 3000 → Open in Browser.

---

## If the server uses port 3001

If you see `Port 3000 is in use, trying 3001`, run the tunnel with:
```bash
npx localtunnel --port 3001
```
