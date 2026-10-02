import { useDb } from '../../utils/db'
import { feedbackCreateSchema } from '../../../lib/validations'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth as any
  if (!auth) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const body = await readValidatedBody(event, feedbackCreateSchema.parse)
  const db = useDb()
  await db.execute({
    sql: `INSERT INTO feedbacks (user_id, kategori, pesan, rating, status) VALUES (?, ?, ?, ?, 'unread')`,
    args: [auth.userId, body.kategori, body.pesan, body.rating ?? null]
  })
  const res = await db.execute({ sql: `SELECT * FROM feedbacks WHERE id = last_insert_rowid()` })
  return res.rows[0] as any
})
