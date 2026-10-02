import { useDb } from './db'

type DB = ReturnType<typeof useDb>

async function createNotification(
  db: DB,
  data: { userId: number; title: string; message: string; entity: string; entityId?: number | null }
) {
  await db.execute({
    sql: `INSERT INTO notifications (user_id, title, message, entity, entity_id) VALUES (?, ?, ?, ?, ?)`,
    args: [data.userId, data.title, data.message, data.entity, data.entityId ?? null]
  })
}

function snippet(text: string, max = 60): string {
  const t = String(text || '').trim().replace(/\s+/g, ' ')
  if (t.length <= max) return t
  return t.slice(0, max) + '…'
}

export async function notifyActivityCreated(
  db: DB,
  opts: { activityId: number; authorId: number; authorName: string; authorRole: string; regionId: number; deskripsi: string }
) {
  const desc = snippet(opts.deskripsi, 80)
  const title = 'Aktivitas Baru'
  const message = `${opts.authorName} menambahkan aktivitas baru: "${desc}"`

  const recipients = new Map<number, true>()

  // koordinator: hanya jika aktivitas diinput oleh anggota di wilayahnya
  if (opts.authorRole === 'anggota') {
    const kos = await db.execute({
      sql: `SELECT id FROM users WHERE role='koordinator' AND region_id = ? AND status='active' AND deleted_at IS NULL AND id != ?`,
      args: [opts.regionId, opts.authorId]
    })
    for (const r of kos.rows as any[]) recipients.set(r.id, true)
  }

  // kepala: setiap aktivitas terbaru (kecuali milik sendiri)
  const kepalas = await db.execute({
    sql: `SELECT id FROM users WHERE role='kepala' AND status='active' AND deleted_at IS NULL AND id != ?`,
    args: [opts.authorId]
  })
  for (const r of kepalas.rows as any[]) recipients.set(r.id, true)

  for (const [userId] of recipients) {
    await createNotification(db, {
      userId,
      title,
      message,
      entity: 'activity',
      entityId: opts.activityId
    })
  }
}

export async function notifyCommentCreated(
  db: DB,
  opts: {
    activityId: number
    authorId: number
    authorName: string
    authorRole: string
    komentar: string
    regionId: number
    ownerId: number
    ownerRole: string
  }
) {
  const text = snippet(opts.komentar, 80)
  const title = 'Komentar Baru'
  const baseMessage = `${opts.authorName} mengomentari aktivitas: "${text}"`

  const recipients = new Map<number, string>()

  // 1) pemilik aktivitas — sesuai aturan role
  if (opts.ownerId !== opts.authorId) {
    let shouldNotifyOwner = false
    if (opts.ownerRole === 'anggota') {
      shouldNotifyOwner = ['koordinator', 'kepala'].includes(opts.authorRole)
    } else if (opts.ownerRole === 'koordinator') {
      shouldNotifyOwner = ['anggota', 'kepala'].includes(opts.authorRole)
    } else if (opts.ownerRole === 'kepala') {
      shouldNotifyOwner = opts.authorRole !== 'kepala'
    } else {
      shouldNotifyOwner = true
    }
    if (shouldNotifyOwner) recipients.set(opts.ownerId, 'owner')
  }

  // 2) koordinator wilayah — jika komentar dari anggota/kepala
  if (['anggota', 'kepala'].includes(opts.authorRole)) {
    const kos = await db.execute({
      sql: `SELECT id FROM users WHERE role='koordinator' AND region_id = ? AND status='active' AND deleted_at IS NULL`,
      args: [opts.regionId]
    })
    for (const r of kos.rows as any[]) {
      if (r.id !== opts.authorId && !recipients.has(r.id)) recipients.set(r.id, 'koordinator-region')
    }
  }

  // 3) semua kepala — setiap komentar kecuali dari diri sendiri
  const kepalas = await db.execute({
    sql: `SELECT id FROM users WHERE role='kepala' AND status='active' AND deleted_at IS NULL`,
    args: []
  })
  for (const r of kepalas.rows as any[]) {
    if (r.id !== opts.authorId && !recipients.has(r.id)) recipients.set(r.id, 'kepala-global')
  }

  for (const [userId] of recipients) {
    await createNotification(db, {
      userId,
      title,
      message: baseMessage,
      entity: 'comment',
      entityId: opts.activityId
    })
  }
}
