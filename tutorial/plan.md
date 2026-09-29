# PLAN.md — Aplikasi Aktivitas Harian

## 1. Ringkasan
Aplikasi web pencatatan aktivitas harian dengan:
- 4 role: admin, koordinator wilayah, anggota wilayah, kepala
- Aktivitas harian: deskripsi, kategori, jam mulai-selesai, lampiran foto/dokumen
- Koordinator hanya melihat aktivitas anggotanya di wilayahnya
- Anggota hanya melihat aktivitasnya sendiri
- Kepala melihat semua aktivitas semua wilayah + export laporan Excel/PDF
- Database: Turso (SQLite via @libsql/client)
- File storage: Google Drive API (Service Account)
- Hosting: Vercel

## 2. Stack
- Nuxt 4 (Vue 3 + Nitro) — frontend & API satu repo
- Nuxt UI v4 + Tailwind CSS v4
- @libsql/client (Turso)
- Google Drive API (Service Account, server-side only)
- zod (validasi), bcryptjs (hash password)
- exceljs (export Excel); PDF via halaman print-friendly (window.print)
- @vueuse/core (PWA/offline)
- Package manager: npm | Hosting: Vercel

## 3. Keputusan Desain
- Auth: session cookie httpOnly (`sid`) + tabel `sessions` (bukan JWT)
- Role: admin | koordinator | anggota | kepala
- Admin & Kepala: tidak terikat wilayah (region_id NULL) — akses global
- Koordinator & Anggota: terikat wilayah (region_id terisi)
- Wilayah: master data statis, dibuat/ditambahkan oleh admin
- Kategori aktivitas: master data, ditambahkan oleh admin
- Semua operasi Turso & Google Drive hanya dari server (Nitro)
- File di Google Drive disimpan per activity dalam folder terpisah
- Soft delete: kolom `deleted_at` di tabel users & activities
- Notifikasi in-app untuk komentar baru pada aktivitas
- PWA: bisa input aktivitas offline (simpan lokal, sync saat online)
- Multi-language: Indonesia (default) + Inggris

## 4. Struktur Folder (Nuxt 4)
```
├── nuxt.config.ts
├── vercel.json
├── app/
│   ├── app.config.ts
│   ├── app.vue
│   ├── assets/css/main.css
│   ├── layouts/default.vue
│   ├── middleware/
│   │   └── auth.global.ts
│   ├── pages/
│   │   ├── login.vue
│   │   ├── dashboard.vue
│   │   ├── admin/
│   │   │   ├── users/
│   │   │   │   ├── index.vue
│   │   │   │   └── [id].vue
│   │   │   ├── regions/
│   │   │   │   ├── index.vue
│   │   │   │   └── [id].vue
│   │   │   └── categories/
│   │   │       ├── index.vue
│   │   │       └── [id].vue
│   │   ├── koordinator/
│   │   │   ├── members/
│   │   │   │   └── index.vue
│   │   │   ├── activities/
│   │   │   │   └── index.vue
│   │   │   └── input/
│   │   │       ├── index.vue
│   │   │       └── [id].vue
│   │   ├── anggota/
│   │   │   ├── activities/
│   │   │   │   └── index.vue
│   │   │   └── input/
│   │   │       ├── index.vue
│   │   │       └── [id].vue
│   │   └── kepala/
│   │       ├── dashboard.vue
│   │       ├── activities/
│   │       │   └── index.vue
│   │       └── export/
│   │           ├── index.vue
│   │           └── preview.vue
│   ├── components/
│   │   ├── ActivityForm.vue
│   │   ├── ActivityCard.vue
│   │   ├── ActivityDetail.vue
│   │   ├── FileUpload.vue
│   │   ├── CommentSection.vue
│   │   ├── RegionSelect.vue
│   │   ├── CategorySelect.vue
│   │   ├── TimeInput.vue
│   │   ├── AppSidebar.vue
│   │   ├── ConfirmDialog.vue
│   │   ├── DashboardCard.vue
│   │   ├── ExportButton.vue
│   │   ├── NotificationBell.vue
│   │   └── LanguageSwitcher.vue
│   └── composables/
│       ├── useAuth.ts
│       ├── useRegions.ts
│       ├── useActivities.ts
│       ├── useNotifications.ts
│       ├── useOfflineSync.ts
│       └── useI18n.ts
├── server/
│   ├── utils/
│   │   ├── db.ts
│   │   ├── session.ts
│   │   ├── googleDrive.ts
│   │   ├── logger.ts
│   │   └── migrate.ts
│   ├── middleware/
│   │   └── auth.ts
│   └── api/
│       ├── auth/
│       │   ├── login.post.ts
│       │   ├── logout.post.ts
│       │   └── me.get.ts
│       ├── users/
│       │   ├── index.get.ts
│       │   ├── index.post.ts
│       │   ├── [id].get.ts
│       │   ├── [id].put.ts
│       │   └── [id].delete.ts
│       ├── regions/
│       │   ├── index.get.ts
│       │   ├── index.post.ts
│       │   ├── [id].get.ts
│       │   ├── [id].put.ts
│       │   └── [id].delete.ts
│       ├── categories/
│       │   ├── index.get.ts
│       │   ├── index.post.ts
│       │   ├── [id].get.ts
│       │   ├── [id].put.ts
│       │   └── [id].delete.ts
│       ├── activities/
│       │   ├── index.get.ts
│       │   ├── index.post.ts
│       │   ├── [id].get.ts
│       │   ├── [id].put.ts
│       │   └── [id].delete.ts
│       ├── comments/
│       │   ├── index.post.ts
│       │   └── [id].delete.ts
│       ├── notifications/
│       │   ├── index.get.ts
│       │   └── read.post.ts
│       ├── upload/
│       │   └── index.post.ts
│       ├── export/
│       │   ├── excel.post.ts
│       │   └── pdf.post.ts
│       └── sync/
│           ├── pending.get.ts
│           └── submit.post.ts
└── lib/
    └─ validations.ts
```

## 5. Skema Database (Turso/SQLite)

```sql
-- Users: 4 role
-- Admin & Kepala: region_id NULL (akses global)
-- Koordinator & Anggota: region_id terisi
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nama TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','koordinator','anggota','kepala')),
  region_id INTEGER NULL REFERENCES regions(id),
  status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive')),
  last_login DATETIME,
  deleted_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Wilayah (master data, dibuat/ditambahkan oleh admin)
CREATE TABLE regions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  kode TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Kategori aktivitas (master data, dibuat/ditambahkan oleh admin)
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  warna TEXT DEFAULT '#3B82F6',
  icon TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Aktivitas harian
CREATE TABLE activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  region_id INTEGER NOT NULL REFERENCES regions(id),
  kategori_id INTEGER NOT NULL REFERENCES categories(id),
  tanggal DATE NOT NULL,
  jam_mulai TIME,
  jam_selesai TIME,
  deskripsi TEXT NOT NULL,
  deleted_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Lampiran file (disimpan di Google Drive)
CREATE TABLE activity_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  nama_file TEXT NOT NULL,
  drive_file_id TEXT NOT NULL,
  url_file TEXT,
  tipe_mime TEXT,
  ukuran_bytes INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Komentar pada aktivitas
CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  komentar TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notifikasi
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id INTEGER,
  `read` INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Offline sync queue
CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  payload JSON NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','synced','failed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  synced_at DATETIME NULL
);

-- Sessions
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  last_active DATETIME,
  revoked INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Activity log
CREATE TABLE activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id INTEGER,
  detail JSON,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 6. Auth & Session Manager
- Login: email + password (bcrypt.compare)
- Session token: crypto.randomUUID(), disimpan di cookie `sid` httpOnly
- Nitro middleware: cek session belum expired & revoked=0 untuk API terproteksi
- Session Manager: list sesi (user, IP, UA, last_active) + revoke (set revoked=1 + hapus cookie client)
- Middleware role-based: guard pages di client, guard API di server

## 7. Google Drive (Service Account)
- Service Account JSON disimpan di env `NUXT_GOOGLE_DRIVE_SERVICE_ACCOUNT` (string JSON)
- Upload kecil (≤ 2MB): server upload ke Drive API
- Upload besar (> 2MB): buat signed URL dari server → client upload langsung ke Drive → return file ID ke server
- Download/Preview: server fetch dari Drive, stream ke client
- Folder structure di Drive: `/Aktivitas-Harian/[activity-id]/[nama-file]`
- Metadata file (nama, drive_file_id, tipe, ukuran) disimpan di Turso

### Langkah Membuat Google Drive Service Account
1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih project yang ada
3. Enable **Google Drive API**:
   - Menu **APIs & Services** → **Library**
   - Cari "Google Drive API" → klik **Enable**
4. Buat Service Account:
   - Menu **APIs & Services** → **Credentials**
   - Klik **Create Credentials** → **Service Account**
   - Isi nama service account (misal: `aktivitas-harian-upload`)
   - Klik **Create and Continue**
   - Role: pilih **Project** → **Editor** (atau minimal **Drive File** untuk akses Drive)
   - Klik **Done**
5. Buat JSON Key:
   - Klik service account yang baru dibuat
   - Tab **Keys** → **Add Key** → **Create new key**
   - Pilih format **JSON** → klik **Create**
   - File JSON akan terdownload, simpan dengan aman
6. Buat Folder di Google Drive:
   - Buat folder baru di Google Drive (misal: `Aktivitas-Harian`)
   - Klik kanan folder → **Share**
   - Masukkan email service account dari JSON key (misal: `aktivitas-harian-upload@project.iam.gserviceaccount.com`)
   - Beri akses **Editor**
7. Simpan JSON key ke Vercel Environment Variables:
   - Buka file JSON, copy seluruh isinya
   - Di Vercel Dashboard → Settings → Environment Variables
   - Tambah variable: `NUXT_GOOGLE_DRIVE_SERVICE_ACCOUNT`
   - Paste JSON string sebagai value
8. Setelah deploy ke Vercel, test upload file untuk memastikan service account bekerja

## 8. Fitur per Role

### Admin
- Kelola users (CRUD + assign role + assign wilayah)
- Kelola wilayah (CRUD)
- Kelola kategori aktivitas (CRUD)
- Lihat semua aktivitas (read-only)
- Komentar pada aktivitas
- Notifikasi komentar baru

### Koordinator Wilayah
- Lihat daftar anggota di wilayahnya
- Input aktivitas untuk anggota di wilayahnya
- Lihat semua aktivitas di wilayahnya
- Komentar pada aktivitas
- Notifikasi komentar baru

### Anggota Wilayah
- Input aktivitas untuk diri sendiri
- Lihat aktivitasnya sendiri
- Komentar pada aktivitasnya
- Notifikasi komentar baru

### Kepala
- Lihat semua aktivitas semua wilayah
- Filter by tanggal, wilayah, kategori
- Export laporan Excel
- Export laporan PDF (print-friendly)
- Komentar pada aktivitas
- Notifikasi komentar baru

## 9. Environment Variables

```env
# Turso
NUXT_TURSO_URL=libsql://your-db.turso.io
NUXT_TURSO_AUTH_TOKEN=your-turso-token

# Session
NUXT_SESSION_SECRET=change-me-32chars
NUXT_SESSION_MAX_AGE=86400

# Google Drive (Service Account JSON string)
NUXT_GOOGLE_DRIVE_SERVICE_ACCOUNT={"type":"service_account",...}

# App
NUXT_APP_URL=http://localhost:3000
NUXT_PUBLIC_APP_NAME=Aktivitas Harian

# Upload
NUXT_UPLOAD_MAX_SIZE=2097152  # 2MB dalam bytes
```

## 10. Vercel
- Preset Nuxt auto-detect
- vercel.json: `{ "buildCommand": "nuxt build", "functions": { "api/**": { "maxDuration": 60 } } }`
- Set env di Vercel Dashboard (jangan commit .env)
- Naikkan body size Nitro untuk upload kecil: `nitro: { bodySize: '25MB' }`
- Upload besar (> 2MB) menggunakan Google Drive direct upload (signed URL) untuk menghindari Vercel timeout

## 11. Fitur Tambahan

### Notifikasi
- Notifikasi in-app saat ada komentar baru pada aktivitas yang diikuti user
- Bell icon di navbar dengan count unread notifications
- Mark as read saat dibuka
- API: `/api/notifications` (GET list + POST mark read)

### Offline Mode (PWA)
- Input aktivitas bisa dilakukan offline (disimpan di IndexedDB/localStorage)
- Sync otomatis saat koneksi online
- Indikator status online/offline di UI
- API sync: `/api/sync/pending` (GET) + `/api/sync/submit` (POST)

### Multi-Language (i18n)
- Bahasa default: Indonesia
- Bahasa tambahan: Inggris
- Language switcher di navbar
- Terjemahan untuk: menu, form labels, tombol, pesan error, notifikasi
- Gunakan `@nuxtjs/i18n` module atau custom composable `useI18n`

## 12. Urutan Implementasi
1. `npm create nuxt@latest` (TypeScript + ESLint)
2. `npm i @nuxt/ui @libsql/client zod bcryptjs exceljs googleapis chart.js vue-chartjs @vueuse/core`
3. Config: `nuxt.config.ts`, `vercel.json`, `.env.example`, `main.css`
4. `server/utils/db.ts` + `migrate.ts` (skema + seed admin + seed wilayah + seed kategori) + jalankan migrasi
5. `server/utils/session.ts` + `logger.ts`
6. Auth API (`login`, `logout`, `me`) + Nitro guard + `useAuth` + login page + layout
7. Setup Google Drive Service Account + test upload kecil
8. API upload (kecil ≤ 2MB) + signed URL upload (besar > 2MB)
9. API users, regions, categories + halaman admin (users + regions + categories)
10. API activities + comments + upload + halaman aktivitas per role
11. Notifikasi API + UI (NotificationBell)
12. Offline mode setup (PWA + IndexedDB + sync)
13. Multi-language setup (i18n)
14. API export Excel + PDF + halaman export kepala
15. Dashboard + chart per role
16. Testing + Vercel deploy

## 12a. Langkah-Langkah Detail
Setiap langkah di atas dipecah menjadi panduan langkah demi langkah di:
- `tutorial/step/step-01.md` — Inisialisasi Project
- `tutorial/step/step-02.md` — Konfigurasi Database Turso
- `tutorial/step/step-03.md` — Session & Auth API
- `tutorial/step/step-04.md` — Master Data: Users & Regions (Admin)
- `tutorial/step/step-05.md` — Master Data: Categories (Admin)
- `tutorial/step/step-06.md` — Google Drive Service Account
- `tutorial/step/step-07.md` — Aktivitas: Input & List (Anggota & Koordinator)
- `tutorial/step/step-08.md` — Komentar & Notifikasi
- `tutorial/step/step-09.md` — Koordinator: Members Page
- `tutorial/step/step-10.md` — Kepala: Lihat Semua Aktivitas
- `tutorial/step/step-11.md` — Export Excel & PDF
- `tutorial/step/step-12.md` — Dashboard & Charts
- `tutorial/step/step-13.md` — Offline Mode & PWA
- `tutorial/step/step-14.md` — Multi-Language (i18n)
- `tutorial/step/step-15.md` — Final Polish & Testing
- `tutorial/step/step-16.md` — Deploy ke Vercel

Ikuti langkah dari `step-01.md` sampai `step-16.md` secara berurutan untuk implementasi lengkap.

## 13. Catatan Keamanan
- Session token random 32 chars, httpOnly cookie
- Password hash bcrypt (rounds 10)
- Semua upload/download file lewat server (tidak expose Google Drive credential)
- Upload besar menggunakan signed URL (client upload langsung ke Drive, tidak melalui server)
- API guard: cek session + role + region_id
- Input validation dengan zod di semua endpoint
- Soft delete untuk users & activities (tidak hard delete)
- Service Account JSON hanya disimpan di environment variables, tidak di codebase
