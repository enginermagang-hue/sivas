import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  const db = useDb()
  const auth = event.context.auth as any

  const comment = await db.execute({
    sql: `SELECT c.*, a.user_id as activity_user_id, a.region_id as activity_region_id
           FROM comments c
           JOIN activities a ON a.id = c.activity_id
           WHERE c.id = ?`,
    args: [id]
  })
  if (comment.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Komentar tidak ditemukan' })
  }

  const cm = comment.rows[0] as any
  if (cm.user_id !== auth.userId && auth.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Tidak diizinkan menghapus komentar ini' })
  }

  await db.execute({
    sql: `DELETE FROM comments WHERE id = ?`,
    args: [id]
  })

  return { success: true }
})
