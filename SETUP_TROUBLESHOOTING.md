# Setup & Troubleshooting

## Prisma 7 / "url is no longer supported"

If `npm run setup` prompts to install `prisma@7.4.2` or fails with:

```
The datasource property `url` is no longer supported in schema files
```

**Fix:** The project requires Prisma 5.x. Run:

```bash
rm -rf node_modules package-lock.json
npm install
npm run setup
```

This ensures Prisma 5.22.0 is installed (pinned in package.json).

---

## Next.js 16 / Turbopack "Expected file content" error

If `npm run dev` crashes with a Turbopack error:

```
FATAL: An unexpected Turbopack error occurred
Expected file content for file
```

**Fix:** The project uses Next.js 15.x. Run:

```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## Database reset

If migrations fail or seed has errors:

```bash
rm -f prisma/dev.db
npm run setup
```

---

## npm audit

The project pins versions and applies safe overrides. Remaining advisories:

- **xlsx** – No patch; used only for Excel import/export. Mitigate by validating uploaded files.
- **vitest/esbuild** – Dev-only; low risk for production.

Run `npm audit` to see current status. Do not use `npm audit fix --force` without testing.
