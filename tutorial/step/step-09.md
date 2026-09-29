# Step 09 — Koordinator: Members Page

## Tujuan
Build halaman daftar anggota wilayah untuk koordinator.

## Langkah

### 1. Implementasi API Members (opsional, bisa reuse users API)
Tidak perlu API baru, cukup reuse `/api/users` dengan filter:
- Query params: `region_id=my_region&role=anggota`
- Atau buat dedicated endpoint: `server/api/members/index.get.ts`

Jika buat dedicated endpoint:
- Gunakan middleware `auth.ts`
- Cek role koordinator (throw 403 jika bukan)
- Query users where `region_id = koordinator_region_id` dan `role = 'anggota'`
- Return list anggota dengan: id, nama, email, status, jumlah aktivitas

### 2. Build halaman `koordinator/members/index.vue`
- Middleware guard: hanya koordinator yang bisa akses
- Fetch daftar anggota di wilayah koordinator
- Tampilkan dalam `UTable`:
  - Kolom: Nama, Email, Status, Jumlah Aktivitas, Aksi
- Aksi:
  - "Lihat Aktivitas" → navigate ke `/koordinator/activities?user_id=xxx`
  - "Input Aktivitas" → navigate ke `/koordinator/input?user_id=xxx`
- Tampilkan jumlah anggota aktif/nonaktif
- Jika tidak ada anggota, tampilkan empty state

### 3. Tambah statistik jumlah aktivitas per anggota
- Query: `SELECT user_id, COUNT(*) as total FROM activities WHERE region_id = ? AND deleted_at IS NULL GROUP BY user_id`
- Tampilkan di tabel sebagai kolom "Jumlah Aktivitas"

### 4. Filter dan pencarian (opsional)
- Tambah search by nama/email
- Tambah filter by status (active/inactive)

### 5. Test
- Login sebagai koordinator
- Akses `/koordinator/members`
- Cek daftar anggota tampil sesuai wilayah
- Test navigasi ke aktivitas anggota
- Test input aktivitas untuk anggota
- Login sebagai non-koordinator, coba akses → harus 403

## Output yang Diharapkan
- Koordinator bisa melihat daftar anggota di wilayahnya
- Koordinator bisa navigasi ke aktivitas dan input aktivitas per anggota
- Non-koordinator tidak bisa akses halaman ini

## Troubleshooting
- Jika daftar anggota kosong, cek region_id koordinator dan data seed
- Jika akses ditolak, cek middleware guard

## Langkah Berikutnya
Lanjut ke [Step 10 — Kepala: Lihat Semua Aktivitas](./step-10.md)
