import { readValidatedBody } from 'h3'
import { useDb } from '../../utils/db'
import { commentCreateSchema } from '../../../lib/validations'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth as any
  const body = await readValidatedBody(event, commentCreateSchema.parse)
  const db = useDb()

  const activity = await db.execute({
    sql: `SELECT user_id, region_id FROM activities WHERE id = ? AND deleted_at IS NULL`,
    args: [body.activity_id]
  })
  const act = activity.rows[0] as any
  if (!act) {
    throw createError({ statusCode: 404, statusMessage: 'Aktivitas tidak ditemukan' })
  }
  if (auth.role === 'koordinator' && act.region_id !== auth.regionId) {
    throw createError({ statusCode: 403, statusMessage: 'Tidak diizinkan mengomentari aktivitas luar wilayah' })
  }

  await db.execute({
    sql: `INSERT INTO comments (activity_id, user_id, komentar) VALUES (?, ?, ?)`,
    args: [body.activity_id, auth.userId, body.komentar]
  })

  const newComment = await db.execute({
    sql: `SELECT id, activity_id, user_id, komentar, created_at FROM comments WHERE id = last_insert_rowid()`
  })

  return newComment.rows[0] as any
})
