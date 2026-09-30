import { deleteGoogleConnection, getGoogleConnection } from '../../../utils/googleTokenStore'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth as any
  if (!auth || auth.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Hanya admin yang dapat memutuskan koneksi' })
  }

  const conn = await getGoogleConnection()
  const refreshToken = conn?.refreshToken ?? ''
  if (refreshToken) {
    try {
      const body = new URLSearchParams({ token: refreshToken })
      await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body
      })
    } catch (error) {
      console.error('[integrations] gagal revoke token Google:', error)
    }
  }

  await deleteGoogleConnection()

  return { success: true, message: 'Koneksi Google Drive diputus dan token dicabut.' }
})
