import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const res = await db.execute({
    sql: `SELECT id, nama, kode, status, created_at FROM regions ORDER BY nama ASC`
  })
  return (res.rows as any[]).map(r => ({
    id: r.id,
    nama: r.nama,
    kode: r.kode,
    status: r.status,
    created_at: r.created_at
  }))
})
