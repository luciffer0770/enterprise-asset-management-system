# Login Not Working / Not Crossing Login Page

If you can see the login page but it doesn’t go to the dashboard after signing in, try these steps. This applies to the Tool and Trolley Management app (tickets, KPIs, Excel import/export).

## 1. Use the correct URL (most common fix)

**Always open the app via the Ports tab**, not by typing an address:

1. In Codespaces, open the **Ports** tab.
2. Find port **3000** or **3001**.
3. Click the **globe icon** next to it.
4. Use only that URL (e.g. `https://xxx-3000.app.github.dev`).

Do **not** use `localhost:3000` in your browser’s address bar. The session cookie only works for the URL shown in the Ports tab.

---

## 2. Set NEXTAUTH_URL in Codespaces

If it still fails, set the URL explicitly before starting the app:

1. In the Ports tab, note the full URL (e.g. `https://your-codespace-3000.app.github.dev`).
2. In the terminal:
   ```bash
   export NEXTAUTH_URL="https://your-codespace-3000.app.github.dev"
   npm run dev
   ```
   (Use your real Ports URL.)

---

## 3. Use incognito/private mode

Open the Ports URL in a new incognito window. Old cookies can block login.

---

## 4. Run setup before dev

Ensure the database and config are set up:

```bash
npm run setup
npm run dev
```

---

## 5. Check the URL you’re on

After clicking **Sign in**, the address bar should change to `/dashboard`.

- If it goes to `localhost` instead of the Codespaces URL, the app doesn’t know the correct public URL.
- Fix: Set `NEXTAUTH_URL` as in step 2, then restart and log in again.
