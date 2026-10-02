import { useDb } from '../../utils/db'
import { feedbackStatusSchema } from '../../../lib/validations'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth as any
  if (!auth) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (auth.role !== 'admin') throw createError({ statusCode: 403, statusMessage: 'Hanya admin' })
  const id = Number(event.context.params?.id)
  if (!Number.isFinite(id)) throw createError({ statusCode: 400, statusMessage: 'ID tidak valid' })
  const body = await readValidatedBody(event, feedbackStatusSchema.parse)
  const db = useDb()
  const cur = await db.execute({ sql: `SELECT id FROM feedbacks WHERE id = ?`, args: [id] })
  if (cur.rows.length === 0) throw createError({ statusCode: 404, statusMessage: 'Feedback tidak ditemukan' })
  await db.execute({ sql: `UPDATE feedbacks SET status = ? WHERE id = ?`, args: [body.status, id] })
  const res = await db.execute({ sql: `SELECT * FROM feedbacks WHERE id = ?`, args: [id] })
  return res.rows[0] as any
})
