/**
 * Skrip uji integrasi lapisan Google Drive.
 *
 * Menguji fungsi PRODUKSI dari server/utils/googleDrive.ts end-to-end:
 *   getConnectedDriveAccount -> findOrCreateActivityFolder -> uploadToDrive
 *   -> getDriveFileBuffer (verifikasi round-trip) -> deleteDriveFile (cleanup)
 *
 * Cara pakai:
 *   npx tsx scripts/test-drive-upload.ts [--keep] [--file <path-lokal>]
 *
 * Catatan:
 *   - Hanya MEMBACA database (SELECT google_connections). Tidak menulis/menghapus data aplikasi.
 *   - Satu-satunya tulis adalah file uji di Google Drive, otomatis dihapus kecuali --keep.
 *   - Keluar dengan kode 0 bila semua langkah PASS, 1 bila ada yang gagal.
 */
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'

// --- Shim runtime Nuxt (auto-import yang tidak ada di tsx polos) ---
// useRuntimeConfig/createError hanya dipakai di dalam fungsi, jadi menempelkannya
// ke globalThis SEBELUM dynamic import sudah cukup.
;(globalThis as any).useRuntimeConfig = () => ({
  googleOauthClientId: process.env.NUXT_GOOGLE_OAUTH_CLIENT_ID ?? '',
  googleOauthClientSecret: process.env.NUXT_GOOGLE_OAUTH_CLIENT_SECRET ?? '',
  googleRedirectUri: process.env.NUXT_GOOGLE_REDIRECT_URI ?? '',
  tursoUrl: process.env.NUXT_TURSO_URL ?? '',
  tursoAuthToken: process.env.NUXT_TURSO_AUTH_TOKEN ?? ''
})
;(globalThis as any).createError = (opts: any) =>
  Object.assign(new Error(String(opts?.statusMessage ?? 'Error')), {
    statusCode: Number(opts?.statusCode ?? 500)
  })

const args = process.argv.slice(2)
const KEEP = args.includes('--keep')
const fileFlagIdx = args.indexOf('--file')
const localFilePath = fileFlagIdx >= 0 ? args[fileFlagIdx + 1] : undefined

let failures = 0

function pass(step: string, detail = '') {
  console.log(`[PASS] ${step}${detail ? ` — ${detail}` : ''}`)
}

function fail(step: string, detail = '') {
  failures += 1
  console.error(`[FAIL] ${step}${detail ? ` — ${detail}` : ''}`)
}

function describeError(error: any): string {
  const code = error?.statusCode ?? error?.code ?? error?.status ?? '?'
  const message = String(error?.message ?? error ?? 'unknown error')
  return `(${code}) ${message}`
}

async function main() {
  const drive = await import('../server/utils/googleDrive')

  // 1. Kredensial OAuth dari .env
  const hasClient =
    !!process.env.NUXT_GOOGLE_OAUTH_CLIENT_ID && !!process.env.NUXT_GOOGLE_OAUTH_CLIENT_SECRET
  if (!hasClient) {
    fail('kredensial-oauth', 'NUXT_GOOGLE_OAUTH_CLIENT_ID/SECRET kosong di .env')
    process.exit(1)
  }
  pass('kredensial-oauth', 'client ID + secret terbaca dari .env')

  // 2. Koneksi token (dibaca dari tabel google_connections, sama seperti aplikasi)
  try {
    const account = await drive.getConnectedDriveAccount()
    pass('koneksi-drive', `akun: ${account.displayName || account.email || '(tanpa nama)'}`)
  } catch (error: any) {
    if (drive.isInvalidGrant(error)) {
      fail('koneksi-drive', 'refresh token kedaluwarsa/dicabut — hubungkan ulang via /admin/integrations')
    } else if (String(error?.message ?? '').includes('belum terhubung')) {
      fail('koneksi-drive', 'belum ada token — hubungkan dulu via /admin/integrations')
    } else {
      fail('koneksi-drive', describeError(error))
    }
    process.exit(1)
  }

  // 3. Siapkan payload uji
  let fileName: string
  let mimeType: string
  let payload: Buffer
  if (localFilePath) {
    try {
      payload = readFileSync(localFilePath)
    } catch {
      fail('baca-file-lokal', `tidak bisa membaca ${localFilePath}`)
      process.exit(1)
    }
    fileName = `test-${Date.now()}-${basename(localFilePath)}`
    mimeType = localFilePath.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'
  } else {
    fileName = `test-upload-${Date.now()}.txt`
    mimeType = 'text/plain'
    payload = Buffer.from(`File uji upload Sivas — ${new Date().toISOString()}\n`, 'utf-8')
  }
  pass('payload-uji', `${fileName} (${payload.length} byte)`)

  // 4. Folder uji (terpisah dari data asli)
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  let folderId = ''
  try {
    folderId = await drive.findOrCreateActivityFolder(['Aktivitas-Harian', '_TEST_', stamp])
    pass('folder-uji', `id=${folderId}`)
  } catch (error: any) {
    fail('folder-uji', describeError(error))
    process.exit(1)
  }

  // 5. Upload
  let driveFileId = ''
  try {
    const uploaded = await drive.uploadToDrive(fileName, mimeType, payload, folderId)
    driveFileId = uploaded.id
    pass('upload', `id=${uploaded.id} size=${uploaded.ukuran_bytes}`)
  } catch (error: any) {
    fail('upload', describeError(error))
    try {
      await drive.deleteDriveFile(folderId)
      console.log(`[INFO] folder uji dibersihkan setelah upload gagal (id=${folderId})`)
    } catch {
      console.log(`[INFO] folder uji TERTINGGAL di Drive (id=${folderId}), hapus manual bila perlu`)
    }
    process.exit(1)
  }

  // 6. Download + verifikasi round-trip byte
  try {
    const content = await drive.getDriveFileBuffer(driveFileId)
    if (Buffer.compare(content.buffer, payload) === 0) {
      pass('round-trip', `${content.buffer.length} byte identik`)
    } else {
      fail('round-trip', `byte berbeda (kirim ${payload.length}, terima ${content.buffer.length})`)
    }
  } catch (error: any) {
    fail('round-trip', describeError(error))
  }

  // 7. Cleanup
  if (KEEP) {
    console.log(`[INFO] --keep aktif, file uji dibiarkan di Drive (id=${driveFileId}, folder=${folderId})`)
  } else {
    try {
      await drive.deleteDriveFile(driveFileId)
      pass('hapus-file-uji', `id=${driveFileId}`)
    } catch (error: any) {
      fail('hapus-file-uji', describeError(error))
    }
    try {
      await drive.deleteDriveFile(folderId)
      pass('hapus-folder-uji', `id=${folderId}`)
    } catch (error: any) {
      fail('hapus-folder-uji', describeError(error))
    }
  }

  if (failures > 0) {
    console.error(`\nSELESAI dengan ${failures} kegagalan.`)
    process.exit(1)
  }
  console.log('\nSEMUA UJI LULUS.')
}

main().catch((error) => {
  console.error('[FATAL]', describeError(error))
  process.exit(1)
})
