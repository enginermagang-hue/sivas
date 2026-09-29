import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  const db = useDb()
  const auth = event.context.auth as any

  const res = await db.execute({
    sql: `SELECT a.id, a.user_id, a.region_id, a.kategori_id, a.tanggal, a.jam_mulai, a.jam_selesai, a.deskripsi, a.created_at,
                  u.nama as user_nama, u.role as user_role,
                  r.nama as region_nama,
                  c.nama as kategori_nama, c.warna as kategori_warna
           FROM activities a
           JOIN users u ON u.id = a.user_id
           JOIN regions r ON r.id = a.region_id
           JOIN categories c ON c.id = a.kategori_id
           WHERE a.id = ? AND a.deleted_at IS NULL`,
    args: [id]
  })
  if (res.rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Aktivitas tidak ditemukan' })
  }

  const activity = res.rows[0] as any
  if (auth.role === 'koordinator' && activity.region_id !== auth.regionId) {
    throw createError({ statusCode: 403, statusMessage: 'Tidak diizinkan melihat aktivitas ini' })
  }
  if (auth.role === 'anggota' && activity.user_id !== auth.userId) {
    throw createError({ statusCode: 403, statusMessage: 'Tidak diizinkan melihat aktivitas ini' })
  }

  return activity
})
