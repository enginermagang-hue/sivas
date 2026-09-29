import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth as any
  const db = useDb()

  const res = await db.execute({
    sql: `SELECT * FROM sync_queue WHERE user_id = ? AND status = 'pending' ORDER BY created_at ASC`,
    args: [auth.userId]
  })

  return (res.rows as any[]).map(r => ({
    ...r,
    payload: JSON.parse(r.payload)
  }))
})
