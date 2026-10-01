import { useDb } from '../../utils/db'
import {
  DRIVE_CONNECTION_EXPIRED_MESSAGE,
  getDriveFileBuffer,
  isInvalidGrant
} from '../../utils/googleDrive'

function assertCanAccessFile(auth: any, activity: any) {
  if (!auth) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  if (auth.role === 'admin' || auth.role === 'kepala') return
  if (auth.role === 'koordinator' && activity.region_id === auth.regionId) return
  if (auth.role === 'anggota' && activity.user_id === auth.userId) return
  throw createError({ statusCode: 403, statusMessage: 'Tidak diizinkan mengunduh file ini' })
}

function sanitizeDownloadName(name: string) {
  const cleaned = name.replace(/[\\/\r\n"]/g, '-').trim()
  return cleaned || 'lampiran'
}

export default defineEventHandler(async (event) => {
  const auth = event.context.auth as any
  const fileId = Number(event.context.params?.id)
  if (!Number.isFinite(fileId) || fileId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'ID file tidak valid' })
  }

  const db = useDb()
  const fileRes = await db.execute({
    sql: `SELECT f.id, f.activity_id, f.nama_file, f.drive_file_id, f.tipe_mime,
                 a.user_id, a.region_id
          FROM activity_files f
          JOIN activities a ON a.id = f.activity_id
          WHERE f.id = ? AND a.deleted_at IS NULL`,
    args: [fileId]
  })
  if (fileRes.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'File tidak ditemukan' })
  }
  const file = fileRes.rows[0] as any
  assertCanAccessFile(auth, file)

  let content: Awaited<ReturnType<typeof getDriveFileBuffer>>
  try {
    content = await getDriveFileBuffer(file.drive_file_id)
  } catch (error: any) {
    console.error('[activity-file] gagal mengunduh dari Google Drive:', error)
    if (isInvalidGrant(error)) {
      throw createError({ statusCode: 401, statusMessage: DRIVE_CONNECTION_EXPIRED_MESSAGE })
    }
    const status = Number(error?.code ?? error?.status ?? 0)
    if (status === 404) {
      throw createError({ statusCode: 410, statusMessage: 'File sudah tidak ada di Google Drive' })
    }
    throw createError({ statusCode: 502, statusMessage: 'Gagal mengunduh file dari Google Drive' })
  }

  const downloadName = sanitizeDownloadName(String(file.nama_file || `file-${file.id}`))
  const mimeType = String(file.tipe_mime || content.mimeType || 'application/octet-stream')
  setResponseHeader(event, 'content-type', mimeType)
  const query = getQuery(event)
  const disposition = query.inline === '1' || query.inline === 'true' ? 'inline' : 'attachment'
  setResponseHeader(event, 'content-disposition', `${disposition}; filename="${downloadName}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`)
  setResponseHeader(event, 'content-length', content.buffer.length)
  return content.buffer
})
