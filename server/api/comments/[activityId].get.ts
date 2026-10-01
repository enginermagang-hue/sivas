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
    sql: `SELECT id, activity_id, user_id, komentar, created_at FROM comments WHERE activity_id = ? ORDER BY created_at ASC`,
    args: [activityId]
  })

  return comments.rows as any
})
