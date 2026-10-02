import { readValidatedBody } from 'h3'
import { useDb } from '../../utils/db'
import { commentCreateSchema } from '../../../lib/validations'
import { notifyCommentCreated } from '../../utils/notifications'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth as any
  const body = await readValidatedBody(event, commentCreateSchema.parse)
  const db = useDb()

  const activity = await db.execute({
    sql: `SELECT a.user_id, a.region_id, u.role AS owner_role FROM activities a JOIN users u ON u.id = a.user_id WHERE a.id = ? AND a.deleted_at IS NULL`,
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

  const row = newComment.rows[0] as any
  try {
    await notifyCommentCreated(db, {
      activityId: Number(body.activity_id),
      authorId: Number(auth.userId),
      authorName: String(auth.nama || 'Seseorang'),
      authorRole: String(auth.role || ''),
      komentar: String(row.komentar || ''),
      regionId: Number(act.region_id),
      ownerId: Number(act.user_id),
      ownerRole: String((act as any).owner_role || '')
    })
  } catch {}

  return row
})
