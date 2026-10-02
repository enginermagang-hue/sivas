import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const auth = event.context.auth as any
  const query = getQuery(event)

  let sql = `SELECT a.id, a.user_id, a.region_id, a.kategori_id, a.tanggal, a.jam_mulai, a.jam_selesai, a.deskripsi, a.npsn, a.nama_sekolah, a.created_at,
                    u.nama as user_nama, u.role as user_role,
                    r.nama as region_nama,
                    c.nama as kategori_nama, c.warna as kategori_warna
             FROM activities a
             JOIN users u ON u.id = a.user_id
             JOIN regions r ON r.id = a.region_id
             JOIN categories c ON c.id = a.kategori_id
             WHERE a.deleted_at IS NULL`
  const args: any[] = []

  // Role scoping — kepala: lihat semua (no filter)
  // anggota: hanya aktivitas sendiri (ignore scope/region/user_id spoofing)
  // koordinator: wilayah (default) | self | anggota tertentu — semua tetap dibatasi dalam regionId
  if (auth.role === 'anggota') {
    sql += ` AND a.user_id = ?`
    args.push(auth.userId)
  } else if (auth.role === 'koordinator') {
    const scope = String(query.scope || 'wilayah')
    const anggotaId = query.anggota_id ? Number(query.anggota_id) : undefined
    const legacyUserId = query.user_id ? Number(Array.isArray(query.user_id) ? query.user_id[0] : query.user_id) : undefined
    const targetAnggotaId = anggotaId ?? (scope === 'anggota' ? legacyUserId : undefined)

    if (scope === 'self') {
      sql += ` AND a.user_id = ?`
      args.push(auth.userId)
    } else if (scope === 'anggota' && targetAnggotaId) {
      sql += ` AND a.user_id = ? AND a.region_id = ?`
      args.push(targetAnggotaId, auth.regionId)
    } else {
      // wilayah: seluruh wilayah koordinator; tetap batasi region
      sql += ` AND a.region_id = ?`
      args.push(auth.regionId)
      // optional legacy filter within wilayah
      if (legacyUserId && scope !== 'anggota') {
        // allow ?user_id= filter but still scoped to wilayah via region_id above — add extra user filter
        sql += ` AND a.user_id = ?`
        args.push(legacyUserId)
      }
    }
  }

  if (query.tanggal) {
    sql += ` AND a.tanggal = ?`
    args.push(String(query.tanggal))
  }
  if (query.tanggal_dari) {
    sql += ` AND a.tanggal >= ?`
    args.push(String(query.tanggal_dari))
  }
  if (query.tanggal_sampai) {
    sql += ` AND a.tanggal <= ?`
    args.push(String(query.tanggal_sampai))
  }
  // region_id: only kepala may filter by region; koordinator/anggota ignored (already scoped)
  if (auth.role === 'kepala' && query.region_id) {
    sql += ` AND a.region_id = ?`
    args.push(Number(query.region_id))
  }
  if (query.kategori_id) {
    sql += ` AND a.kategori_id = ?`
    args.push(Number(query.kategori_id))
  }
  // user_id filter: only kepala/admin may use it directly; koordinator/anggota already scoped above
  if ((auth.role === 'kepala' || auth.role === 'admin') && query.user_id) {
    const ids = Array.isArray(query.user_id)
      ? query.user_id.map(Number)
      : [Number(query.user_id)]
    if (ids.length === 1) {
      sql += ` AND a.user_id = ?`
      args.push(ids[0])
    } else if (ids.length > 1) {
      const placeholders = ids.map(() => '?').join(', ')
      sql += ` AND a.user_id IN (${placeholders})`
      ids.forEach(id => args.push(id))
    }
  }

  sql += ` ORDER BY a.tanggal DESC, a.created_at DESC`

  const res = await db.execute({ sql, args })
  return (res.rows as any[]).map(r => ({
    id: r.id,
    user_id: r.user_id,
    user_nama: r.user_nama,
    user_role: r.user_role,
    region_id: r.region_id,
    region_nama: r.region_nama,
    kategori_id: r.kategori_id,
    kategori_nama: r.kategori_nama,
    kategori_warna: r.kategori_warna,
    tanggal: r.tanggal,
    jam_mulai: r.jam_mulai,
    jam_selesai: r.jam_selesai,
    deskripsi: r.deskripsi,
    npsn: r.npsn,
    nama_sekolah: r.nama_sekolah,
    created_at: r.created_at
  }))
})
