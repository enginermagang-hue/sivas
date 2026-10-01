import { readValidatedBody } from 'h3'
import { useDb } from '../../utils/db'
import { activityUpdateSchema } from '../../../lib/validations'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  const body = await readValidatedBody(event, activityUpdateSchema.parse)
  const db = useDb()
  const auth = event.context.auth as any

  const existing = await db.execute({
    sql: `SELECT * FROM activities WHERE id = ? AND deleted_at IS NULL`,
    args: [id]
  })
  if (existing.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Aktivitas tidak ditemukan' })
  }

  const activity = existing.rows[0] as any
  if (auth.role === 'koordinator' && activity.region_id !== auth.regionId) {
    throw createError({ statusCode: 403, statusMessage: 'Tidak diizinkan mengubah aktivitas ini' })
  }
  if (auth.role === 'anggota' && activity.user_id !== auth.userId) {
    throw createError({ statusCode: 403, statusMessage: 'Tidak diizinkan mengubah aktivitas ini' })
  }

  const updates: string[] = []
  const args: any[] = []

  if (body.region_id !== undefined) { updates.push('region_id = ?'); args.push(body.region_id) }
  if (body.kategori_id !== undefined) { updates.push('kategori_id = ?'); args.push(body.kategori_id) }
  if (body.tanggal !== undefined) { updates.push('tanggal = ?'); args.push(body.tanggal) }
  if (body.jam_mulai !== undefined) { updates.push('jam_mulai = ?'); args.push(body.jam_mulai) }
  if (body.jam_selesai !== undefined) { updates.push('jam_selesai = ?'); args.push(body.jam_selesai) }
  if (body.deskripsi !== undefined) { updates.push('deskripsi = ?'); args.push(body.deskripsi) }
  if (body.npsn !== undefined) { updates.push('npsn = ?'); args.push(body.npsn || null) }
  if (body.nama_sekolah !== undefined) { updates.push('nama_sekolah = ?'); args.push(body.nama_sekolah || null) }

  if (updates.length > 0) {
    args.push(id)
    await db.execute({
      sql: `UPDATE activities SET ${updates.join(', ')} WHERE id = ?`,
      args
    })
  }

  const updated = await db.execute({
    sql: `SELECT a.id, a.user_id, a.region_id, a.kategori_id, a.tanggal, a.jam_mulai, a.jam_selesai, a.deskripsi, a.npsn, a.nama_sekolah, a.created_at,
                  u.nama as user_nama, r.nama as region_nama, c.nama as kategori_nama
           FROM activities a
           JOIN users u ON u.id = a.user_id
           JOIN regions r ON r.id = a.region_id
           JOIN categories c ON c.id = a.kategori_id
           WHERE a.id = ?`,
    args: [id]
  })

  return updated.rows[0] as any
})
