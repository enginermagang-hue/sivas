import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  const db = useDb()

  const existing = await db.execute({
    sql: `SELECT id FROM regions WHERE id = ?`,
    args: [id]
  })
  if (existing.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Wilayah tidak ditemukan' })
  }

  const usersCount = await db.execute({
    sql: `SELECT COUNT(*) as c FROM users WHERE region_id = ? AND deleted_at IS NULL`,
    args: [id]
  })
  const count = (usersCount.rows[0] as any).c
  if (count > 0) {
    throw createError({ statusCode: 400, statusMessage: 'Wilayah masih digunakan oleh user' })
  }

  await db.execute({
    sql: `DELETE FROM regions WHERE id = ?`,
    args: [id]
  })

  return { success: true }
})
