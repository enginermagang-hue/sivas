import { readValidatedBody } from 'h3'
import { useDb } from '../../utils/db'
import { regionCreateSchema } from '../../../lib/validations'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, regionCreateSchema.parse)
  const db = useDb()

  const res = await db.execute({
    sql: `INSERT INTO regions (nama, kode) VALUES (?, ?)`,
    args: [body.nama, body.kode]
  })

  const newRegion = await db.execute({
    sql: `SELECT id, nama, kode, created_at FROM regions WHERE id = ?`,
    args: [Number((res as any).meta?.last_row_id || (res as any).lastInsertRowId)]
  })

  return newRegion.rows[0] as any
})
