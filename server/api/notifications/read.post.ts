import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth as any
  const db = useDb()

  await db.execute({
    sql: `UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0`,
    args: [auth.userId]
  })

  return { success: true }
})
