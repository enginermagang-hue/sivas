import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  const db = useDb()
  const res = await db.execute({
    sql: `SELECT id, email, nama, role, region_id, status, last_login, created_at FROM users WHERE id = ? AND deleted_at IS NULL`,
    args: [id]
  })
  if (res.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'User tidak ditemukan' })
  }
  return res.rows[0] as any
})
