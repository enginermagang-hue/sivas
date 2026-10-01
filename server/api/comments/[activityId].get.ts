import { readValidatedBody } from 'h3'
import { useDb } from '../../utils/db'
import { commentCreateSchema } from '../../../lib/validations'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth as any
  const activityId = Number(event.context.params?.activityId)
  const db = useDb()

  if (!Number.isFinite(activityId)) {
    throw createError({ statusCode: 400, statusMessage: 'Aktivitas tidak valid' })
  }

  const comments = await db.execute({
    sql: `SELECT c.id, c.activity_id, c.user_id, c.komentar, c.created_at, u.nama AS user_nama, u.role AS user_role FROM comments c LEFT JOIN users u ON u.id = c.user_id WHERE c.activity_id = ? ORDER BY c.created_at ASC`,
    args: [activityId]
  })

  return comments.rows as any
})
