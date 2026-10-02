import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth as any
  if (!auth) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (auth.role !== 'admin') throw createError({ statusCode: 403, statusMessage: 'Hanya admin' })
  const id = Number(event.context.params?.id)
  if (!Number.isFinite(id)) throw createError({ statusCode: 400, statusMessage: 'ID tidak valid' })
  const db = useDb()
  const cur = await db.execute({ sql: `SELECT id FROM feedbacks WHERE id = ?`, args: [id] })
  if (cur.rows.length === 0) throw createError({ statusCode: 404, statusMessage: 'Feedback tidak ditemukan' })
  await db.execute({ sql: `DELETE FROM feedbacks WHERE id = ?`, args: [id] })
  return { ok: true }
})
