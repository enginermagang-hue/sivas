import { readValidatedBody } from 'h3'
import bcrypt from 'bcryptjs'
import { useDb } from '../../utils/db'
import { createSession, SESSION_COOKIE } from '../../utils/session'
import { loginSchema } from '../../../lib/validations'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginSchema.parse)
  const db = useDb()

  const ident = String(body.email).trim().toLowerCase()
  const res = await db.execute({
    sql: 'SELECT * FROM users WHERE LOWER(TRIM(email)) = ? AND deleted_at IS NULL',
    args: [ident]
  })
  if (res.rows.length === 0) {
    throw createError({ statusCode: 401, statusMessage: 'Email atau password salah' })
  }
  const user = res.rows[0] as any
  const ok = await bcrypt.compare(body.password, user.password_hash)
  if (!ok) {
    throw createError({ statusCode: 401, statusMessage: 'Email atau password salah' })
  }
  if (user.status !== 'active') {
    throw createError({ statusCode: 403, statusMessage: 'Akun nonaktif' })
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? ''
  const ua = getRequestHeader(event, 'user-agent') ?? ''
  const { token, expires } = await createSession(user.id, ip, ua)

  await db.execute({
    sql: `UPDATE users SET last_login = datetime('now') WHERE id = ?`,
    args: [user.id]
  })

  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    expires: new Date(expires),
    secure: !import.meta.dev
  })

  return {
    user: {
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
      regionId: user.region_id
    }
  }
})
