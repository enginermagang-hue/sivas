import { readValidatedBody } from 'h3'
import { useDb } from '../../utils/db'
import { activityCreateSchema } from '../../../lib/validations'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth as any
  const body = await readValidatedBody(event, activityCreateSchema.parse)
  const db = useDb()

  if (auth.role === 'anggota' && body.user_id !== auth.userId) {
    throw createError({ statusCode: 403, statusMessage: 'Tidak diizinkan membuat aktivitas untuk orang lain' })
  }
  if (auth.role === 'koordinator') {
    const member = await db.execute({
      sql: `SELECT id FROM users WHERE id = ? AND region_id = ? AND deleted_at IS NULL`,
      args: [body.user_id, auth.regionId]
    })
    if (member.rows.length === 0) {
      throw createError({ statusCode: 403, statusMessage: 'Anggota tidak berada di wilayah Anda' })
    }
  }

  await db.execute({
    sql: `INSERT INTO activities (user_id, region_id, kategori_id, tanggal, jam_mulai, jam_selesai, deskripsi, npsn, nama_sekolah) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [body.user_id, body.region_id, body.kategori_id, body.tanggal, body.jam_mulai || null, body.jam_selesai || null, body.deskripsi, body.npsn || null, body.nama_sekolah || null]
  })

  const newActivity = await db.execute({
    sql: `SELECT a.id, a.user_id, a.region_id, a.kategori_id, a.tanggal, a.jam_mulai, a.jam_selesai, a.deskripsi, a.npsn, a.nama_sekolah, a.created_at,
                  u.nama as user_nama, r.nama as region_nama, c.nama as kategori_nama
           FROM activities a
           JOIN users u ON u.id = a.user_id
           JOIN regions r ON r.id = a.region_id
           JOIN categories c ON c.id = a.kategori_id
           WHERE a.id = last_insert_rowid()`
  })

  return newActivity.rows[0] as any
})
