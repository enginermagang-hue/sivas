# AGENTS.md

## Aturan Strict — Larangan Menjalankan Perintah Berikut Tanpa Izin

Perintah-perintah di bawah **DILARANG DIPANGGIL SECARA OTOMATIS** oleh agent kecuali **secara eksplisit diminta oleh pengguna**:

- `npm run dev`
- `npm run build`
- `npx nuxt build`

Agent **tidak boleh** menjalankan perintah di atas meskipun terlihat sebagai langkah logis berikutnya, sebagai inisiasi proaktif, atau sebagai bagian dari verifikasi. Menunggu instruksi eksplisit dari pengguna sebelum menjalankan perintah manapun yang ada dalam daftar ini.
