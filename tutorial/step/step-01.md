# Step 01 — Inisialisasi Project

## Tujuan
Membuat project Nuxt 4 baru, install dependencies, dan setup konfigurasi dasar.

## Langkah

### 1. Persiapan environment
- Pastikan Node.js >= 18.x terinstal: `node -v`
- Pastikan npm >= 9.x terinstal: `npm -v`
- Pastikan Git terinstal: `git -v`

### 2. Buat project Nuxt 4
```bash
npx nuxi@latest init aktivitas-harian
cd aktivitas-harian
```

### 3. Install dependencies
```bash
npm install
```

### 4. Install package tambahan
```bash
npm install @nuxt/ui @libsql/client zod bcryptjs exceljs googleapis chart.js vue-chartjs @vueuse/core
npm install -D @types/bcryptjs
```

### 5. Setup `nuxt.config.ts`
Buat file `nuxt.config.ts` dengan konfigurasi:
- modules: `['@nuxt/ui']`
- css: `['~/assets/css/main.css']`
- runtimeConfig: `tursoUrl`, `tursoAuthToken`, `googleDriveServiceAccount`, `sessionSecret`, `sessionMaxAge`, `appUrl`
- nitro: `bodySize: '25MB'`, `routeRules: { '/api/**': { csr: false } }`
- compatibilityDate dan devtools

### 6. Setup `vercel.json`
Buat file `vercel.json`:
```json
{
  "buildCommand": "nuxt build",
  "functions": {
    "api/**": {
      "maxDuration": 60
    }
  }
}
```

### 7. Setup `.env.example`
Buat file `.env.example` dengan semua environment variables yang dibutuhkan:
- `NUXT_TURSO_URL`
- `NUXT_TURSO_AUTH_TOKEN`
- `NUXT_SESSION_SECRET`
- `NUXT_SESSION_MAX_AGE`
- `NUXT_GOOGLE_DRIVE_SERVICE_ACCOUNT`
- `NUXT_APP_URL`
- `NUXT_PUBLIC_APP_NAME`

### 8. Setup CSS
Buat `app/assets/css/main.css` dengan import Tailwind CSS dan Nuxt UI.

### 9. Commit awal
```bash
git add .
git commit -m "feat: init project nuxt 4 + dependencies"
```

## Output yang Diharapkan
- Project Nuxt 4 berjalan di `http://localhost:3000`
- Halaman default Nuxt tampil
- Semua dependencies terinstal tanpa error
- File konfigurasi dasar sudah ada

## Troubleshooting
- Jika ada error Tailwind CSS v4, pastikan menggunakan syntax `@import "tailwindcss";` di `main.css`
- Jika error module, coba hapus `node_modules` dan `package-lock.json` lalu `npm install` ulang

## Langkah Berikutnya
Lanjut ke [Step 02 — Konfigurasi Database Turso](./step-02.md)
