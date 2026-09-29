# Step 11 — Export Excel & PDF

## Tujuan
Implementasi export laporan aktivitas ke Excel dan PDF (print-friendly).

## Langkah

### 1. Implementasi API Export Excel

#### `server/api/export/excel.post.ts`
- Gunakan middleware `auth.ts`
- Cek role kepala (atau admin)
- Body: `tanggal_dari`, `tanggal_sampai`, `region_id` (opsional), `kategori_id` (opsional)
- Query activities dengan filter yang sama seperti Step 10
- Generate Excel dengan `exceljs`:
  - Sheet: "Laporan Aktivitas"
  - Header: No, Tanggal, Wilayah, Nama, Kategori, Jam Mulai, Jam Selesai, Deskripsi, Jumlah Lampiran
  - Isi data per row
  - Auto-fit column width
- Set content-type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Set header `Content-Disposition: attachment; filename="laporan-aktivitas.xlsx"`
- Return stream Excel

```typescript
const workbook = new ExcelJS.Workbook()
const sheet = workbook.addWorksheet('Laporan Aktivitas')
sheet.columns = [
  { header: 'No', key: 'no', width: 5 },
  { header: 'Tanggal', key: 'tanggal', width: 15 },
  { header: 'Wilayah', key: 'wilayah', width: 20 },
  { header: 'Nama', key: 'nama', width: 25 },
  { header: 'Kategori', key: 'kategori', width: 20 },
  { header: 'Jam Mulai', key: 'jam_mulai', width: 12 },
  { header: 'Jam Selesai', key: 'jam_selesai', width: 12 },
  { header: 'Deskripsi', key: 'deskripsi', width: 50 },
  { header: 'Lampiran', key: 'lampiran', width: 15 }
]
// Add rows...
const buffer = await workbook.xlsx.writeBuffer()
setResponseHeaders(event, {
  'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'Content-Disposition': 'attachment; filename="laporan-aktivitas.xlsx"'
})
return buffer
```

### 2. Implementasi API Export PDF (opsional)
Jika ingin generate PDF server-side, install `pdf-lib` atau `jspdf`. Namun rekomendasi adalah gunakan halaman print-friendly.

#### Alternatif: Halaman print-friendly
- Buat halaman `kepala/export/preview.vue`
- Tampilkan laporan dalam format HTML yang cocok untuk print
- Gunakan CSS `@media print` untuk styling saat print
- Tombol "Print" panggil `window.print()`
- User bisa "Save as PDF" dari browser print dialog

### 3. Build halaman `kepala/export/index.vue`
- Form filter: tanggal dari-sampai, wilayah, kategori, format (Excel/PDF)
- Submit form:
  - Jika Excel: POST ke `/api/export/excel` dengan filter params, trigger download
  - Jika PDF: navigate ke `/kepala/export/preview?tanggal_dari=...&tanggal_sampai=...&region_id=...&kategori_id=...`
- Gunakan `useFetch` atau `$fetch` untuk download Excel

### 4. Build halaman `kepala/export/preview.vue`
- Ambil query params: `tanggal_dari`, `tanggal_sampai`, `region_id`, `kategori_id`
- Fetch activities dengan filter yang sama
- Tampilkan dalam tabel print-friendly:
  - Header: Nama Aplikasi, Periode, Tanggal Export
  - Tabel data aktivitas
  - Footer: tanda tangan (opsional)
- CSS print:
```css
@media print {
  body * { visibility: hidden; }
  .print-area, .print-area * { visibility: visible; }
  .print-area { position: absolute; left: 0; top: 0; width: 100%; }
  .no-print { display: none !important; }
}
```
- Tombol "Print" (`UButton`) untuk `window.print()`
- Tombol "Kembali" untuk navigate ke `/kepala/export`

### 5. Tambah filter di halaman kepala activities
- Tambah tombol "Export" di halaman `/kepala/activities`
- Tombol ini navigate ke `/kepala/export` dengan pre-filled filter params

### 6. Test
- Login sebagai kepala
- Akses `/kepala/export`
- Test export Excel dengan filter berbagai parameter
- Buka file Excel, cek data dan format
- Test export PDF (print-friendly)
- Print preview, cek formatting
- Test dengan data kosong (harus tampil message "Tidak ada data")

## Output yang Diharapkan
- Export Excel berhasil dengan data lengkap
- Export PDF (print-friendly) berhasil
- Filter diterapkan ke export
- File terdownload dengan nama yang benar

## Troubleshooting
- Jika Excel corrupt, cek buffer type dan content-type header
- Jika print tidak rapi, adjust CSS `@media print`
- Jika data tidak sesuai filter, cek query params di API

## Langkah Berikutnya
Lanjut ke [Step 12 — Dashboard & Charts](./step-12.md)
