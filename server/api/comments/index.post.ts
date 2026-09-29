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
  if (activity.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Aktivitas tidak ditemukan' })
  }

  const act = activity.rows[0] as any
  if (auth.role === 'koordinator' && act.region_id !== auth.regionId) {
    throw createError({ statusCode: 403, statusMessage: 'Tidak diizinkan berkomentar pada aktivitas ini' })
  }
  if (auth.role === 'anggota' && act.user_id !== auth.userId) {
    throw createError({ statusCode: 403, statusMessage: 'Tidak diizinkan berkomentar pada aktivitas ini' })
  }

  const res = await db.execute({
    sql: `INSERT INTO comments (activity_id, user_id, komentar) VALUES (?, ?, ?)`,
    args: [body.activity_id, auth.userId, body.komentar]
  })

  const comment = await db.execute({
    sql: `SELECT cm.id, cm.activity_id, cm.user_id, cm.komentar, cm.created_at, u.nama as user_nama
           FROM comments cm
           JOIN users u ON u.id = cm.user_id
           WHERE cm.id = ?`,
    args: [Number((res as any).meta?.last_row_id || (res as any).lastInsertRowId)]
  })

  return comment.rows[0] as any
})
