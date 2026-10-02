import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth as any
  if (!auth) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const db = useDb()
  let res: any
  try {
    res = await db.execute({
      sql: `SELECT u.id, u.nama, u.email, u.role, u.region_id, u.status, u.avatar, u.google_avatar, u.created_at, u.last_login,
                 r.nama AS region_nama, r.kode AS region_kode
          FROM users u LEFT JOIN regions r ON r.id = u.region_id
          WHERE u.id = ? AND u.deleted_at IS NULL`,
      args: [auth.userId]
    })
  } catch (e: any) {
    if (/no such column/i.test(String(e?.message || '')) && /avatar/i.test(String(e?.message || ''))) {
      res = await db.execute({
        sql: `SELECT u.id, u.nama, u.email, u.role, u.region_id, u.status, u.google_avatar, u.created_at, u.last_login,
                 r.nama AS region_nama, r.kode AS region_kode
          FROM users u LEFT JOIN regions r ON r.id = u.region_id
          WHERE u.id = ? AND u.deleted_at IS NULL`,
        args: [auth.userId]
      })
      ;(res.rows[0] as any).avatar = null
    } else throw e
  }
  if (res.rows.length === 0) throw createError({ statusCode: 404, statusMessage: 'User tidak ditemukan' })
  const user = res.rows[0] as any

  let koordinator: any = null
  if (user.region_id) {
    const k = await db.execute({
      sql: `SELECT id, nama, email FROM users WHERE role = 'koordinator' AND region_id = ? AND deleted_at IS NULL LIMIT 1`,
      args: [user.region_id]
    })
    if (k.rows.length > 0) koordinator = k.rows[0]
  }

  return { user, koordinator }
})
