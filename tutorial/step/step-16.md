# Step 16 — Deploy ke Vercel

## Tujuan
Deploy aplikasi ke Vercel dan setup environment variables.

## Langkah

### 1. Setup `vercel.json`
Pastikan file `vercel.json` ada dengan konfigurasi:
```json
{
  "buildCommand": "nuxt build",
  "functions": {
    "api/**": {
      "maxDuration": 60
    }
  },
  "crons": [
    {
      "path": "/api/cron/cleanup-sessions",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### 2. Setup Environment Variables di Vercel
- Buka Vercel Dashboard → Project → Settings → Environment Variables
- Tambah semua env variables:

#### Production:
```
NUXT_TURSO_URL=libsql://your-production-db.turso.io
NUXT_TURSO_AUTH_TOKEN=your-production-turso-token
NUXT_SESSION_SECRET=<generate-random-32-chars>
NUXT_SESSION_MAX_AGE=86400
NUXT_GOOGLE_DRIVE_SERVICE_ACCOUNT={"type":"service_account",...}
NUXT_APP_URL=https://your-app.vercel.app
NUXT_PUBLIC_APP_NAME=Aktivitas Harian
NUXT_UPLOAD_MAX_SIZE=2097152
```

#### Development (jika perlu):
```
NUXT_TURSO_URL=libsql://your-dev-db.turso.io
NUXT_TURSO_AUTH_TOKEN=your-dev-turso-token
NUXT_APP_URL=http://localhost:3000
```

### 3. Jalankan migrasi di Turso Production
- Pastikan skema database sudah dijalankan di Turso production
- Jalankan `npm run migrate` dengan `NUXT_TURSO_URL` production
- Seed data admin awal

### 4. Deploy ke Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Atau connect repository GitHub ke Vercel untuk auto-deploy.

### 5. Post-Deployment Checklist

#### Verifikasi Deployment
- [ ] Aplikasi bisa diakses di Vercel URL
- [ ] HTTPS bekerja (Vercel auto SSL)
- [ ] Halaman login tampil
- [ ] Database koneksi berhasil

#### Test Login
- [ ] Login dengan admin berhasil
- [ ] Session cookie ter-set
- [ ] Dashboard redirect sesuai role

#### Test Fitur
- [ ] CRUD users berfungsi
- [ ] Upload file kecil berfungsi
- [ ] Export Excel berfungsi
- [ ] Export PDF berfungsi
- [ ] Komentar berfungsi
- [ ] Notifikasi berfungsi

#### Test Performance
- [ ] Page load time acceptable (< 3 detik)
- [ ] API response time acceptable (< 1 detik)
- [ ] Upload file bekerja

### 6. Setup Custom Domain (Opsional)
- Vercel Dashboard → Project → Settings → Domains
- Add custom domain (misal: `aktivitas.domain.com`)
- Update DNS sesuai instruksi Vercel
- Update `NUXT_APP_URL` ke custom domain

### 7. Setup Monitoring (Opsional)
- Vercel Analytics untuk monitor traffic
- Vercel Speed Insights untuk monitor performance
- Setup error reporting (misal Sentry)

### 8. Backup Strategy
- Setup backup otomatis untuk Turso database
- Export data secara berkala
- Dokumentasi recovery procedure

### 9. Dokumentasi
- Dokumentasi cara akses aplikasi
- Dokumentasi role dan akses
- Dokumentasi troubleshooting umum
- Dokumentasi cara update aplikasi

## Output yang Diharapkan
- Aplikasi live di Vercel
- Semua fitur berfungsi di production
- Environment variables aman
- Monitoring aktif

## Troubleshooting
- Jika build error, cek build logs di Vercel
- Jika runtime error, cek function logs di Vercel
- Jika database error, cek Turso connection
- Jika upload error, cek Google Drive service account
- Jika timeout, naikkan `maxDuration` di `vercel.json`

## Catatan Penting
- Jangan commit `.env` ke git
- Jangan commit service account JSON ke git
- Selalu test di staging sebelum production
- Monitor logs setelah deploy untuk catch error awal

## Langkah Berikutnya
Aplikasi sudah siap digunakan! Dokumentasikan cara penggunaan untuk user.
