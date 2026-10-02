import ExcelJS from 'exceljs'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const auth = event.context.auth as any
  const db = useDb()

  if (auth.role === 'kepala') {
    throw createError({ statusCode: 403, statusMessage: 'Kepala tidak dapat melakukan export' })
  }

  let sql = `SELECT a.id, a.tanggal, u.nama as user_nama, r.nama as region_nama, c.nama as kategori_nama, a.jam_mulai, a.jam_selesai, a.deskripsi
             FROM activities a
             JOIN users u ON u.id = a.user_id
             JOIN regions r ON r.id = a.region_id
             JOIN categories c ON c.id = a.kategori_id
             WHERE a.deleted_at IS NULL`
  const args: any[] = []

  // Role-based scoping: anggota = own only; koordinator = scope-controlled within region
  if (auth.role === 'anggota') {
    sql += ` AND a.user_id = ?`
    args.push(auth.userId)
  } else if (auth.role === 'koordinator') {
    const scope = String(body.scope || 'wilayah')
    const anggotaId = body.anggota_id ? Number(body.anggota_id) : (body.user_id ? Number(body.user_id) : undefined)
    if (scope === 'self') {
      sql += ` AND a.user_id = ?`
      args.push(auth.userId)
    } else if (scope === 'anggota' && anggotaId) {
      sql += ` AND a.user_id = ? AND a.region_id = ?`
      args.push(anggotaId, auth.regionId)
    } else {
      sql += ` AND a.region_id = ?`
      args.push(auth.regionId)
    }
  }

  if (body.tanggal_dari) {
    sql += ` AND a.tanggal >= ?`
    args.push(body.tanggal_dari)
  }
  if (body.tanggal_sampai) {
    sql += ` AND a.tanggal <= ?`
    args.push(body.tanggal_sampai)
  }
  // region_id: ignore for anggota/koordinator (already scoped); only admin/kepala could use
  if (auth.role !== 'anggota' && auth.role !== 'koordinator' && body.region_id) {
    sql += ` AND a.region_id = ?`
    args.push(Number(body.region_id))
  }
  if (body.kategori_id) {
    sql += ` AND a.kategori_id = ?`
    args.push(Number(body.kategori_id))
  }

  sql += ` ORDER BY a.tanggal DESC, a.created_at DESC`

  const res = await db.execute({ sql, args })
  const rows = (res.rows as any[]).map((r, idx) => ({
    No: idx + 1,
    Tanggal: r.tanggal,
    Wilayah: r.region_nama,
    Nama: r.user_nama,
    Kategori: r.kategori_nama,
    'Jam Mulai': r.jam_mulai || '-',
    'Jam Selesai': r.jam_selesai || '-',
    Deskripsi: r.deskripsi
  }))

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Laporan Aktivitas')

  sheet.columns = Object.keys(rows[0] || {}).map(key => ({
    header: key,
    key,
    width: key === 'Deskripsi' ? 50 : 20
  }))

  sheet.addRows(rows)

  const buffer = await workbook.xlsx.writeBuffer()
  setResponseHeaders(event, {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': 'attachment; filename="laporan-aktivitas.xlsx"'
  })

  return buffer
})
