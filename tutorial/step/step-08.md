# Step 08 — Komentar & Notifikasi

## Tujuan
Implementasi sistem komentar pada aktivitas dan notifikasi in-app.

## Langkah

### 1. Implementasi API Comments (lanjutan)
Jika belum dibuat di Step 07, buat:
- `server/api/comments/index.get.ts`: GET list comments by activity_id
- `server/api/comments/index.post.ts`: POST create comment
- `server/api/comments/[id].delete.ts`: DELETE comment

### 2. Implementasi API Notifications

#### `server/api/notifications/index.get.ts`
- Gunakan middleware `auth.ts`
- Query: `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`
- Support query param `unread=1` untuk filter yang belum dibaca
- Return list notifications

#### `server/api/notifications/read.post.ts`
- Gunakan middleware `auth.ts`
- Body: notification_id (atau kosong untuk mark all as read)
- Jika ada notification_id: update `read = 1` untuk notification tersebut
- Jika tidak ada: update semua `read = 1` untuk user
- Return `{ success: true }`

### 3. Fungsi insert notification
Buat helper di `server/utils/notifications.ts` atau langsung di comment API:
```typescript
async function createNotification(userId: number, title: string, message: string, entity: string, entityId: number) {
  await useDb().execute({
    sql: `INSERT INTO notifications (user_id, title, message, entity, entity_id) VALUES (?, ?, ?, ?, ?)`,
    args: [userId, title, message, entity, entityId]
  })
}
```

Trigger notification saat:
- Ada komentar baru pada activity: notify pemilik activity + koordinator wilayah
- Ada komentar baru dari koordinator: notify anggota
- Ada komentar baru dari kepala: notify pemilik activity + koordinator

### 4. Build Component `CommentSection.vue`
Component untuk menampilkan dan menambah komentar:
- Props: `activityId`
- State: comments, newComment, loading
- Fetch comments dari `/api/comments?activity_id=...`
- Tampilkan list comments (nama user, komentar, timestamp)
- Form input komentar (`UTextarea` + `UButton`)
- Submit ke `/api/comments` POST
- Delete button untuk comment sendiri (panggil `/api/comments/[id]` DELETE)
- Tampilkan loading state

### 5. Build Component `NotificationBell.vue`
Component untuk notifikasi di navbar:
- State: notifications, unreadCount, loading
- Fetch notifications dari `/api/notifications?unread=1`
- Tampilkan bell icon dengan badge count (jika ada unread)
- Dropdown menampilkan list notifications terbaru
- Click notification → navigate ke activity + mark as read
- Click "Mark all as read" → panggil `/api/notifications/read` POST
- Auto-refresh setiap 30 detik (gunakan `setInterval` atau `useIntervalFn` dari `@vueuse/core`)

### 6. Integrasi ke halaman aktivitas
- Tambah `CommentSection.vue` ke halaman detail aktivitas
- Jika belum ada halaman detail, buat `activities/[id].vue`
- Tampilkan semua komentar untuk activity tersebut

### 7. Integrasi `NotificationBell.vue` ke layout
- Tambah `NotificationBell.vue` ke `layouts/default.vue` di navbar
- Tampilkan di sebelah kanan navbar, sebelum logout button

### 8. Test
- Login sebagai koordinator
- Input komentar pada aktivitas anggota
- Cek notifikasi muncul di bell icon untuk anggota
- Login sebagai anggota
- Cek notifikasi, click untuk navigate ke activity
- Test mark as read
- Test delete comment sendiri
- Test komentar oleh kepala

## Output yang Diharapkan
- Komentar bisa ditambahkan pada aktivitas
- Notifikasi muncul di bell icon
- Click notifikasi navigate ke aktivitas
- Mark as read berfungsi
- Delete komentar sendiri berfungsi

## Troubleshooting
- Jika notifikasi tidak muncul, cek insert notification saat komentar dibuat
- Jika count tidak update, pastikan fetch notifications dengan `unread=1`
- Jika delete comment gagal, cek authorization (hanya pemilik atau admin yang bisa delete)

## Langkah Berikutnya
Lanjut ke [Step 09 — Koordinator: Members Page](./step-09.md)
