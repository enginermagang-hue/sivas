import { readValidatedBody, createError } from 'h3'
import { useDb } from '../../utils/db'
import { regionCreateSchema } from '../../../lib/validations'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, regionCreateSchema.parse)
  const db = useDb()

  try {
    await db.execute({
      sql: `INSERT INTO regions (nama, kode, status) VALUES (?, ?, ?)`,
      args: [body.nama, body.kode, body.status ?? 'active']
    })
  } catch (e: any) {
    const msg = (e?.message ?? '').toLowerCase()
    if (msg.includes('unique') || msg.includes('constraint')) {
      throw createError({ statusCode: 409, statusMessage: 'Kode wilayah sudah digunakan' })
    }
    throw createError({ statusCode: 500, statusMessage: 'Gagal menyimpan wilayah' })
  }

  const newRegion = await db.execute({
    sql: `SELECT id, nama, kode, status, created_at FROM regions WHERE id = last_insert_rowid()`
  })

  return newRegion.rows[0] as any
})
