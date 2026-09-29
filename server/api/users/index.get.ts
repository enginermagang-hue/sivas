import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const res = await db.execute({
    sql: `SELECT id, email, nama, role, region_id, status, last_login, created_at FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC`
  })
  const users = (res.rows as any[]).map(u => ({
    id: u.id,
    email: u.email,
    nama: u.nama,
    role: u.role,
    region_id: u.region_id,
    status: u.status,
    last_login: u.last_login,
    created_at: u.created_at
  }))
  return users
})
