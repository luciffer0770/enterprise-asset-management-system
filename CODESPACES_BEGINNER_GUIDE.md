# Run the Tool Online – Beginner Guide (GitHub Codespaces)

Follow these steps one by one.

---

## Step 1: Open the project on GitHub

1. Open your web browser.
2. Go to: **https://github.com/luciffer0770/enterprise-asset-management-system**
3. You should see the project page with files and folders.

---

## Step 2: Create a Codespace

1. Click the green **"Code"** button (near the top right).
2. In the menu, click the **"Codespaces"** tab.
3. Click **"Create codespace on main"** (or on the branch with the latest code).
4. Wait 1–2 minutes. A new tab will open with an editor that looks like VS Code.

---

## Step 3: Open the terminal

1. In that editor, look at the **bottom** of the window.
2. Click the **"Terminal"** tab.
3. If you don’t see it, press **Ctrl+`** (backtick key) or go to **View → Terminal**.
4. A black or white box will appear at the bottom. This is the terminal.

---

## Step 4: Run these commands (copy and paste one at a time)

Copy each line, paste it into the terminal, then press **Enter**.

First command:
```
npm install
```
Wait for it to finish (you’ll see a line of text again).

Second command:
```
npm run setup
```
Wait for it to finish.

Third command:
```
npm run dev
```
Leave this running. You should see **"✓ Ready"** after a few seconds.

---

## Step 5: Open the app in your browser

1. In the same Codespace window, find the **"Ports"** tab in the bottom panel (next to Terminal).
2. Click the **"Ports"** tab.
3. You should see **port 3000** listed.
4. Move your mouse over port 3000 – a **globe icon** or **"Open in Browser"** link will appear.
5. Click it.
6. A new browser tab will open with the app.

---

## Step 6: Log in

1. On the login page, click the **"Admin"** button.
2. Or type: **admin@demo.com** and password **demo123**.

---

## Summary (quick reference)

| Step | What to do |
|------|------------|
| 1 | Go to GitHub project page |
| 2 | Click **Code** → **Codespaces** → **Create codespace** |
| 3 | Open **Terminal** (bottom of screen) |
| 4 | Run: `npm install` then `npm run setup` then `npm run dev` |
| 5 | Click **Ports** tab → globe icon next to port 3000 |
| 6 | Log in with **Admin** or admin@demo.com / demo123 |

---

## If something goes wrong

- **"prisma: not found"** or **"next: not found"** – Run `npm install` first, wait for it to finish, then run `npm run setup` and `npm run dev` again.
- **"Command not found"** – Make sure you pasted the command exactly and pressed Enter.
- **Port 3000 not showing** – Wait 30 seconds after "✓ Ready" and check the Ports tab again.
- **Page won’t load** – Wait a few seconds and click the globe icon again.
