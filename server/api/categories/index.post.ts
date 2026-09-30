import { readValidatedBody } from 'h3'
import { useDb } from '../../utils/db'
import { categoryCreateSchema } from '../../../lib/validations'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, categoryCreateSchema.parse)
  const db = useDb()

  await db.execute({
    sql: `INSERT INTO categories (nama, warna, icon) VALUES (?, ?, ?)`,
    args: [body.nama, body.warna || '#3B82F6', body.icon || null]
  })

  const newCategory = await db.execute({
    sql: `SELECT id, nama, warna, icon, created_at FROM categories WHERE id = last_insert_rowid()`
  })

  return newCategory.rows[0] as any
})
