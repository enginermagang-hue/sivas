import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth as any
  if (!auth) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const db = useDb()
  const isAdmin = auth.role === 'admin'

  // Non-admin: hanya feedback miliknya
  if (!isAdmin) {
    const res = await db.execute({
      sql: `SELECT f.*, u.nama AS user_nama, u.email AS user_email, u.role AS user_role
            FROM feedbacks f JOIN users u ON u.id = f.user_id
            WHERE f.user_id = ? ORDER BY f.created_at DESC`,
      args: [auth.userId]
    })
    return res.rows as any[]
  }

  // Admin: semua feedback (+ info user & wilayah)
  const res = await db.execute({
    sql: `SELECT f.*, u.nama AS user_nama, u.email AS user_email, u.role AS user_role, u.avatar, u.google_avatar,
                 r.nama AS region_nama
          FROM feedbacks f
          JOIN users u ON u.id = f.user_id
          LEFT JOIN regions r ON r.id = u.region_id
          ORDER BY f.created_at DESC`
  })
  return res.rows as any[]
})
