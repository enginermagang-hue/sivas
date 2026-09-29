# Step 06 — Google Drive Service Account

## Tujuan
Setup Google Drive API dengan Service Account untuk upload/download file.

## Langkah

### 1. Buat Google Cloud Project
- Buka [https://console.cloud.google.com](https://console.cloud.google.com)
- Buat project baru atau pilih project yang ada
- Catat project ID

### 2. Enable Google Drive API
- Menu **APIs & Services** → **Library**
- Cari "Google Drive API"
- Klik **Enable**

### 3. Buat Service Account
- Menu **APIs & Services** → **Credentials**
- Klik **Create Credentials** → **Service Account**
- Isi nama: `aktivitas-harian-upload`
- Klik **Create and Continue**
- Role: pilih **Project** → **Editor** (atau minimal **Drive File**)
- Klik **Done**

### 4. Buat JSON Key
- Klik service account yang baru dibuat
- Tab **Keys** → **Add Key** → **Create new key**
- Pilih format **JSON** → klik **Create**
- File JSON akan terdownload, buka file dan copy seluruh isinya

### 5. Buat Folder di Google Drive
- Buat folder baru di Google Drive dengan nama `Aktivitas-Harian`
- Klik kanan folder → **Share**
- Masukkan email service account dari JSON key (format: `xxx@xxx.iam.gserviceaccount.com`)
- Beri akses **Editor**

### 6. Setup `server/utils/googleDrive.ts`
Buat file utilitas untuk interaksi dengan Google Drive:

#### Fungsi-fungsi yang dibutuhkan:
- `getDriveClient()`: buat JWT client dari service account JSON
- `uploadFile(fileName, mimeType, data, folder)`: upload file ke Drive
  - Jika ukuran ≤ 2MB: upload langsung via server
  - Jika ukuran > 2MB: generate signed URL untuk direct upload (lihat catatan di bawah)
- `downloadFile(fileId)`: download file dari Drive, return buffer + content-type
- `deleteFile(fileId)`: hapus file dari Drive
- `listFilesInFolder(folderId)`: list file di folder (opsional)

#### Upload kecil (≤ 2MB):
```typescript
const drive = getDriveClient()
const fileMetadata = {
  name: fileName,
  parents: [folderId]
}
const media = {
  mimeType: mimeType,
  body: Buffer.from(data)
}
const res = await drive.files.create({
  requestBody: fileMetadata,
  media: media
})
return res.data.id
```

#### Signed URL untuk upload besar (> 2MB):
```typescript
const drive = getDriveClient()
const fileMetadata = {
  name: fileName,
  parents: [folderId]
}
const res = await drive.files.create({
  requestBody: fileMetadata,
  fields: 'id'
})
const fileId = res.data.id

// Generate signed URL untuk upload content
const url = await generateSignedUploadUrl(fileId, mimeType)
return { fileId, uploadUrl: url }
```

Catatan: Untuk signed URL, Anda perlu menggunakan Google Cloud Storage signed URLs atau implementasi custom. Alternatif lebih sederhana: batasi upload ke 2MB di aplikasi, atau gunakan Google Cloud Storage bucket dengan signed URL.

### 7. Setup environment variable
Tambahkan di `.env.example`:
```
NUXT_GOOGLE_DRIVE_SERVICE_ACCOUNT={"type":"service_account",...}
```

### 8. Test upload kecil
Buat script test atau API endpoint sementara untuk test upload:
```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test.jpg" \
  -F "activityId=1"
```

Atau buat halaman test sederhana untuk upload file.

### 9. Verifikasi
- Cek file muncul di Google Drive folder `Aktivitas-Harian`
- Cek metadata tersimpan di database (jika sudah ada API upload)

## Output yang Diharapkan
- Service Account berhasil membuat file di Google Drive
- Upload kecil (≤ 2MB) berhasil via server
- File terorganisir di folder `Aktivitas-Harian`

## Troubleshooting
- Jika error 403, pastikan service account email sudah di-share ke folder dengan akses Editor
- Jika error quota exceeded, cek quota Google Drive API di Google Cloud Console
- Jika error invalid credentials, pastikan JSON key benar dan belum revoked
- Jika upload besar timeout, pertimbangkan batasi ke 2MB atau gunakan Google Cloud Storage

## Catatan Penting
- Untuk production di Vercel, simpan JSON service account sebagai environment variable string
- Parse JSON di server dengan `JSON.parse(process.env.NUXT_GOOGLE_DRIVE_SERVICE_ACCOUNT || '{}')`
- Jangan commit file JSON key ke git

## Langkah Berikutnya
Lanjut ke [Step 07 — Aktivitas: Input & List (Anggota & Koordinator)](./step-07.md)
