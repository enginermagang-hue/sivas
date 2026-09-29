# Step 13 — Offline Mode & PWA

## Tujuan
Implementasi offline mode agar user bisa input aktivitas tanpa koneksi internet.

## Langkah

### 1. Setup PWA
- Install module PWA untuk Nuxt 4 (opsional: `@vite-pwa/nuxt` atau custom)
- Atau setup manual:
  - Buat `public/manifest.json`
  - Register service worker
  - Setup cache strategy

### 2. Setup IndexedDB untuk offline queue
Buat composable `app/composables/useOfflineSync.ts`:
- Gunakan library `idb-keyval` atau native IndexedDB
- Fungsi-fungsi:
  - `addToSyncQueue(action, entity, payload)`: simpan action ke IndexedDB
  - `getSyncQueue()`: ambil semua pending sync
  - `removeFromSyncQueue(id)`: hapus setelah sync berhasil
  - `clearSyncQueue()`: hapus semua

### 3. Implementasi API Sync

#### `server/api/sync/pending.get.ts`
- Gunakan middleware `auth.ts`
- Query `sync_queue` where `user_id = ?` dan `status = 'pending'`
- Return list pending items

#### `server/api/sync/submit.post.ts`
- Gunakan middleware `auth.ts`
- Body: array of pending items dari client
- Loop setiap item:
  - Berdasarkan `action` (create/update/delete) dan `entity` (activities, comments, dll)
  - Proses sesuai entity
  - Jika berhasil, update `status = 'synced'`, set `synced_at`
  - Jika gagal, update `status = 'failed'`
- Return `{ synced: count, failed: count }`

### 4. Build offline indicator
- Tambah component `OfflineIndicator.vue` di layout
- Tampilkan badge/icon jika offline (`navigator.onLine === false`)
- Gunakan `@vueuse/core` `useOnline()` untuk deteksi status online/offline

### 5. Integrasi offline mode ke form aktivitas
- Di `ActivityForm.vue`, cek `navigator.onLine`
- Jika offline:
  - Submit form → simpan ke IndexedDB (`sync_queue`) dengan status `pending`
  - Tampilkan toast "Aktivitas disimpan offline, akan disinkronisasi saat online"
- Jika online:
  - Submit form → panggil API normal
- Saat online (`window.addEventListener('online')`):
  - Fetch pending items dari `/api/sync/pending`
  - Kirim ke `/api/sync/submit`
  - Update UI setelah sync berhasil

### 6. Setup auto-sync
- Gunakan `useIntervalFn` dari `@vueuse/core` untuk cek sync setiap 30 detik saat online
- Atau gunakan `window.addEventListener('online')` untuk trigger sync saat koneksi kembali

### 7. Test offline mode
- DevTools → Network → Offline mode
- Input aktivitas offline
- Cek data tersimpan di IndexedDB (Application → IndexedDB)
- Kembali ke online mode
- Cek data tersync ke server
- Cek data muncul di list activities

### 8. Handling conflict (opsional)
- Jika ada conflict (misal activity diubah di device lain), implementasi strategy:
  - Last write wins
  - Prompt user untuk resolve
  - Atau simpan sebagai duplicate

## Output yang Diharapkan
- User bisa input aktivitas saat offline
- Data tersimpan di IndexedDB
- Data otomatis sync saat online
- Indikator online/offline tampil di UI

## Troubleshooting
- Jika IndexedDB tidak tersedia (private mode), fallback ke localStorage
- Jika sync gagal, cek error handling di API
- Jika data duplicate, cek idempotency key

## Langkah Berikutnya
Lanjut ke [Step 14 — Multi-Language (i18n)](./step-14.md)
