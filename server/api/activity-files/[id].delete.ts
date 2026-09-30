import { useDb } from '../../utils/db'
import {
  DRIVE_CONNECTION_EXPIRED_MESSAGE,
  deleteDriveFile,
  isInvalidGrant
} from '../../utils/googleDrive'

function assertCanDeleteFile(auth: any, activity: any) {
  if (!auth) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  if (auth.role === 'admin' || auth.role === 'kepala') return
  if (auth.role === 'koordinator' && activity.region_id === auth.regionId) return
  if (auth.role === 'anggota' && activity.user_id === auth.userId) return
  throw createError({ statusCode: 403, statusMessage: 'Tidak diizinkan menghapus file ini' })
}

export default defineEventHandler(async (event) => {
  const auth = event.context.auth as any
  const fileId = Number(event.context.params?.id)
  if (!Number.isFinite(fileId) || fileId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'ID file tidak valid' })
  }

  const db = useDb()
  const fileRes = await db.execute({
    sql: `SELECT f.id, f.activity_id, f.drive_file_id,
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
  assertCanDeleteFile(auth, file)

  try {
    await deleteDriveFile(file.drive_file_id)
  } catch (error: any) {
    console.error('[activity-file] gagal menghapus dari Google Drive:', error)
    if (isInvalidGrant(error)) {
      throw createError({ statusCode: 401, statusMessage: DRIVE_CONNECTION_EXPIRED_MESSAGE })
    }
    throw createError({ statusCode: 502, statusMessage: 'Gagal menghapus file dari Google Drive' })
  }

  await db.execute({ sql: `DELETE FROM activity_files WHERE id = ?`, args: [fileId] })
  return { success: true }
})
