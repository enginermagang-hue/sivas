# Step 02 — Konfigurasi Database Turso

## Tujuan
Setup koneksi Turso, buat tabel database, dan seed data awal.

## Langkah

### 1. Buat database di Turso
- Buka [https://turso.xyz](https://turso.xyz)
- Buat organization baru (jika belum)
- Buat database baru dengan nama `aktivitas-harian`
- Catat **database URL** dan **auth token**
- Contoh URL: `libsql://aktivitas-harian-username.turso.io`

### 2. Setup `server/utils/db.ts`
Buat file `server/utils/db.ts` dengan pattern dari SIPERSA:
- Import `createClient` dari `@libsql/client`
- Buat singleton client
- Gunakan `useRuntimeConfig()` untuk ambil `tursoUrl` dan `tursoAuthToken`
- Jika URL diawali `file:`, gunakan file lokal `.data/local.db` untuk development
- Return client instance

### 3. Setup `server/utils/migrate.ts`
Buat file `server/utils/migrate.ts` untuk:
- Connect ke database
- Jalankan semua SQL CREATE TABLE
- Seed data awal jika tabel kosong

### 4. Buat skema SQL
Jalankan SQL berikut untuk membuat semua tabel:

```sql
CREATE TABLE IF NOT EXISTS users (
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

CREATE TABLE IF NOT EXISTS regions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  kode TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  warna TEXT DEFAULT '#3B82F6',
  icon TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activities (
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

CREATE TABLE IF NOT EXISTS activity_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  nama_file TEXT NOT NULL,
  drive_file_id TEXT NOT NULL,
  url_file TEXT,
  tipe_mime TEXT,
  ukuran_bytes INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  komentar TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id INTEGER,
  `read` INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  payload JSON NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','synced','failed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  synced_at DATETIME NULL
);

CREATE TABLE IF NOT EXISTS sessions (
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

CREATE TABLE IF NOT EXISTS activity_log (
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

### 5. Seed data awal
Tambahkan script seed di `migrate.ts` untuk insert data awal jika tabel kosong:

**Admin:**
- email: `admin@example.com`
- password: `admin123` (hash dengan bcrypt)
- role: `admin`
- region_id: NULL

**Wilayah default:**
- `Wilayah A` (kode: `WIL-A`)
- `Wilayah B` (kode: `WIL-B`)

**Kategori default:**
- `Pertemuan` (warna: `#3B82F6`)
- `Lapangan` (warna: `#10B981`)
- `Administrasi` (warna: `#F59E0B`)
- `Lainnya` (warna: `#6B7280`)

### 6. Jalankan migrasi
Buat script `scripts/migrate.ts` atau `scripts/migrate.mjs` untuk menjalankan migrasi:

```bash
npm run migrate
```

### 7. Verifikasi koneksi
- Cek apakah tabel berhasil dibuat di Turso
- Cek apakah data seed berhasil diinsert
- Test koneksi dari local

## Output yang Diharapkan
- Database Turso berhasil dibuat dengan semua tabel
- Data seed (admin, wilayah, kategori) berhasil diinsert
- Koneksi dari local berhasil

## Troubleshooting
- Jika error koneksi Turso, cek `NUXT_TURSO_URL` dan `NUXT_TURSO_AUTH_TOKEN`
- Jika error table already exists, gunakan `CREATE TABLE IF NOT EXISTS`
- Jika error foreign key, pastikan tabel referenced dibuat terlebih dahulu

## Langkah Berikutnya
Lanjut ke [Step 03 — Session & Auth API](./step-03.md)
