# Step 14 — Multi-Language (i18n)

## Tujuan
Implementasi multi-language (Indonesia + Inggris) dengan language switcher.

## Langkah

### 1. Setup i18n
Pilih salah satu opsi:
- Opsi A: Gunakan module `@nuxtjs/i18n` (recommended untuk Nuxt)
- Opsi B: Custom composable `useI18n.ts`

#### Opsi A: @nuxtjs/i18n
```bash
npm install @nuxtjs/i18n
```

Tambah module di `nuxt.config.ts`:
```typescript
modules: ['@nuxt/ui', '@nuxtjs/i18n'],
i18n: {
  locales: [
    { code: 'id', name: 'Indonesia', file: 'id.json' },
    { code: 'en', name: 'English', file: 'en.json' }
  ],
  defaultLocale: 'id',
  lazy: true,
  langDir: 'locales/',
  strategy: 'prefix_except_default'
}
```

Buat file terjemahan:
- `locales/id.json`
- `locales/en.json`

#### Opsi B: Custom composable
Buat `app/composables/useI18n.ts`:
- State: `locale` (default 'id')
- Dictionary: object dengan key untuk setiap bahasa
- Fungsi `t(key)` untuk translate
- Fungsi `setLocale(locale)` untuk ganti bahasa
- Simpan preference di `localStorage`

### 2. Buat file terjemahan

#### `locales/id.json` (Indonesia)
```json
{
  "app": {
    "name": "Aktivitas Harian",
    "login": "Masuk",
    "logout": "Keluar",
    "dashboard": "Dashboard",
    "admin": "Admin",
    "koordinator": "Koordinator",
    "anggota": "Anggota",
    "kepala": "Kepala"
  },
  "menu": {
    "home": "Beranda",
    "users": "Pengguna",
    "regions": "Wilayah",
    "categories": "Kategori",
    "activities": "Aktivitas",
    "input": "Input",
    "members": "Anggota",
    "export": "Export",
    "settings": "Pengaturan"
  },
  "form": {
    "email": "Email",
    "password": "Password",
    "nama": "Nama",
    "role": "Role",
    "region": "Wilayah",
    "category": "Kategori",
    "tanggal": "Tanggal",
    "jam_mulai": "Jam Mulai",
    "jam_selesai": "Jam Selesai",
    "deskripsi": "Deskripsi",
    "lampiran": "Lampiran",
    "submit": "Simpan",
    "cancel": "Batal",
    "search": "Cari..."
  },
  "message": {
    "login_success": "Login berhasil",
    "login_failed": "Email atau password salah",
    "save_success": "Data berhasil disimpan",
    "delete_success": "Data berhasil dihapus",
    "delete_confirm": "Apakah Anda yakin ingin menghapus?",
    "no_data": "Tidak ada data",
    "offline_saved": "Data disimpan offline, akan disinkronisasi saat online"
  }
}
```

#### `locales/en.json` (English)
```json
{
  "app": {
    "name": "Daily Activity",
    "login": "Login",
    "logout": "Logout",
    "dashboard": "Dashboard",
    "admin": "Admin",
    "koordinator": "Coordinator",
    "anggota": "Member",
    "kepala": "Head"
  },
  "menu": {
    "home": "Home",
    "users": "Users",
    "regions": "Regions",
    "categories": "Categories",
    "activities": "Activities",
    "input": "Input",
    "members": "Members",
    "export": "Export",
    "settings": "Settings"
  },
  "form": {
    "email": "Email",
    "password": "Password",
    "nama": "Name",
    "role": "Role",
    "region": "Region",
    "category": "Category",
    "tanggal": "Date",
    "jam_mulai": "Start Time",
    "jam_selesai": "End Time",
    "deskripsi": "Description",
    "lampiran": "Attachment",
    "submit": "Save",
    "cancel": "Cancel",
    "search": "Search..."
  },
  "message": {
    "login_success": "Login successful",
    "login_failed": "Invalid email or password",
    "save_success": "Data saved successfully",
    "delete_success": "Data deleted successfully",
    "delete_confirm": "Are you sure you want to delete?",
    "no_data": "No data",
    "offline_saved": "Data saved offline, will sync when online"
  }
}
```

### 3. Build Component `LanguageSwitcher.vue`
Component untuk ganti bahasa:
- Tampilkan current language
- Dropdown dengan pilihan: Indonesia, English
- Click untuk ganti locale
- Simpan preference di localStorage

### 4. Integrasi ke layout
- Tambah `LanguageSwitcher.vue` ke `layouts/default.vue` di navbar
- Tampilkan di sebelah kanan navbar

### 5. Update semua halaman dan components
- Ganti semua text hardcoded dengan `$t('key')`
- Contoh:
  - `<UButton>Simpan</UButton>` → `<UButton>{{ $t('form.submit') }}</UButton>`
  - `<h1>Daftar Users</h1>` → `<h1>{{ $t('page.users.title') }}</h1>`
- Update validasi Zod messages untuk support i18n (opsional)

### 6. Update API messages (opsional)
- Jika ingin error messages API support i18n, tambah locale di request header
- Atau gunakan default messages dalam bahasa Indonesia

### 7. Test
- Ganti bahasa via LanguageSwitcher
- Cek semua text berubah sesuai bahasa
- Test navigasi, form, table, toast messages
- Refresh page, cek language preference tersimpan
- Test default locale (Indonesia)

## Output yang Diharapkan
- Semua text dalam aplikasi bisa dialihkan antara Indonesia dan Inggris
- Language switcher tampil di navbar
- Preference bahasa tersimpan di localStorage

## Troubleshooting
- Jika locale tidak berubah, cek strategy i18n config
- Jika text tidak translate, cek key di locales file
- Jika page reload ke locale default, cek storage strategy

## Langkah Berikutnya
Lanjut ke [Step 15 — Final Polish & Testing](./step-15.md)
