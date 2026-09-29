import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const res = await db.execute({
    sql: `SELECT id, nama, warna, icon, created_at FROM categories ORDER BY nama ASC`
  })
  return (res.rows as any[]).map(r => ({
    id: r.id,
    nama: r.nama,
    warna: r.warna,
    icon: r.icon,
    created_at: r.created_at
  }))
})
