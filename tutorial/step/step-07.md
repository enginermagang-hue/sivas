# Step 07 — Aktivitas: Input & List (Anggota & Koordinator)

## Tujuan
Implementasi form input aktivitas dan list aktivitas untuk anggota dan koordinator.

## Langkah

### 1. Setup validasi Zod
Tambahkan schema di `lib/validations.ts`:
- `activityCreateSchema`: user_id (untuk koordinator input untuk anggota), region_id, kategori_id, tanggal, jam_mulai (nullable), jam_selesai (nullable), deskripsi
- `activityUpdateSchema`: region_id, kategori_id, tanggal, jam_mulai, jam_selesai, deskripsi

### 2. Implementasi API Activities

#### `server/api/activities/index.get.ts`
- Gunakan middleware `auth.ts`
- Filter berdasarkan role:
  - `admin` / `kepala`: lihat semua activities
  - `koordinator`: lihat activities di `region_id` nya
  - `anggota`: lihat activities milik `user_id` nya
- Support query params: `tanggal`, `region_id`, `kategori_id`, `user_id`
- Query dengan JOIN users, regions, categories untuk tampilkan nama
- Order by `tanggal DESC`, `created_at DESC`
- Return list activities dengan relasi

#### `server/api/activities/index.post.ts`
- Gunakan middleware `auth.ts`
- Read validated body dengan `activityCreateSchema.parse`
- Validasi: koordinator hanya bisa create untuk anggota di wilayahnya
- Validasi: anggota hanya bisa create untuk diri sendiri (user_id = own user id)
- Insert ke tabel activities
- Return activity baru

#### `server/api/activities/[id].get.ts`
- Gunakan middleware `auth.ts`
- Query activity by id dengan JOIN users, regions, categories
- Validasi akses: admin/kepala boleh, koordinator hanya milik wilayahnya, anggota hanya miliknya
- Return activity dengan relasi

#### `server/api/activities/[id].put.ts`
- Gunakan middleware `auth.ts`
- Validasi akses: admin/kepala boleh edit semua, koordinator hanya milik wilayahnya, anggota hanya miliknya
- Read validated body
- Update activity by id
- Return updated activity

#### `server/api/activities/[id].delete.ts`
- Gunakan middleware `auth.ts`
- Validasi akses: admin/kepala boleh delete semua, koordinator hanya milik wilayahnya, anggota hanya miliknya
- Soft delete: set `deleted_at = datetime('now')`
- Return `{ success: true }`

### 3. Implementasi API Comments

#### `server/api/comments/index.post.ts`
- Gunakan middleware `auth.ts`
- Body: activity_id, komentar
- Validasi: activity exists dan user punya akses
- Insert komentar
- Insert notification untuk pemilik activity + koordinator wilayah
- Return comment baru

#### `server/api/comments/[id].delete.ts`
- Gunakan middleware `auth.ts`
- Cek comment by id
- Validasi: user adalah pemilik comment atau admin
- Delete comment
- Return `{ success: true }`

### 4. Build Component `ActivityForm.vue`
Component untuk form input/edit aktivitas:
- Props: `activity` (untuk edit), `users` (list anggota untuk koordinator pilih)
- Form fields:
  - Kategori: `USelect` dengan options dari `/api/categories`
  - Tanggal: `UInput` type date
  - Jam Mulai: `UInput` type time (nullable)
  - Jam Selesai: `UInput` type time (nullable)
  - Deskripsi: `UTextarea`
  - Lampiran: gunakan component `FileUpload.vue`
- Submit: panggil API create/update
- Validation: required fields (kategori, tanggal, deskripsi)

### 5. Build Component `FileUpload.vue`
Component untuk upload file:
- Props: `activityId`, `maxSize` (default 2MB)
- State: files, uploading, progress
- Jika file ≤ 2MB: upload via `/api/upload` (server upload ke Drive)
- Jika file > 2MB: generate signed URL dari server, upload langsung ke Drive
- Tampilkan preview file setelah upload
- Tampilkan list files yang sudah upload
- Support delete file

### 6. Build Component `ActivityCard.vue`
Component untuk menampilkan card aktivitas:
- Props: `activity`
- Tampilkan: tanggal, kategori (badge dengan warna), jam mulai-selesai, deskripsi
- Tampilkan jumlah lampiran
- Link ke detail activity
- Tampilkan komentar terakhir (opsional)

### 7. Build halaman `anggota/input/index.vue`
- Form input aktivitas untuk diri sendiri
- Gunakan `ActivityForm.vue`
- Set `user_id` = current user id
- Submit ke `/api/activities` POST
- Redirect ke `/anggota/activities` setelah sukses

### 8. Build halaman `anggota/activities/index.vue`
- List activities milik user sendiri
- Filter by tanggal (opsional)
- Gunakan `ActivityCard.vue` dalam grid
- Fetch dari `/api/activities?user_id=me`

### 9. Build halaman `koordinator/input/index.vue`
- Form input aktivitas untuk anggota
- Select anggota di wilayahnya (`USelect`)
- Gunakan `ActivityForm.vue` dengan prop `users`
- Set `user_id` = selected user id
- Submit ke `/api/activities` POST
- Validasi: hanya anggota di wilayahnya yang bisa dipilih

### 10. Build halaman `koordinator/activities/index.vue`
- List activities di wilayah koordinator
- Filter by tanggal, anggota (opsional)
- Gunakan `ActivityCard.vue`
- Fetch dari `/api/activities?region_id=my_region`

### 11. Test
- Login sebagai anggota
- Test input aktivitas sendiri
- Test lihat aktivitas sendiri
- Login sebagai koordinator
- Test input aktivitas untuk anggota
- Test lihat aktivitas wilayah
- Test upload file kecil dan besar
- Test komentar pada aktivitas

## Output yang Diharapkan
- Anggota bisa input dan melihat aktivitasnya sendiri
- Koordinator bisa input aktivitas untuk anggotanya
- Koordinator bisa melihat semua aktivitas di wilayahnya
- Upload file (kecil dan besar) berhasil
- Komentar bisa ditambahkan

## Troubleshooting
- Jika upload besar gagal, pastikan signed URL diimplementasikan dengan benar
- Jika akses ditolak, cek validasi role dan region_id di API
- Jika komentar tidak muncul, cek relasi activity_id

## Langkah Berikutnya
Lanjut ke [Step 08 — Komentar & Notifikasi](./step-08.md)
