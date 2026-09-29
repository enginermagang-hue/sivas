import { readValidatedBody } from 'h3'
import bcrypt from 'bcryptjs'
import { useDb } from '../../utils/db'
import { userCreateSchema } from '../../../lib/validations'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, userCreateSchema.parse)
  const db = useDb()

  const passwordHash = await bcrypt.hash(body.password, 10)
  const res = await db.execute({
    sql: `INSERT INTO users (email, password_hash, nama, role, region_id, status) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [body.email, passwordHash, body.nama, body.role, body.region_id || null, body.status || 'active']
  })

  const newUser = await db.execute({
    sql: `SELECT id, email, nama, role, region_id, status, created_at FROM users WHERE id = ?`,
    args: [Number((res as any).meta?.last_row_id || (res as any).lastInsertRowId)]
  })

  return (newUser.rows[0] as any)
})
