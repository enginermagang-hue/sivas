import bcrypt from 'bcryptjs'
import { useDb } from '../../utils/db'
import { profileUpdateSchema } from '../../../lib/validations'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth as any
  if (!auth) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const body = await readValidatedBody(event, profileUpdateSchema.parse)
  const db = useDb()

  const cur = await db.execute({
    sql: `SELECT * FROM users WHERE id = ? AND deleted_at IS NULL`,
    args: [auth.userId]
  })
  if (cur.rows.length === 0) throw createError({ statusCode: 404, statusMessage: 'User tidak ditemukan' })
  const current = cur.rows[0] as any

  const updates: string[] = []
  const args: any[] = []

  if (body.nama !== undefined) {
    const v = String(body.nama).trim()
    if (v) { updates.push('nama = ?'); args.push(v) }
  }
  if (body.email !== undefined) {
    const v = String(body.email).trim().toLowerCase()
    if (v && v !== String(current.email).toLowerCase()) {
      const dup = await db.execute({
        sql: `SELECT id FROM users WHERE LOWER(TRIM(email)) = ? AND id != ? AND deleted_at IS NULL`,
        args: [v, auth.userId]
      })
      if (dup.rows.length > 0) throw createError({ statusCode: 409, statusMessage: 'Email sudah digunakan' })
      updates.push('email = ?'); args.push(v)
    }
  }
  if (body.avatar !== undefined) {
    const v = body.avatar === null ? null : String(body.avatar).trim() || null
    updates.push('avatar = ?'); args.push(v)
  }

  const wantsPw = !!(body.password && String(body.password).trim() !== '')
  if (wantsPw) {
    const ok = await bcrypt.compare(String(body.current_password || ''), current.password_hash)
    if (!ok) throw createError({ statusCode: 401, statusMessage: 'Password saat ini salah' })
    const hash = await bcrypt.hash(String(body.password), 10)
    updates.push('password_hash = ?'); args.push(hash)
  }

  if (updates.length > 0) {
    args.push(auth.userId)
    try {
      await db.execute({ sql: `UPDATE users SET ${updates.join(', ')} WHERE id = ?`, args })
    } catch (e: any) {
      if (/no such column/i.test(String(e?.message || '')) && /avatar/i.test(String(e?.message || ''))) {
        // DB belum di-migrate → coba ulang tanpa kolom avatar
        const idx = updates.indexOf('avatar = ?')
        if (idx !== -1) {
          updates.splice(idx, 1)
          args.splice(idx, 1)
          if (updates.length > 0) await db.execute({ sql: `UPDATE users SET ${updates.join(', ')} WHERE id = ?`, args })
        } else throw e
        throw createError({ statusCode: 503, statusMessage: 'Database belum di-migrate (kolom avatar belum ada). Jalankan: npm run migrate' })
      } else throw e
    }
  }

  let res: any
  try {
    res = await db.execute({
      sql: `SELECT u.id, u.nama, u.email, u.role, u.region_id, u.status, u.avatar, u.google_avatar, u.created_at, u.last_login,
                 r.nama AS region_nama, r.kode AS region_kode
           FROM users u LEFT JOIN regions r ON r.id = u.region_id WHERE u.id = ?`,
      args: [auth.userId]
    })
  } catch (e: any) {
    if (/no such column/i.test(String(e?.message || '')) && /avatar/i.test(String(e?.message || ''))) {
      res = await db.execute({
        sql: `SELECT u.id, u.nama, u.email, u.role, u.region_id, u.status, u.google_avatar, u.created_at, u.last_login,
                 r.nama AS region_nama, r.kode AS region_kode
           FROM users u LEFT JOIN regions r ON r.id = u.region_id WHERE u.id = ?`,
        args: [auth.userId]
      })
      ;(res.rows[0] as any).avatar = null
    } else throw e
  }
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
