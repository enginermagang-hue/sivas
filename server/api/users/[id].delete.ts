import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  const db = useDb()

  const existing = await db.execute({
    sql: `SELECT id FROM users WHERE id = ? AND deleted_at IS NULL`,
    args: [id]
  })
  if (existing.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'User tidak ditemukan' })
  }

  await db.execute({
    sql: `UPDATE users SET deleted_at = datetime('now') WHERE id = ?`,
    args: [id]
  })

  return { success: true }
})
