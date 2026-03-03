# Run the Tool in Cursor Cloud (No Third-Party Sites)

The app runs in this workspace. Use only Cursor's built-in viewer.

## Step 1: Start the server

In the terminal:
```bash
cd /workspace
npm run setup
npm run dev
```

Wait until you see **✓ Ready**.

## Step 2: Open in Cursor

### Option A: Simple Browser (try this first)

1. Press **Ctrl+Shift+P** (Mac: **Cmd+Shift+P**)
2. Type **Simple Browser**
3. Choose **Simple Browser: Show**
4. Enter: `http://localhost:3000`
5. Press Enter

### Option B: Ports panel

1. Open **Ports** tab (bottom panel)
2. Find port **3000** (or 3001)
3. Click the **globe** or **Open in Browser**

## Step 3: Log in

- Click **Admin**, **Mechanical**, **Electrical**, or **External**
- Or: `admin@demo.com` / `demo123`

---

**If "request could not be routed" appears:** Try Simple Browser with `http://localhost:3000` first. If Ports fails, Simple Browser may work.
