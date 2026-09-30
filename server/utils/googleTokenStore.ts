import { useDb } from './db'

export type GoogleConnection = {
  refreshToken: string
  email: string | null
  displayName: string | null
  scopes: string | null
  connectedAt: string | null
}

function isMissingTable(error: unknown): boolean {
  const message = String((error as any)?.message ?? error ?? '').toLowerCase()
  return message.includes('no such table')
}

export async function getGoogleConnection(): Promise<GoogleConnection | null> {
  const db = useDb()
  try {
    const res = await db.execute({
      sql: `SELECT refresh_token, email, display_name, scopes, connected_at
            FROM google_connections WHERE id = 1`,
      args: []
    })
    if (res.rows.length === 0) return null
    const row = res.rows[0] as any
    return {
      refreshToken: String(row.refresh_token ?? ''),
      email: row.email != null ? String(row.email) : null,
      displayName: row.display_name != null ? String(row.display_name) : null,
      scopes: row.scopes != null ? String(row.scopes) : null,
      connectedAt: row.connected_at != null ? String(row.connected_at) : null
    }
  } catch (error) {
    if (isMissingTable(error)) {
      console.warn('[google] tabel google_connections belum ada, jalankan npm run migrate')
      return null
    }
    throw error
  }
}

export async function hasGoogleConnection(): Promise<boolean> {
  const conn = await getGoogleConnection()
  return !!conn && conn.refreshToken.length > 0
}

export async function saveGoogleConnection(input: {
  refreshToken: string
  email?: string | null
  displayName?: string | null
  scopes?: string | null
}): Promise<void> {
  const db = useDb()
  try {
    await db.execute({
      sql: `INSERT INTO google_connections (id, refresh_token, email, display_name, scopes, connected_at, updated_at)
              VALUES (1, ?, ?, ?, ?, datetime('now'), datetime('now'))
              ON CONFLICT(id) DO UPDATE SET
                refresh_token = excluded.refresh_token,
                email = excluded.email,
                display_name = excluded.display_name,
                scopes = excluded.scopes,
                updated_at = datetime('now')`,
      args: [
        input.refreshToken,
        input.email ?? null,
        input.displayName ?? null,
        input.scopes ?? null
      ]
    })
  } catch (error) {
    if (isMissingTable(error)) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Tabel google_connections belum ada. Jalankan npm run migrate terlebih dahulu.'
      })
    }
    throw error
  }
}

export async function deleteGoogleConnection(): Promise<void> {
  const db = useDb()
  try {
    await db.execute({ sql: 'DELETE FROM google_connections WHERE id = 1', args: [] })
  } catch (error) {
    if (isMissingTable(error)) return
    throw error
  }
}
