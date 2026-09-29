import { readValidatedBody } from 'h3'
import { useDb } from '../../utils/db'
import { categoryUpdateSchema } from '../../../lib/validations'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  const body = await readValidatedBody(event, categoryUpdateSchema.parse)
  const db = useDb()

  const existing = await db.execute({
    sql: `SELECT id FROM categories WHERE id = ?`,
    args: [id]
  })
  if (existing.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Kategori tidak ditemukan' })
  }

  const updates: string[] = []
  const args: any[] = []

  if (body.nama !== undefined) { updates.push('nama = ?'); args.push(body.nama) }
  if (body.warna !== undefined) { updates.push('warna = ?'); args.push(body.warna) }
  if (body.icon !== undefined) { updates.push('icon = ?'); args.push(body.icon) }

  if (updates.length === 0) {
    const res = await db.execute({
      sql: `SELECT id, nama, warna, icon, created_at FROM categories WHERE id = ?`,
      args: [id]
    })
    return res.rows[0] as any
  }

  args.push(id)
  await db.execute({
    sql: `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
    args
  })

  const res = await db.execute({
    sql: `SELECT id, nama, warna, icon, created_at FROM categories WHERE id = ?`,
    args: [id]
  })
  return res.rows[0] as any
})
