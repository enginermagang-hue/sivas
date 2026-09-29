# AGENTS.md

## Aturan Strict — Larangan Menjalankan Perintah Berikut Tanpa Izin

Perintah-perintah di bawah **DILARANG DIPANGGIL SECARA OTOMATIS** oleh agent kecuali **secara eksplisit diminta oleh pengguna**:

- `npm run dev`
- `npm run build`
- `npx nuxt build`

Agent **tidak boleh** menjalankan perintah di atas meskipun terlihat sebagai langkah logis berikutnya, sebagai inisiasi proaktif, atau sebagai bagian dari verifikasi. Menunggu instruksi eksplisit dari pengguna sebelum menjalankan perintah manapun yang ada dalam daftar ini.

Similarly denied in `opencode.json` `permission.bash` (`npm run dev`, `npm run build`, `npx nuxt build`).

## Project

Nuxt 4 app (Vue 3 + Nitro) that holds both frontend and API in one repo. Indonesian-language daily-activity reporting app with 4 roles: `admin`, `koordinator`, `anggota`, `kepala`.

- DB: Turso / libSQL via `@libsql/client` (server-only, `server/utils/db.ts`).
- Uploads: Google Drive service account (server-only, `server/utils/googleDrive.ts`).
- Hosting: Vercel (`vercel.json` runs `nuxt build`).
- i18n, auth sessions, and offline sync are **hand-rolled** — there is no `@nuxtjs/i18n`, no Pinia, no JWT library.

## Commands

```bash
npm install            # runs `nuxt prepare` via postinstall
npm run typecheck      # vue-tsc over all TS project refs (the only automated check)
npm run dev            # FORBIDDEN without explicit user request
npm run build          # FORBIDDEN without explicit user request
npm run migrate        # create schema + seed (idempotent)
npm run migrate:fresh  # DROP all tables then re-migrate + seed
```

- **No test runner, linter, or formatter exists.** Do not invent `npm test` / `npm run lint`. The only automated verification is `npm run typecheck`.
- There is no CI and no `.github/`.

## Type checking

`npm run typecheck` = `nuxt typecheck` → runs the Nuxt `prepare` pipeline (regenerates `.nuxt` types; **not** a production build) then `vue-tsc -b --noEmit` over the four project references in `tsconfig.json` (`app`, `server`, `shared`, `node`).

- Run it after editing any `.ts` / `.vue` / `server/**` file. It is the only way to catch type errors without running the app.
- `typescript` is intentionally pinned to **5.9.x**. The hoisted `typescript@7` is the native (Go) compiler and ships no `lib/tsc` / `lib/typescript.js`, so `vue-tsc` crashes with `ERR_PACKAGE_PATH_NOT_EXPORTED`. Do not bump `typescript` to 7 unless you switch `nuxt typecheck` to the `golar` checker.
- A typecheck run currently fails with a **pre-existing baseline** of ~35 errors (spread over admin/koordinator pages, `server/api/upload`, `server/api/dashboard`, `server/utils/googleDrive`, `nuxt.config.ts`). Some are real bugs: the admin pages statically import `~/components/admin/*Modal.vue` components that do not exist. Do not treat a red typecheck as caused by your change — compare against `git stash` if unsure.

## Database & migrations — read before changing schema

`server/utils/migrate.ts` is the single source of truth. It is a plain script, **not** a migration framework:

- Statements are `CREATE TABLE IF NOT EXISTS` only. Editing an existing table's columns does **nothing** to existing DBs — there is no `ALTER`/version tracking. Schema changes on an existing DB require a manual migration or `migrate:fresh`.
- `migrate:fresh` **drops all tables and all data**, then re-seeds. Never run it without explicit instruction.
- Seeds only insert when the table is empty (`countTable(...) > 0` early-returns). Seeded admin: `admin@example.com` / `admin123`.
- Migrate scripts read `process.env.NUXT_TURSO_URL` directly (via `dotenv/config`); the running server uses `useRuntimeConfig()`. Default with no env is `file:.data/local.db` (gitignored).
- `SCHEMA_SQL` is split naively on `;` — avoid semicolons inside column defaults/expressions.
- When adding a query, use the `@libsql/client` positional API (`db.execute({ sql, args })`), never string interpolation for values.

## Auth architecture (non-obvious)

- Session cookie name is `sid` (`server/utils/session.ts`), httpOnly, backed by the `sessions` table. Token is stored in DB, not signed.
- `server/middleware/auth.ts` runs on **all `/api/**`** routes and populates `event.context.auth` = `{ sessionId, userId, nama, email, role, status, regionId }`. Only `/api/auth/login`, `/api/auth/google*`, `/api/panduan*`, `/api/whatsapp/webhook*` are exempt. Add new public endpoints to that exempt list.
- **Role authorization is enforced server-side only for activities, comments, and dashboard.** `users`, `regions`, `categories` CRUD endpoints do **not** check `auth.role` — they rely on the client-side route middleware (`app/middleware/auth.global.ts`). Treat this as a known gap when touching admin APIs.
- Client-side gating is by URL prefix: `/admin`, `/koordinator`, `/anggota`, `/kepala` must match the user's `role`. Pages live under matching `app/pages/<role>/` dirs.
- SSR data fetching must forward the cookie: `$fetch(url, { headers: useRequestHeaders(['cookie']) })` (see `app/composables/useAuth.ts`).

## Layout / conventions

- `app/` is the Nuxt 4 srcDir. Root `lib/` is **not** auto-imported — server files import it with a relative path (`../../../lib/validations`). Shared zod schemas live in `lib/validations.ts`.
- `tutorial/` contains the original step-by-step build plan (`plan.md` + `step-01..16.md`); useful for intent/history, but trust code over it when they disagree.
- i18n: `app/locales/id.json` (default) + `en.json`, consumed by the custom `app/composables/useI18n.ts`. Add keys to both files.
- Nuxt UI v4 with primary color `green` (`app/app.config.ts`). Icons are lucide + simple-icons, bundled server-side.
- Upload limit is 2MB (`runtimeConfig.public.uploadMaxSize`); Nitro body size is 25MB.

## Traps / stale files

- **`assets/css/main.css` (repo root) is dead.** `nuxt.config.ts` points at `~/assets/css/main.css`, which resolves to `app/assets/css/main.css`. Edit the `app/` one.
- `app/layouts/default.vue.bak` is an unused backup.
- `app/composables/useOfflineSync.ts` is unused and broken on the client: it calls the server-only `useDb()`. Don't copy its pattern; offline sync should go through `/api/sync/*`.
- `server/api/export/pdf.post.ts` does not generate a PDF — it returns a URL to `/kepala/export/preview`, which is print-friendly HTML (`window.print`).
