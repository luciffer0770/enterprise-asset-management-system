# Run the Tool Online – One-Click Links

Use these links to open and run the app in your browser. You can edit the code and see changes live.

---

## Option 1: StackBlitz (recommended)

**→ [Open in StackBlitz](https://stackblitz.com/fork/github/luciffer0770/enterprise-asset-management-system)**

1. Click the link above.
2. Wait for the project to load and dependencies to install.
3. In the **Terminal** panel (bottom), run:
   ```bash
   npm run setup && npm run dev
   ```
4. After you see `✓ Ready`, click the **"Open in New Tab"** / preview link in the top bar, or use the URL shown (e.g. `https://*.stackblitz.io`).
5. Log in with **Admin** button or `admin@demo.com` / `demo123`.

---

## Option 2: CodeSandbox

**→ [Open in CodeSandbox](https://codesandbox.io/p/github/luciffer0770/enterprise-asset-management-system)**

1. Click the link above.
2. When the project loads, run in the terminal:
   ```bash
   npm run setup && npm run dev
   ```
3. Use the preview URL shown to open the app.
4. Log in with **Admin** or `admin@demo.com` / `demo123`.

---

## Option 3: Deploy to Vercel (always-on URL)

For a permanent URL that stays online:

1. Go to [vercel.com](https://vercel.com) and sign in.
2. Click **Add New** → **Project**.
3. Import the repo: `luciffer0770/enterprise-asset-management-system`.
4. Add environment variables:
   - `DATABASE_URL` – use a Postgres connection string (Vercel Postgres, Neon, or Supabase free tier).
   - `NEXTAUTH_SECRET` – any random string (e.g. `openssl rand -base64 32`).
   - `NEXTAUTH_URL` – your Vercel URL (e.g. `https://your-project.vercel.app`).
5. Deploy.

**Note:** For Vercel, switch the database from SQLite to PostgreSQL. See `.env.example` for the schema.

---

## Quick reference

| Role      | Email              | Password |
| --------- | ------------------ | -------- |
| Admin     | admin@demo.com     | demo123  |
| Mechanical| mechanical@demo.com| demo123  |
| Electrical| electrical@demo.com| demo123  |
| External  | external@demo.com  | demo123  |
