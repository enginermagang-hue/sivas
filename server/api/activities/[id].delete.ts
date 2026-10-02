import { useDb } from '../../utils/db'
import { DRIVE_CONNECTION_EXPIRED_MESSAGE, deleteDriveFile, isInvalidGrant } from '../../utils/googleDrive'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  const db = useDb()
  const auth = event.context.auth as any

  const existing = await db.execute({
    sql: `SELECT * FROM activities WHERE id = ? AND deleted_at IS NULL`,
    args: [id]
  })
  if (existing.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Aktivitas tidak ditemukan' })
  }

  const activity = existing.rows[0] as any
  if (auth.role === 'koordinator' && activity.user_id !== auth.userId) {
    throw createError({ statusCode: 403, statusMessage: 'Koordinator hanya dapat menghapus aktivitas miliknya sendiri' })
  }
  if (auth.role === 'anggota' && activity.user_id !== auth.userId) {
    throw createError({ statusCode: 403, statusMessage: 'Tidak diizinkan menghapus aktivitas ini' })
  }

  const filesRes = await db.execute({
    sql: `SELECT id, drive_file_id FROM activity_files WHERE activity_id = ?`,
    args: [id]
  })
  const driveFailures: number[] = []
  for (const file of filesRes.rows as any[]) {
    try {
      await deleteDriveFile(file.drive_file_id)
    } catch (error: any) {
      console.error('[activity-delete] gagal menghapus file Drive:', error)
      if (isInvalidGrant(error)) {
        throw createError({ statusCode: 401, statusMessage: DRIVE_CONNECTION_EXPIRED_MESSAGE })
      }
      driveFailures.push(Number(file.id))
    }
  }
  if (driveFailures.length > 0) {
    throw createError({
      statusCode: 502,
      statusMessage: `Gagal menghapus ${driveFailures.length} file dari Google Drive sehingga aktivitas belum dihapus`
    })
  }

  await db.execute({
    sql: `DELETE FROM activity_files WHERE activity_id = ?`,
    args: [id]
  })
  await db.execute({
    sql: `UPDATE activities SET deleted_at = datetime('now') WHERE id = ?`,
    args: [id]
  })

  return { success: true }
})
