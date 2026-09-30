import bcrypt from 'bcryptjs'
import { readValidatedBody, createError } from 'h3'
import { useDb } from '../../utils/db'
import { userCreateSchema } from '../../../lib/validations'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, userCreateSchema.parse)
  const db = useDb()

  if (body.role === 'koordinator' && body.region_id) {
    const existing = await db.execute({
      sql: `SELECT id FROM users WHERE role = 'koordinator' AND region_id = ? AND deleted_at IS NULL`,
      args: [body.region_id]
    })
    if (existing.rows.length > 0) {
      throw createError({ statusCode: 409, statusMessage: 'Wilayah ini sudah memiliki koordinator' })
    }
  }

  const passwordHash = await bcrypt.hash(body.password, 10)

  await db.execute({
    sql: `INSERT INTO users (email, password_hash, nama, role, region_id, status) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [body.email, passwordHash, body.nama, body.role, body.region_id || null, body.status || 'active']
  })

  const newUser = await db.execute({
    sql: `SELECT id, email, nama, role, region_id, status, created_at FROM users WHERE id = last_insert_rowid()`
  })

  return newUser.rows[0] as any
})
