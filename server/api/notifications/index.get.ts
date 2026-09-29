import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth as any
  const query = getQuery(event)
  const db = useDb()

  let sql = `SELECT id, user_id, title, message, entity, entity_id, read, created_at
             FROM notifications WHERE user_id = ?`
  const args: any[] = [auth.userId]

  if (query.unread === '1') {
    sql += ` AND read = 0`
  }

  sql += ` ORDER BY created_at DESC`

  const res = await db.execute({ sql, args })
  return (res.rows as any[]).map(r => ({
    id: r.id,
    user_id: r.user_id,
    title: r.title,
    message: r.message,
    entity: r.entity,
    entity_id: r.entity_id,
    read: r.read,
    created_at: r.created_at
  }))
})
