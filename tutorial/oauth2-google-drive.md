# 📚 Tutorial Lengkap: Membuat OAuth2 Google Drive API

Tutorial ini akan mengajarkan kamu cara membuat integrasi upload ke Google Drive menggunakan **OAuth2 User Flow**, yang cocok untuk akun Gmail biasa.

---

## 🧰 Apa yang Dibutuhkan

1. Akun Google (misal: `nttdindikbud@gmail.com`)
2. Akses ke [Google Cloud Console](https://console.cloud.google.com/)
3. Project yang sudah memiliki:
   - `nuxt.config.ts`
   - `.env`
   - `server/utils/googleDrive.ts`
   - `server/api/upload.post.ts`

---

## 📋 Langkah 1: Aktifkan Google Drive API

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Pilih project kamu (misal: `sipker-510206`)
3. Buka menu **APIs & Services → Library**
4. Cari: `Google Drive API` → klik **Enable**

---

## 🗝️ Langkah 2: Buat OAuth2 Credentials

1. Buka [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Klik **Create Credentials → OAuth client ID**
3. Pilih **Application type**: `Web application`
4. Isi:
   - **Name**: misalnya `web-app`
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/api/auth/google/callback
     ```
5. Klik **Create**
6. Salin:
   - `OAuth client ID`
   - `OAuth client secret`

---

## 🔐 Langkah 3: Tambahkan Credentials ke `.env`

Buka `.env`, lalu tambahkan:

```env
GOOGLE_OAUTH_CLIENT_ID=your_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

---

## ⚙️ Langkah 4: Konfigurasi di `nuxt.config.ts`

Pastikan kamu sudah punya ini di `runtimeConfig`:

```ts
googleOAuthClientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
googleOAuthClientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || ''
```

---

## 🔧 Langkah 5: Buat Utility OAuth2 Client

Buat file baru:  
📄 `server/utils/oauthClient.ts`

```ts
import { google } from 'googleapis'

export function getOAuthClient() {
  const config = useRuntimeConfig()
  return new google.auth.OAuth2(
    config.googleOAuthClientId,
    config.googleOAuthClientSecret,
    config.googleRedirectUri
  )
}
```

---

## 🔁 Langkah 6: Buat Handler OAuth2 Login

Buat dua endpoint:

### 📄 `server/api/auth/google.get.ts`

```ts
import { getOAuthClient } from '../../utils/oauthClient'

export default defineEventHandler(async (event) => {
  const oAuth2Client = getOAuthClient()
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.file']
  })

  sendRedirect(event, authUrl, 302)
})
```

---

### 📄 `server/api/auth/google/callback.get.ts`

```ts
import { getOAuthClient } from '../../../utils/oauthClient'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const oAuth2Client = getOAuthClient()

  try {
    const { tokens } = await oAuth2Client.getToken(query.code as string)
    oAuth2Client.setCredentials(tokens)

    const session = await useSession(event)
    await session.set({ accessToken: tokens.access_token })

    sendRedirect(event, '/', 302)
  } catch (err) {
    throw createError({ statusCode: 500, statusMessage: 'OAuth callback failed' })
  }
})
```

---

## 📤 Langkah 7: Buat Fungsi Upload OAuth2

Tambahkan ke `server/utils/googleDrive.ts`:

```ts
import { google } from 'googleapis'

export async function uploadToDriveOAuth(
  fileName: string,
  mimeType: string,
  data: Buffer,
  accessToken: string,
  folderId?: string
) {
  const oAuth2Client = new google.auth.OAuth2()
  oAuth2Client.setCredentials({ access_token: accessToken })

  const drive = google.drive({ version: 'v3', auth: oAuth2Client })

  const safeName = fileName.replace(/[\\/]/g, '-')
  const fileMetadata: any = {
    name: safeName,
    parents: folderId ? [folderId] : undefined
  }

  const res = await drive.files.create({
    requestBody: fileMetadata,
    media: {
      mimeType,
      body: Buffer.from(data)
    },
    fields: 'id,name,mimeType,size'
  })

  return {
    id: res.data.id,
    nama: res.data.name,
    tipe_mime: res.data.mimeType,
    ukuran_bytes: Number(res.data.size || 0)
  }
}
```

---

## 📡 Langkah 8: Buat Endpoint Upload

📄 `server/api/upload.post.ts`

```ts
import { uploadToDriveOAuth } from '../utils/googleDrive'

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  const file = form?.find(f => f.name === 'file')
  const folderId = getQuery(event).folderId as string | undefined

  if (!file || !file.data) {
    throw createError({ statusCode: 400, statusMessage: 'No file provided' })
  }

  const session = await useSession(event)
  const accessToken = session.get().accessToken

  if (!accessToken) {
    throw createError({ statusCode: 401, statusMessage: 'Login required first' })
  }

  const result = await uploadToDriveOAuth(
    file.filename || 'upload.txt',
    file.type || 'application/octet-stream',
    Buffer.from(file.data),
    accessToken,
    folderId
  )

  return result
})
```

---

## 🧪 Langkah 9: Uji Upload via OAuth Playground

1. Buka: [https://developers.google.com/oauthplayground](https://developers.google.com/oauthplayground)
2. Klik ⚙️ Settings → centang "Use your own OAuth credentials"
3. Masukkan:
   - Client ID: dari `.env`
   - Client Secret: dari `.env`
4. Pilih scope:
   ```
   https://www.googleapis.com/auth/drive.file
   ```
5. Klik **Authorize APIs** → login → beri izin
6. Klik **Exchange authorization code for tokens**
7. Salin **access token**
8. Jalankan upload via terminal:

```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer ACCESS_TOKEN_TADI" \
  -F "file=@C:/temp/test.txt"
```

Jika berhasil → file akan muncul di Google Drive kamu.

---

## 📌 Catatan Akhir

- OAuth2 ini hanya cocok untuk penggunaan pribadi/dev saja.
- Untuk produksi, gunakan database session + refresh token.
- Jika ingin upload ke Shared Drive, tambahkan `driveId` dan `supportsAllDrives: true`.

---

## 📝 Opsional: Simpan Tutorial ini

Kamu bisa simpan tutorial ini di:

```
tutorial/oauth2-google-drive.md
```

di folder proyek kamu.

---

Dokumen ini secara otomatis disimpan di folder `tutorial/oauth2-google-drive.md` di dalam proyek kamu.
