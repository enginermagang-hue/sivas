# Step 03 — Session & Auth API

## Tujuan
Implementasi sistem autentikasi berbasis session cookie dan API auth.

## Langkah

### 1. Setup `server/utils/session.ts`
Buat file `server/utils/session.ts` dengan fungsi-fungsi:
- `newToken()`: generate random token dengan `crypto.randomUUID()`
- `createSession(userId, ip, ua)`: insert ke tabel `sessions`, return `{ token, expires }`
- `getSessionUser(token)`: query join `sessions` + `users`, cek `revoked = 0` dan `expires_at > datetime('now')`, update `last_active`
- `destroySession(token)`: set `revoked = 1`
- `revokeSession(sessionId)`: set `revoked = 1` by session id
- Definisikan `SESSION_COOKIE = 'sid'`

### 2. Setup `server/middleware/auth.ts`
Buat file `server/middleware/auth.ts` untuk guard API:
- Skip path: `/api/auth/login`, `/api/auth/google`, `/api/panduan`, `/api/whatsapp/webhook`
- Ambil cookie `sid` dengan `getCookie(event, SESSION_COOKIE)`
- Panggil `getSessionUser(token)`
- Jika null, throw `401 Unauthorized`
- Jika user status bukan `active`, throw `403 Akun nonaktif`
- Inject user ke `event.context.auth`

### 3. Setup validasi auth
Buat schema Zod di `lib/validations.ts`:
- `loginSchema`: email (string, min 1), password (string, min 1)

### 4. Implementasi API `login.post.ts`
Buat `server/api/auth/login.post.ts`:
- Read validated body dengan `readValidatedBody(event, loginSchema.parse)`
- Query users where `LOWER(TRIM(email)) = ?` dan `deleted_at IS NULL`
- Jika tidak found, throw `401 Email atau password salah`
- Compare password dengan `bcrypt.compare`
- Jika tidak match, throw `401 Email atau password salah`
- Jika status bukan `active`, throw `403 Akun nonaktif`
- Ambil IP dengan `getRequestIP(event, { xForwardedFor: true })`
- Ambil User-Agent dengan `getRequestHeader(event, 'user-agent')`
- Panggil `createSession(user.id, ip, ua)`
- Update `last_login` di users
- Set cookie `sid` dengan: httpOnly, sameSite `lax`, path `/`, expires, secure di production
- Return `{ user: { id, nama, email, role, region_id } }`

### 5. Implementasi API `logout.post.ts`
Buat `server/api/auth/logout.post.ts`:
- Ambil cookie `sid`
- Panggil `destroySession(token)`
- Clear cookie `sid` (set expired ke masa lalu)
- Return `{ success: true }`

### 6. Implementasi API `me.get.ts`
Buat `server/api/auth/me.get.ts`:
- Gunakan middleware `auth.ts` (otomatis inject `event.context.auth`)
- Return `{ user: event.context.auth }`

### 7. Setup `app/composables/useAuth.ts`
Buat composable dengan:
- `user`: `useState('auth-user', () => null)`
- `loaded`: `useState('auth-loaded', () => false)`
- `fetchMe()`: call `/api/auth/me` dengan headers cookie
- `login(email, password)`: call `/api/auth/login` POST
- `logout()`: call `/api/auth/logout` POST, set user null, navigate ke `/login`
- Return semua fungsi

### 8. Setup `app/middleware/auth.global.ts`
Buat middleware global untuk guard pages:
- Public pages: `/login`
- Jika user null dan bukan public page, redirect ke `/login`
- Jika user ada dan di `/login`, redirect ke `/dashboard`
- Jika user role bukan `admin` dan akses `/admin/*`, redirect ke `/dashboard` atau throw 403
- Jika user role bukan `kepala` dan akses `/kepala/*`, throw 403
- Jika user role bukan `koordinator` dan akses `/koordinator/*`, throw 403
- Jika user role bukan `anggota` dan akses `/anggota/*`, throw 403

### 9. Build halaman `login.vue`
Buat halaman login dengan:
- Form: email, password
- Submit panggil `useAuth().login(email, password)`
- Setelah login berhasil, redirect ke `/dashboard`
- Error handling: tampilkan toast error jika login gagal
- Gunakan komponen Nuxt UI: `UCard`, `UForm`, `UInput`, `UButton`

### 10. Build `layouts/default.vue`
Buat layout default dengan:
- Sidebar dengan menu sesuai role
- Navbar dengan user info + logout button
- Gunakan `UButton` untuk logout, panggil `useAuth().logout()`
- Tampilkan nama user dan role

### 11. Test
- Jalankan `npm run dev`
- Akses `http://localhost:3000/login`
- Login dengan admin seed
- Cek cookie `sid` di browser DevTools (Application → Cookies)
- Cek session terbuat di database
- Test logout

## Output yang Diharapkan
- Login berhasil, redirect ke dashboard
- Cookie `sid` httpOnly ter-set
- Session tersimpan di database
- Logout menghapus cookie dan session
- Middleware mengamankan pages sesuai role

## Troubleshooting
- Jika cookie tidak ter-set, cek `secure` flag (harus `false` di dev)
- Jika session tidak terbaca, cek path dan domain cookie
- Jika bcrypt error, pastikan `bcryptjs` terinstal

## Langkah Berikutnya
Lanjut ke [Step 04 — Master Data: Users & Regions (Admin)](./step-04.md)
