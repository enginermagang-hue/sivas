import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth as any
  const db = useDb()

  if (auth.role === 'kepala' || auth.role === 'admin') {
    const today = new Date().toISOString().split('T')[0]
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

    const [usersCount, regionsCount, todayActivities, monthActivities] = await Promise.all([
      db.execute({ sql: `SELECT COUNT(*) as c FROM users WHERE deleted_at IS NULL` }),
      db.execute({ sql: `SELECT COUNT(*) as c FROM regions` }),
      db.execute({ sql: `SELECT COUNT(*) as c FROM activities WHERE deleted_at IS NULL AND tanggal = ?`, args: [today] }),
      db.execute({ sql: `SELECT COUNT(*) as c FROM activities WHERE deleted_at IS NULL AND tanggal >= ?`, args: [firstDayOfMonth] })
    ])

    return {
      role: auth.role,
      totalUsers: Number((usersCount.rows[0] as any).c),
      totalRegions: Number((regionsCount.rows[0] as any).c),
      today: Number((todayActivities.rows[0] as any).c),
      thisMonth: Number((monthActivities.rows[0] as any).c)
    }
  }

  if (auth.role === 'koordinator') {
    const today = new Date().toISOString().split('T')[0]
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

    const [membersCount, todayActivities, monthActivities] = await Promise.all([
      db.execute({ sql: `SELECT COUNT(*) as c FROM users WHERE region_id = ? AND deleted_at IS NULL`, args: [auth.regionId] }),
      db.execute({ sql: `SELECT COUNT(*) as c FROM activities WHERE region_id = ? AND deleted_at IS NULL AND tanggal = ?`, args: [auth.regionId, today] }),
      db.execute({ sql: `SELECT COUNT(*) as c FROM activities WHERE region_id = ? AND deleted_at IS NULL AND tanggal >= ?`, args: [auth.regionId, firstDayOfMonth] })
    ])

    return {
      role: auth.role,
      totalAnggota: Number((membersCount.rows[0] as any).c),
      today: Number((todayActivities.rows[0] as any).c),
      thisMonth: Number((monthActivities.rows[0] as any).c)
    }
  }

  if (auth.role === 'anggota') {
    const today = new Date().toISOString().split('T')[0]
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

    const [todayActivities, monthActivities] = await Promise.all([
      db.execute({ sql: `SELECT COUNT(*) as c FROM activities WHERE user_id = ? AND deleted_at IS NULL AND tanggal = ?`, args: [auth.userId, today] }),
      db.execute({ sql: `SELECT COUNT(*) as c FROM activities WHERE user_id = ? AND deleted_at IS NULL AND tanggal >= ?`, args: [auth.userId, firstDayOfMonth] })
    ])

    return {
      role: auth.role,
      today: Number((todayActivities.rows[0] as any).c),
      thisMonth: Number((monthActivities.rows[0] as any).c)
    }
  }

  return { role: auth.role }
})
