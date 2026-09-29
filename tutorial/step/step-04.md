# Step 04 — Master Data: Users & Regions (Admin)

## Tujuan
Implementasi CRUD users dan regions untuk admin, beserta halaman admin.

## Langkah

### 1. Setup validasi Zod
Tambahkan schema di `lib/validations.ts`:
- `userCreateSchema`: nama, email, password, role, region_id (nullable untuk admin/kepala)
- `userUpdateSchema`: nama, email, role, region_id, status, password (optional)
- `regionCreateSchema`: nama, kode
- `regionUpdateSchema`: nama, kode

### 2. Implementasi API Users

#### `server/api/users/index.get.ts`
- Gunakan middleware `auth.ts`
- Cek role admin (throw 403 jika bukan)
- Query: `SELECT * FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC`
- Return list users (exclude `password_hash`)

#### `server/api/users/index.post.ts`
- Gunakan middleware `auth.ts`
- Cek role admin
- Read validated body dengan `userCreateSchema.parse`
- Hash password dengan `bcrypt.hash(password, 10)`
- Insert ke tabel users
- Return user baru (exclude password_hash)

#### `server/api/users/[id].get.ts`
- Gunakan middleware `auth.ts`
- Cek role admin
- Query user by id where `deleted_at IS NULL`
- Jika tidak found, throw 404
- Return user (exclude password_hash)

#### `server/api/users/[id].put.ts`
- Gunakan middleware `auth.ts`
- Cek role admin
- Read validated body dengan `userUpdateSchema.parse`
- Jika password diisi, hash dengan bcrypt
- Update user by id
- Return updated user (exclude password_hash)

#### `server/api/users/[id].delete.ts`
- Gunakan middleware `auth.ts`
- Cek role admin
- Soft delete: set `deleted_at = datetime('now')`
- Return `{ success: true }`

### 3. Implementasi API Regions

#### `server/api/regions/index.get.ts`
- Gunakan middleware `auth.ts`
- Query: `SELECT * FROM regions ORDER BY nama ASC`
- Return list regions

#### `server/api/regions/index.post.ts`
- Gunakan middleware `auth.ts`
- Cek role admin
- Read validated body dengan `regionCreateSchema.parse`
- Insert ke tabel regions
- Return region baru

#### `server/api/regions/[id].get.ts`
- Gunakan middleware `auth.ts`
- Query region by id
- Jika tidak found, throw 404
- Return region

#### `server/api/regions/[id].put.ts`
- Gunakan middleware `auth.ts`
- Cek role admin
- Read validated body dengan `regionUpdateSchema.parse`
- Update region by id
- Return updated region

#### `server/api/regions/[id].delete.ts`
- Gunakan middleware `auth.ts`
- Cek role admin
- Hapus region (cek apakah ada users/activities yang menggunakan region ini)
- Jika ada, throw 400 `Region masih digunakan`
- Delete region
- Return `{ success: true }`

### 4. Build halaman `admin/users/index.vue`
- List users dalam tabel (`UTable`)
- Kolom: Nama, Email, Role, Wilayah, Status, Aksi
- Tombol "Tambah User" buka dialog form
- Form: nama, email, password, role (select), wilayah (USelect, nullable untuk admin/kepala), status (USelect)
- Aksi: Edit (buka dialog dengan data existing), Delete (konfirmasi dengan ConfirmDialog)
- Fetch data dari `/api/users`
- Mutate dengan POST/PUT/DELETE
- Refresh list setelah mutate

### 5. Build halaman `admin/regions/index.vue`
- List regions dalam tabel
- Kolom: Nama, Kode, Aksi
- Tombol "Tambah Wilayah" buka dialog form
- Form: nama, kode
- Aksi: Edit, Delete
- Fetch data dari `/api/regions`
- Mutate dengan POST/PUT/DELETE

### 6. Tambah middleware guard admin
Pastikan `auth.global.ts` sudah guard `/admin/*` untuk role admin.

### 7. Seed data testing
- Seed beberapa koordinator dengan region_id terisi
- Seed beberapa anggota dengan region_id terisi
- Seed kepala dengan region_id NULL

### 8. Test
- Login sebagai admin
- Akses `/admin/users`, test CRUD users
- Akses `/admin/regions`, test CRUD regions
- Test assign wilayah ke koordinator dan anggota
- Test assign role kepala (region_id NULL)
- Coba akses sebagai non-admin, harus di-redirect atau 403

## Output yang Diharapkan
- Admin bisa kelola users (create, read, update, delete)
- Admin bisa kelola regions (create, read, update, delete)
- Assign wilayah dan role berhasil
- Non-admin tidak bisa akses halaman admin

## Troubleshooting
- Jika error foreign key saat delete region, pastikan tidak ada users/activities yang reference ke region tersebut
- Jika email duplicate, cek constraint UNIQUE di database

## Langkah Berikutnya
Lanjut ke [Step 05 — Master Data: Categories (Admin)](./step-05.md)
