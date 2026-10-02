import { useDb } from '../../../../utils/db'
import { createSession, SESSION_COOKIE } from '../../../../utils/session'
import { exchangeCodeForToken, getGoogleUserFromTokens } from '../../../../utils/googleLoginOAuth'
import { GOOGLE_LOGIN_STATE_COOKIE, getGoogleLoginStateCookie } from '../../../../utils/googleLoginState'

function isPopupRequest(event: any) {
  return getCookie(event, 'google_oauth_popup') === '1'
}

function popupResponse(event: any, payload: { type: string; error?: string }, fallbackUrl: string) {
  const isPopup = isPopupRequest(event)
  deleteCookie(event, 'google_oauth_popup')
  if (isPopup) {
    setHeader(event, 'content-type', 'text/html; charset=utf-8')
    const data = JSON.stringify(payload)
    const origin = getRequestURL(event).origin
    const isSuccess = payload.type === 'google-auth-success'
    const title = isSuccess ? 'Login berhasil' : 'Login Google'
    const msg = isSuccess ? 'Berhasil masuk. Jendela ini akan tertutup otomatis.' : 'Permintaan diproses. Silakan tutup jendela ini jika tidak tertutup otomatis.'
     return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;background:#f8fafc;color:#334155}p{max-width:360px;text-align:center;line-height:1.6}a{color:#16a34a}</style></head><body><script>
      (function(){
        var d=${data}; var o=${JSON.stringify(origin)};
        try{ var ch=new BroadcastChannel('google_auth'); ch.postMessage(d); ch.close(); }catch(e){}
        try{ if(window.opener && !window.opener.closed) window.opener.postMessage(d, o); }catch(e){}
        try{ window.close(); }catch(e){}
        setTimeout(function(){ try{ window.close(); }catch(e){} }, 600);
      })();
    <\/script><p>${msg}<br><a href="#" onclick="try{window.close()}catch(e){};return false">Tutup jendela</a> &middot; <a href="${fallbackUrl}">buka manual</a></p></body></html>`
  }
  return sendRedirect(event, fallbackUrl)
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const error = query.error

  if (error) {
    if (error === 'access_denied') {
      return popupResponse(event, { type: 'google-auth-error', error: 'google-cancelled' }, '/login?error=google-cancelled')
    }
    return popupResponse(event, { type: 'google-auth-error', error: 'google' }, '/login?error=google')
  }

  const code = typeof query.code === 'string' ? query.code : ''
  const state = typeof query.state === 'string' ? query.state : ''
  const stateCookie = getGoogleLoginStateCookie(event)

  if (!code || !state || state !== stateCookie) {
    deleteCookie(event, GOOGLE_LOGIN_STATE_COOKIE)
    return popupResponse(event, { type: 'google-auth-error', error: 'google' }, '/login?error=google')
  }
  deleteCookie(event, GOOGLE_LOGIN_STATE_COOKIE)

  const db = useDb()
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? ''
  const ua = getRequestHeader(event, 'user-agent') ?? ''

  let googleUser: { googleId: string; email: string; nama: string }
  try {
    const tokens = await exchangeCodeForToken(code)
    googleUser = await getGoogleUserFromTokens(tokens)
  } catch (e: any) {
    console.error('Google token/userinfo error:', e)
    return popupResponse(event, { type: 'google-auth-error', error: 'google' }, '/login?error=google')
  }

  const emailNorm = googleUser.email.trim().toLowerCase()
  const googleId = googleUser.googleId

  try {
    let user: any = null

    try {
      const byGoogle = await db.execute({
        sql: `SELECT * FROM users WHERE google_id = ? AND deleted_at IS NULL LIMIT 1`,
        args: [googleId]
      })
      if (byGoogle.rows.length > 0) {
        user = byGoogle.rows[0] as any
      }
    } catch (e: any) {
      const m = String(e?.message ?? '').toLowerCase()
      if (m.includes('no such column') && m.includes('google_id')) {
        console.warn('[google-login] kolom google_id belum ada, jalankan npm run migrate — fallback ke email')
      } else {
        throw e
      }
    }
    if (!user) {
      const byEmail = await db.execute({
        sql: `SELECT * FROM users WHERE LOWER(TRIM(email)) = ? AND deleted_at IS NULL LIMIT 1`,
        args: [emailNorm]
      })
      if (byEmail.rows.length > 0) {
        user = byEmail.rows[0] as any
      }
    }

    if (!user) {
      console.warn(`[google-login] unregistered email attempt: ${emailNorm} (googleId=${googleId}) ip=${ip}`)
      return popupResponse(event, { type: 'google-auth-error', error: 'google-unregistered' }, '/login?error=google-unregistered')
    }
    if (user.status !== 'active') {
      console.warn(`[google-login] inactive user: ${user.id} email=${emailNorm} ip=${ip}`)
      return popupResponse(event, { type: 'google-auth-error', error: 'google-inactive' }, '/login?error=google-inactive')
    }

    if (user.google_id !== googleId) {
      const owner = await db.execute({
        sql: `SELECT id FROM users WHERE google_id = ? AND id != ? LIMIT 1`,
        args: [googleId, user.id]
      })
      if (owner.rows.length > 0) {
        console.error(`[google-login] google_id collision: googleId=${googleId} already owned by ${(owner.rows[0] as any).id}, attempted link to ${user.id}`)
        return popupResponse(event, { type: 'google-auth-error', error: 'google' }, '/login?error=google')
      }
      const dbEmailNorm = (user.email || '').trim().toLowerCase()
      if (dbEmailNorm && dbEmailNorm !== emailNorm) {
        console.warn(`[google-login] email mismatch before link: db=${dbEmailNorm} google=${emailNorm}`)
        return popupResponse(event, { type: 'google-auth-error', error: 'google-unregistered' }, '/login?error=google-unregistered')
      }
      try {
        await db.execute({
          sql: 'UPDATE users SET google_id = ? WHERE id = ?',
          args: [googleId, user.id]
        })
      } catch (e: any) {
        if (String(e?.message || '').includes('UNIQUE') || String(e?.cause || '').includes('UNIQUE')) {
          console.error('[google-login] unique violation on google_id link', e)
          return popupResponse(event, { type: 'google-auth-error', error: 'google' }, '/login?error=google')
        }
        throw e
      }
    }

    const { token, expires } = await createSession(user.id, ip, ua)
    await db.execute({
      sql: `UPDATE users SET last_login = datetime('now') WHERE id = ?`,
      args: [user.id]
    })

    setCookie(event, SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      expires: new Date(expires),
      secure: !import.meta.dev
    })

    return popupResponse(event, { type: 'google-auth-success' }, '/')
  } catch (e: any) {
    console.error('Google login DB error:', e)
    return popupResponse(event, { type: 'google-auth-error', error: 'google' }, '/login?error=google')
  }
})
