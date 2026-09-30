import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  const db = useDb()
  const res = await db.execute({
    sql: `SELECT id, nama, kode, status, created_at FROM regions WHERE id = ?`,
    args: [id]
  })
  if (res.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Wilayah tidak ditemukan' })
  }
  return res.rows[0] as any
})
