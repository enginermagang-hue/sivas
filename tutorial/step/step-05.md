# Step 05 — Master Data: Categories (Admin)

## Tujuan
Implementasi CRUD kategori aktivitas untuk admin.

## Langkah

### 1. Setup validasi Zod
Tambahkan schema di `lib/validations.ts`:
- `categoryCreateSchema`: nama, warna (opsional), icon (opsional)
- `categoryUpdateSchema`: nama, warna, icon

### 2. Implementasi API Categories

#### `server/api/categories/index.get.ts`
- Gunakan middleware `auth.ts`
- Query: `SELECT * FROM categories ORDER BY nama ASC`
- Return list categories

#### `server/api/categories/index.post.ts`
- Gunakan middleware `auth.ts`
- Cek role admin
- Read validated body dengan `categoryCreateSchema.parse`
- Insert ke tabel categories
- Return category baru

#### `server/api/categories/[id].get.ts`
- Gunakan middleware `auth.ts`
- Query category by id
- Jika tidak found, throw 404
- Return category

#### `server/api/categories/[id].put.ts`
- Gunakan middleware `auth.ts`
- Cek role admin
- Read validated body dengan `categoryUpdateSchema.parse`
- Update category by id
- Return updated category

#### `server/api/categories/[id].delete.ts`
- Gunakan middleware `auth.ts`
- Cek role admin
- Cek apakah ada activities yang menggunakan category ini
- Jika ada, throw 400 `Kategori masih digunakan`
- Delete category
- Return `{ success: true }`

### 3. Build halaman `admin/categories/index.vue`
- List categories dalam tabel (`UTable`)
- Kolom: Nama, Warna (badge dengan warna), Icon, Aksi
- Tombol "Tambah Kategori" buka dialog form
- Form: nama (input), warna (UInput type color atau input text), icon (opsional)
- Aksi: Edit, Delete
- Fetch data dari `/api/categories`
- Mutate dengan POST/PUT/DELETE

### 4. Seed kategori default
Pastikan `migrate.ts` atau seed script insert kategori default:
- `Pertemuan` (warna: `#3B82F6`)
- `Lapangan` (warna: `#10B981`)
- `Administrasi` (warna: `#F59E0B`)
- `Lainnya` (warna: `#6B7280`)

### 5. Test
- Login sebagai admin
- Akses `/admin/categories`, test CRUD categories
- Test tambah kategori baru
- Test edit warna kategori
- Test delete kategori yang tidak digunakan
- Test delete kategori yang digunakan (harus error)

## Output yang Diharapkan
- Admin bisa kelola kategori aktivitas
- Kategori default sudah tersedia
- Delete kategori yang sedang digunakan diblokir

## Troubleshooting
- Jika error warna tidak valid, validasi format warna hex di Zod schema
- Jika delete gagal karena constraint, cek relasi dengan tabel activities

## Langkah Berikutnya
Lanjut ke [Step 06 — Google Drive Service Account](./step-06.md)
