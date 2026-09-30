import { readMultipartFormData } from 'h3'
import { useDb } from '../../utils/db'
import { uploadToDrive, findOrCreateFolder } from '../../utils/googleDrive'

const APP_FOLDER_NAME = 'Aktivitas-Harian'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const maxSize = Number(config.public?.uploadMaxSize || 2097152)

  const formData = await readMultipartFormData(event)
  const fileField = formData.find(f => f.name === 'file')
  if (!fileField || !fileField.data) {
    throw createError({ statusCode: 400, statusMessage: 'File tidak ditemukan' })
  }

  const activityId = formData.find(f => f.name === 'activity_id')?.value
  if (!activityId) {
    throw createError({ statusCode: 400, statusMessage: 'activity_id wajib diisi' })
  }

  const fileName = fileField.filename || `file-${Date.now()}`
  const mimeType = fileField.type || 'application/octet-stream'
  const size = fileField.data.length

  if (size > maxSize) {
    throw createError({ statusCode: 413, statusMessage: `Ukuran file melebihi batas maksimal ${Math.round(maxSize / 1024 / 1024)}MB` })
  }

  const db = useDb()
  const activityRes = await db.execute({
    sql: `SELECT id FROM activities WHERE id = ? AND deleted_at IS NULL`,
    args: [Number(activityId)]
  })
  if (activityRes.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Aktivitas tidak ditemukan' })
  }

  let folderId: string | undefined
  try {
    folderId = await findOrCreateFolder(APP_FOLDER_NAME)
    const appFolder = await findOrCreateFolder(APP_FOLDER_NAME + '/' + String(activityId), folderId)
    folderId = appFolder
  } catch (e: any) {
    console.error('[upload] failed to find/create folder', e)
    throw createError({ statusCode: 500, statusMessage: 'Gagal menyiapkan folder Google Drive' })
  }

  const uploaded = await uploadToDrive(fileName, mimeType, Buffer.from(fileField.data), folderId)

  await db.execute({
    sql: `INSERT INTO activity_files (activity_id, nama_file, drive_file_id, url_file, tipe_mime, ukuran_bytes) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [Number(activityId), uploaded.nama, uploaded.id, null, uploaded.tipe_mime, uploaded.ukuran_bytes]
  })

  const newFile = await db.execute({
    sql: `SELECT id, activity_id, nama_file, drive_file_id, url_file, tipe_mime, ukuran_bytes, created_at FROM activity_files WHERE id = last_insert_rowid()`
  })

  return newFile.rows[0] as any
})
