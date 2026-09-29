# Step 10 — Kepala: Lihat Semua Aktivitas

## Tujuan
Build halaman aktivitas untuk kepala dengan filter dan akses ke semua wilayah.

## Langkah

### 1. Implementasi filter activities untuk kepala
Pastikan API `activities/index.get.ts` sudah support:
- Filter by `tanggal` (range: `tanggal_dari`, `tanggal_sampai`)
- Filter by `region_id`
- Filter by `kategori_id`
- Filter by `user_id`
- Pagination (opsional): `page`, `limit`

### 2. Build halaman `kepala/activities/index.vue`
- Middleware guard: hanya kepala yang bisa akses
- Tampilkan filter form di atas:
  - Tanggal dari - sampai (`UInput` type date)
  - Wilayah (`USelect` dengan options dari `/api/regions`)
  - Kategori (`USelect` dengan options dari `/api/categories`)
  - Tombol "Filter" dan "Reset"
- Fetch activities dengan query params sesuai filter
- Tampilkan results dalam `ActivityCard.vue` grid
- Tampilkan total results count
- Jika tidak ada results, tampilkan empty state

### 3. Build Component `ActivityDetail.vue`
Component untuk detail aktivitas:
- Props: `activityId`
- Fetch detail activity dari `/api/activities/[id]`
- Tampilkan:
  - Info user (nama, wilayah, role)
  - Tanggal, kategori, jam mulai-selesai
  - Deskripsi lengkap
  - Lampiran files (list dengan link download/preview)
  - Komentar (`CommentSection.vue`)
- Tambah button "Export" untuk export activity ini (opsional)

### 4. Build halaman `kepala/dashboard.vue` (opsional)
- Tampilkan ringkasan:
  - Total aktivitas hari ini
  - Total aktivitas minggu ini
  - Aktivitas per wilayah (chart)
  - Aktivitas per kategori (chart)
- Gunakan `DashboardCard.vue` + Chart.js

### 5. Integrasi `ActivityDetail.vue`
- Tambah route `kepala/activities/[id].vue`
- Tampilkan `ActivityDetail.vue`
- Tambah tombol "Kembali" ke list

### 6. Test
- Login sebagai kepala
- Akses `/kepala/activities`
- Test filter by tanggal, wilayah, kategori
- Test lihat detail aktivitas
- Test lihat komentar
- Test lihat lampiran
- Login sebagai non-kepala, coba akses → harus 403

## Output yang Diharapkan
- Kepala bisa melihat semua aktivitas semua wilayah
- Filter by tanggal, wilayah, kategori berfungsi
- Detail aktivitas tampil lengkap dengan komentar dan lampiran

## Troubleshooting
- Jika filter tidak bekerja, cek query params di API
- Jika akses ditolak, cek role kepala di middleware
- Jika data tidak muncul, cek query JOIN di API

## Langkah Berikutnya
Lanjut ke [Step 11 — Export Excel & PDF](./step-11.md)
