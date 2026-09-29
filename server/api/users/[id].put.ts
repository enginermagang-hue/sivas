import { readValidatedBody } from 'h3'
import bcrypt from 'bcryptjs'
import { useDb } from '../../utils/db'
import { userUpdateSchema } from '../../../lib/validations'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  const body = await readValidatedBody(event, userUpdateSchema.parse)
  const db = useDb()

  const existing = await db.execute({
    sql: `SELECT * FROM users WHERE id = ? AND deleted_at IS NULL`,
    args: [id]
  })
  if (existing.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'User tidak ditemukan' })
  }

  const updates: string[] = []
  const args: any[] = []

  if (body.nama !== undefined) { updates.push('nama = ?'); args.push(body.nama) }
  if (body.email !== undefined) { updates.push('email = ?'); args.push(body.email) }
  if (body.role !== undefined) { updates.push('role = ?'); args.push(body.role) }
  if (body.region_id !== undefined) { updates.push('region_id = ?'); args.push(body.region_id) }
  if (body.status !== undefined) { updates.push('status = ?'); args.push(body.status) }
  if (body.password && body.password.trim() !== '') {
    const hash = await bcrypt.hash(body.password, 10)
    updates.push('password_hash = ?')
    args.push(hash)
  }

  if (updates.length === 0) {
    const res = await db.execute({
      sql: `SELECT id, email, nama, role, region_id, status, created_at FROM users WHERE id = ?`,
      args: [id]
    })
    return res.rows[0] as any
  }

  args.push(id)
  await db.execute({
    sql: `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    args
  })

  const res = await db.execute({
    sql: `SELECT id, email, nama, role, region_id, status, created_at FROM users WHERE id = ?`,
    args: [id]
  })
  return res.rows[0] as any
})
