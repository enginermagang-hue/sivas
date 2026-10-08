import { google } from 'googleapis'
import { randomUUID } from 'node:crypto'
import { DRIVE_SCOPES } from '../../utils/googleDrive'

const OAUTH_STATE_COOKIE = 'google_oauth_state'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth as any
  if (!auth || auth.role !== 'admin') {
    console.warn('[google oauth] ditolak — role:', (auth as any)?.role ?? null, 'userId:', (auth as any)?.userId ?? null)
    throw createError({ statusCode: 403, statusMessage: `Hanya admin yang dapat menghubungkan Google Drive (terdeteksi: ${String(auth?.role ?? 'tidak login')})` })
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

  const state = randomUUID()
  setCookie(event, OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.dev,
    path: '/',
    maxAge: 600
  })

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: DRIVE_SCOPES,
    state
  })

  return sendRedirect(event, authUrl, 302)
})
