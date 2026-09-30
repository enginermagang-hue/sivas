import { google } from 'googleapis'
import { getConnectedDriveAccount } from '../../../utils/googleDrive'
import { saveGoogleConnection } from '../../../utils/googleTokenStore'

const OAUTH_STATE_COOKIE = 'google_oauth_state'
const INTEGRATIONS_PAGE = '/admin/integrations'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth as any
  if (!auth || auth.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Hanya admin yang dapat menyelesaikan koneksi Google Drive' })
  }

  if (event.method !== 'GET') {
    throw createError({ statusCode: 405, statusMessage: 'Metode tidak didukung' })
  }

  const query = getQuery(event)
  if (query.error) {
    return sendRedirect(event, `${INTEGRATIONS_PAGE}?google=denied`)
  }

  const expectedState = getCookie(event, OAUTH_STATE_COOKIE)
  deleteCookie(event, OAUTH_STATE_COOKIE, { path: '/' })
  if (!query.code || !expectedState || query.state !== expectedState) {
    throw createError({ statusCode: 400, statusMessage: 'State OAuth tidak valid atau sudah kedaluwarsa' })
  }

  const config = useRuntimeConfig()
  const clientId = String(config.googleOauthClientId ?? '').trim()
  const clientSecret = String(config.googleOauthClientSecret ?? '').trim()
  const redirectUri = String(config.googleRedirectUri ?? '').trim()
  if (!clientId || !clientSecret || !redirectUri) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Konfigurasi NUXT_GOOGLE_OAUTH_CLIENT_ID/SECRET/REDIRECT_URI belum lengkap'
    })
  }

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
  let refreshToken = ''
  let scope = ''
  try {
    const { tokens } = await oAuth2Client.getToken(String(query.code))
    refreshToken = String(tokens.refresh_token || '').trim()
    scope = String(tokens.scope || '').trim()
  } catch (error) {
    console.error('[oauth callback] gagal menukar kode:', error)
    return sendRedirect(event, `${INTEGRATIONS_PAGE}?google=error`)
  }

  if (!refreshToken) {
    return sendRedirect(event, `${INTEGRATIONS_PAGE}?google=no_token`)
  }

  await saveGoogleConnection({ refreshToken, scopes: scope || null })

  try {
    const account = await getConnectedDriveAccount()
    await saveGoogleConnection({
      refreshToken,
      email: account.email,
      displayName: account.displayName,
      scopes: scope || null
    })
  } catch (error) {
    console.warn('[oauth callback] gagal membaca info akun Google:', error)
  }

  return sendRedirect(event, `${INTEGRATIONS_PAGE}?google=connected`)
})
