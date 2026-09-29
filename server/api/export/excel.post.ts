import ExcelJS from 'exceljs'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const db = useDb()

  let sql = `SELECT a.id, a.tanggal, u.nama as user_nama, r.nama as region_nama, c.nama as kategori_nama, a.jam_mulai, a.jam_selesai, a.deskripsi
             FROM activities a
             JOIN users u ON u.id = a.user_id
             JOIN regions r ON r.id = a.region_id
             JOIN categories c ON c.id = a.kategori_id
             WHERE a.deleted_at IS NULL`
  const args: any[] = []

  if (body.tanggal_dari) {
    sql += ` AND a.tanggal >= ?`
    args.push(body.tanggal_dari)
  }
  if (body.tanggal_sampai) {
    sql += ` AND a.tanggal <= ?`
    args.push(body.tanggal_sampai)
  }
  if (body.region_id) {
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
