import { useDb } from '../../utils/db'

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
  if (auth.role === 'koordinator' && activity.region_id !== auth.regionId) {
    throw createError({ statusCode: 403, statusMessage: 'Tidak diizinkan menghapus aktivitas ini' })
  }
  if (auth.role === 'anggota' && activity.user_id !== auth.userId) {
    throw createError({ statusCode: 403, statusMessage: 'Tidak diizinkan menghapus aktivitas ini' })
  }

  await db.execute({
    sql: `UPDATE activities SET deleted_at = datetime('now') WHERE id = ?`,
    args: [id]
  })

  return { success: true }
})
