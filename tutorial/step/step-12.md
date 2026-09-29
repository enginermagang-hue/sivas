# Step 12 — Dashboard & Charts

## Tujuan
Build dashboard per role dengan statistik dan grafik.

## Langkah

### 1. Implementasi API Dashboard Stats

#### `server/api/dashboard/stats.get.ts`
- Gunakan middleware `auth.ts`
- Return stats berdasarkan role user:
  - `admin`: total users, total regions, total activities hari ini, total activities bulan ini
  - `koordinator`: total anggota di wilayahnya, total activities wilayah hari ini, total activities bulan ini
  - `anggota`: total aktivitas saya hari ini, total aktivitas saya bulan ini
  - `kepala`: total aktivitas semua wilayah hari ini, total aktivitas semua wilayah bulan ini, total wilayah, total users
- Query dengan agregasi: `COUNT`, `SUM`, `GROUP BY`

Contoh response:
```json
{
  "role": "koordinator",
  "totalAnggota": 12,
  "totalActivitiesHariIni": 5,
  "totalActivitiesBulanIni": 45,
  "chartData": {
    "labels": ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
    "datasets": [
      {
        "label": "Aktivitas",
        "data": [3, 5, 2, 4, 6, 1, 0],
        "borderColor": "#3B82F6",
        "backgroundColor": "#3B82F6"
      }
    ]
  }
}
```

### 2. Build halaman `dashboard.vue`
- Redirect sesuai role:
  - `admin` → `/admin/users`
  - `koordinator` → `/koordinator/members`
  - `anggota` → `/anggota/activities`
  - `kepala` → `/kepala/dashboard`

### 3. Build halaman `kepala/dashboard.vue`
- Fetch stats dari `/api/dashboard/stats`
- Tampilkan `DashboardCard.vue` untuk setiap stat:
  - Total Aktivitas Hari Ini
  - Total Aktivitas Bulan Ini
  - Total Wilayah
  - Total Users
- Tampilkan chart aktivitas 7 hari terakhir (line chart)
- Tampilkan chart aktivitas per wilayah (bar chart)
- Gunakan `vue-chartjs` atau `Chart.js` langsung

### 4. Build Component `DashboardCard.vue`
Component untuk menampilkan stat card:
- Props: `title`, `value`, `icon` (opsional), `color` (opsional)
- Tampilkan icon + title + value
- Styling dengan Nuxt UI (`UCard`, `UAvatar`, icon)

### 5. Tambah chart di dashboard kepala
- Line chart: aktivitas 7 hari terakhir
- Bar chart: aktivitas per wilayah (top 5)
- Pie chart: aktivitas per kategori

### 6. Tambah dashboard untuk admin (opsional)
- Buat `admin/dashboard.vue`
- Stats: total users, total regions, total activities, recent activities
- Chart: aktivitas per role, aktivitas per wilayah

### 7. Tambah dashboard untuk koordinator (opsional)
- Buat `koordinator/dashboard.vue`
- Stats: total anggota, total activities wilayah hari ini, total activities bulan ini
- Chart: aktivitas 7 hari terakhir di wilayahnya

### 8. Test
- Login sebagai kepala
- Akses `/kepala/dashboard`
- Cek stats tampil dengan benar
- Cek chart tampil dengan data
- Test filter chart (opsional)
- Login sebagai koordinator, cek dashboard (jika dibuat)
- Login sebagai admin, cek dashboard (jika dibuat)

## Output yang Diharapkan
- Dashboard kepala menampilkan stat dan chart lengkap
- Redirect dashboard sesuai role
- Chart interaktif (hover, tooltip)

## Troubleshooting
- Jika chart tidak tampil, cek import `Chart.js` dan `vue-chartjs`
- Jika data chart salah, cek query agregasi di API
- Jika redirect salah, cek `dashboard.vue` logic

## Langkah Berikutnya
Lanjut ke [Step 13 — Offline Mode & PWA](./step-13.md)
