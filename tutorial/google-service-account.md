# Tutorial: Membuat Google Service Account untuk Upload ke Google Drive

Tutorial ini untuk keperluan upload file di aplikasi **Sivas** ke Google Drive secara server-to-server.

---

## 1. Buka Google Cloud Console
- Akses [https://console.cloud.google.com](https://console.cloud.google.com)
- Login dengan akun Google Anda.
- Pilih / buat project yang sesuai.

## 2. Aktifkan Google Drive API
- Buka **APIs & Services → Library**
- Cari `Google Drive API`, lalu klik **Enable**.

## 3. Buat Service Account
- Buka **IAM & Admin → Service Accounts**
- Klik **+ Create Service Account**
- Nama: misalnya `sivas-uploader`
- Deskripsi: opsional
- Klik **Create and Continue** → lewati → **Done**

## 4. Buat Kunci JSON
- Di daftar Service Accounts, temukan akun baru
- Klik tiga titik → **Manage keys** → **Add key** → **Create new key**
- Pilih **JSON**, lalu **Create**
- Unduh file JSON — **simpan dengan aman**, jangan commit ke Git

## 5. Simpan Kunci di Server
Letakkan file JSON di:
```
server/utils/gdrive-keys/sivas-uploader.json
```
Pastikan file ini ada di `.gitignore`.

> Untuk produksi, gunakan environment variable di Vercel:
> ```
> GOOGLE_SERVICE_ACCOUNT_KEY = <isi JSON>
> ```
> Lalu baca di `server/utils/googleDrive.ts` via `process.env`.

## 6. Bagikan Folder Google Drive
- Service account memiliki email seperti:
  ```
  sivas-uploader@nama-project.iam.gserviceaccount.com
  ```
- Buka Google Drive → Folder tujuan → klik kanan → **Share**
- Tambahkan email service account, beri peran **Editor**

## 7. Uji Koneksi
Contoh kode tes singkat:

```ts
import { google } from 'googleapis'

const auth = new google.auth.GoogleAuth({
  keyFile: 'server/utils/gdrive-keys/sivas-uploader.json',
  scopes: ['https://www.googleapis.com/auth/drive.file']
})

const drive = google.drive({ version: 'v3', auth })
const res = await drive.files.list({ pageSize: 5 })
console.log(res.data.files)
```

---

## Tips
- 🔒 Jangan commit file `.json` ke Git
- Gunakan `.env` untuk path atau isi kunci
- Untuk produksi, simpan kunci via environment variable

## Dokumentasi resmi
- [Google Service Account Guide](https://developers.google.com/identity/protocols/oauth2/service-account)
