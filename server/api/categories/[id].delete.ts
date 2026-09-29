import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  const db = useDb()

  const existing = await db.execute({
    sql: `SELECT id FROM categories WHERE id = ?`,
    args: [id]
  })
  if (existing.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Kategori tidak ditemukan' })
  }

  const activitiesCount = await db.execute({
    sql: `SELECT COUNT(*) as c FROM activities WHERE kategori_id = ? AND deleted_at IS NULL`,
    args: [id]
  })
  const count = (activitiesCount.rows[0] as any).c
  if (count > 0) {
    throw createError({ statusCode: 400, statusMessage: 'Kategori masih digunakan oleh aktivitas' })
  }

  await db.execute({
    sql: `DELETE FROM categories WHERE id = ?`,
    args: [id]
  })

  return { success: true }
})
