import { readValidatedBody, createError } from 'h3'
import { useDb } from '../../utils/db'
import { regionUpdateSchema } from '../../../lib/validations'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  const body = await readValidatedBody(event, regionUpdateSchema.parse)
  const db = useDb()

  const existing = await db.execute({
    sql: `SELECT id FROM regions WHERE id = ?`,
    args: [id]
  })
  if (existing.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Wilayah tidak ditemukan' })
  }

  const updates: string[] = []
  const args: any[] = []

  if (body.nama !== undefined) { updates.push('nama = ?'); args.push(body.nama) }
  if (body.kode !== undefined) { updates.push('kode = ?'); args.push(body.kode) }
  if (body.status !== undefined) { updates.push('status = ?'); args.push(body.status) }

  if (updates.length === 0) {
    const res = await db.execute({
      sql: `SELECT id, nama, kode, created_at FROM regions WHERE id = ?`,
      args: [id]
    })
    return res.rows[0] as any
  }

  args.push(id)
  try {
    await db.execute({
      sql: `UPDATE regions SET ${updates.join(', ')} WHERE id = ?`,
      args
    })
  } catch (e: any) {
    const msg = (e?.message ?? '').toLowerCase()
    if (msg.includes('unique') || msg.includes('constraint')) {
      throw createError({ statusCode: 409, statusMessage: 'Kode wilayah sudah digunakan' })
    }
    throw createError({ statusCode: 500, statusMessage: 'Gagal memperbarui wilayah' })
  }

  const res = await db.execute({
    sql: `SELECT id, nama, kode, created_at FROM regions WHERE id = ?`,
    args: [id]
  })
  return res.rows[0] as any
})
