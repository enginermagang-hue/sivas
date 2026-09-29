export const useOfflineSync = () => {
  const isOnline = useOnline()
  const syncPending = ref(false)

  async function addToSyncQueue(action: string, entity: string, payload: any) {
    const db = useDb()
    const auth = useAuth()
    await db.execute({
      sql: `INSERT INTO sync_queue (user_id, action, entity, payload) VALUES (?, ?, ?, ?)`,
      args: [auth.user?.value?.id, action, entity, JSON.stringify(payload)]
    })
  }

  async function getPendingSync() {
    const db = useDb()
    const auth = useAuth()
    const res = await db.execute({
      sql: `SELECT * FROM sync_queue WHERE user_id = ? AND status = 'pending' ORDER BY created_at ASC`,
      args: [auth.user?.value?.id]
    })
    return (res.rows as any[]).map(r => ({
      ...r,
      payload: JSON.parse(r.payload)
    }))
  }

  async function syncNow() {
    if (!isOnline.value) return
    syncPending.value = true
    try {
      const pending = await getPendingSync()
      if (pending.length === 0) return

      const result = await $fetch('/api/sync/submit', {
        method: 'POST',
        body: { items: pending }
      })

      const db = useDb()
      await db.execute({
        sql: `UPDATE sync_queue SET status = 'synced', synced_at = datetime('now') WHERE id IN (${pending.map(() => '?').join(',')})`,
        args: pending.map(p => p.id)
      })

      return result
    } catch (e) {
      console.error('[sync] failed', e)
    } finally {
      syncPending.value = false
    }
  }

  watch(isOnline, (online) => {
    if (online) {
      syncNow()
    }
  })

  return {
    isOnline,
    syncPending,
    addToSyncQueue,
    getPendingSync,
    syncNow
  }
}
