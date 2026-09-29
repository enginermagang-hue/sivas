import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth as any
  const body = await readBody(event)
  const db = useDb()

  const items = body.items || []
  let synced = 0
  let failed = 0

  for (const item of items) {
    try {
      if (item.entity === 'activities' && item.action === 'create') {
        const payload = item.payload
        await db.execute({
          sql: `INSERT INTO activities (user_id, region_id, kategori_id, tanggal, jam_mulai, jam_selesai, deskripsi) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [payload.user_id, payload.region_id, payload.kategori_id, payload.tanggal, payload.jam_mulai || null, payload.jam_selesai || null, payload.deskripsi]
        })
        synced++
      } else if (item.entity === 'activities' && item.action === 'update') {
        const payload = item.payload
        const updates: string[] = []
        const args: any[] = []
        if (payload.tanggal !== undefined) { updates.push('tanggal = ?'); args.push(payload.tanggal) }
        if (payload.deskripsi !== undefined) { updates.push('deskripsi = ?'); args.push(payload.deskripsi) }
        if (updates.length > 0) {
          args.push(payload.id)
          await db.execute({ sql: `UPDATE activities SET ${updates.join(', ')} WHERE id = ?`, args })
        }
        synced++
      } else {
        failed++
      }
    } catch (e) {
      failed++
    }
  }

  const ids = items.map(i => i.id)
  if (ids.length > 0) {
    await db.execute({
      sql: `UPDATE sync_queue SET status = 'synced', synced_at = datetime('now') WHERE id IN (${ids.map(() => '?').join(',')})`,
      args: ids
    })
  }

  return { synced, failed }
})
