import { getConnectedDriveAccount, isInvalidGrant } from '../../utils/googleDrive'
import { getGoogleConnection } from '../../utils/googleTokenStore'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth as any
  if (!auth || auth.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Hanya admin yang dapat melihat status integrasi' })
  }

  const conn = await getGoogleConnection()
  if (!conn || !conn.refreshToken) {
    return { connected: false, expired: false, email: null, displayName: null, connectedAt: null }
  }

  try {
    const account = await getConnectedDriveAccount()
    return {
      connected: true,
      expired: false,
      email: account.email,
      displayName: account.displayName,
      connectedAt: conn.connectedAt
    }
  } catch (error: any) {
    if (isInvalidGrant(error)) {
      console.warn('[integrations] Google Drive invalid_grant — refresh token kedaluwarsa/dicabut, perlu hubungkan ulang:', (error as any)?.message ?? error)
      return { connected: false, expired: true, email: null, displayName: null, connectedAt: null }
    }
    console.error('[integrations] gagal memeriksa Google Drive:', error)
    throw createError({ statusCode: 502, statusMessage: 'Gagal memeriksa koneksi Google Drive' })
  }
})
