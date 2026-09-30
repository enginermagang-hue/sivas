import { readMultipartFormData } from 'h3'
import { useDb } from '../../utils/db'
import {
  DRIVE_CONNECTION_EXPIRED_MESSAGE,
  findOrCreateActivityFolder,
  isInvalidGrant,
  uploadToDrive
} from '../../utils/googleDrive'

const APP_FOLDER_NAME = 'Aktivitas-Harian'

function assertCanAttachFile(auth: any, activity: any) {
  if (!auth) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  if (auth.role === 'admin' || auth.role === 'kepala') return
  if (auth.role === 'koordinator' && activity.region_id === auth.regionId) return
  if (auth.role === 'anggota' && activity.user_id === auth.userId) return
  throw createError({ statusCode: 403, statusMessage: 'Tidak diizinkan melampirkan file pada aktivitas ini' })
}

export default defineEventHandler(async (event) => {
  const auth = event.context.auth as any
  const config = useRuntimeConfig()
  const maxSize = Number(config.public?.uploadMaxSize || 2097152)

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Form multipart tidak ditemukan' })
  }

  const fileField = formData.find((part) => part.name === 'file')
  if (!fileField || !fileField.data || fileField.data.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'File tidak ditemukan' })
  }

  const activityIdText = formData.find((part) => part.name === 'activity_id')?.data?.toString()?.trim()
  const activityId = Number(activityIdText)
  if (!activityIdText || !Number.isFinite(activityId) || activityId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'activity_id wajib diisi' })
  }

  const fileName = fileField.filename?.trim() || `file-${Date.now()}`
  const mimeType = fileField.type || 'application/octet-stream'
  const size = fileField.data.length
  if (size > maxSize) {
    throw createError({
      statusCode: 413,
      statusMessage: `Ukuran file melebihi batas maksimal ${Math.round(maxSize / 1024 / 1024)}MB`
    })
  }

  const db = useDb()
  const activityRes = await db.execute({
    sql: `SELECT a.id, a.user_id, a.region_id, a.tanggal,
                 r.nama AS region_nama
          FROM activities a
          LEFT JOIN regions r ON r.id = a.region_id
          WHERE a.id = ? AND a.deleted_at IS NULL`,
    args: [activityId]
  })
  if (activityRes.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Aktivitas tidak ditemukan' })
  }
  const activity = activityRes.rows[0] as any
  assertCanAttachFile(auth, activity)

  const activityDate = String(activity.tanggal || '').slice(0, 10)
  let folderId: string
  let uploaded: Awaited<ReturnType<typeof uploadToDrive>>
  try {
    folderId = await findOrCreateActivityFolder([
      APP_FOLDER_NAME,
      String(activity.region_nama || `Wilayah-${activity.region_id}`),
      activityDate || 'tanpa-tanggal',
      `Actv-${activity.id}`
    ])
    uploaded = await uploadToDrive(fileName, mimeType, Buffer.from(fileField.data), folderId)
  } catch (error: any) {
    console.error('[upload] gagal upload ke Google Drive:', error)
    if (isInvalidGrant(error)) {
      throw createError({ statusCode: 401, statusMessage: DRIVE_CONNECTION_EXPIRED_MESSAGE })
    }
    throw createError({ statusCode: 502, statusMessage: 'Gagal mengunggah file ke Google Drive' })
  }

  await db.execute({
    sql: `INSERT INTO activity_files (activity_id, nama_file, drive_file_id, url_file, tipe_mime, ukuran_bytes)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [activityId, uploaded.nama, uploaded.id, '', uploaded.tipe_mime, uploaded.ukuran_bytes]
  })

  const newFile = await db.execute({
    sql: `SELECT id, activity_id, nama_file, drive_file_id, url_file, tipe_mime, ukuran_bytes, created_at
          FROM activity_files WHERE id = last_insert_rowid()`
  })
  return newFile.rows[0] as any
})
