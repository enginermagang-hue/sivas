import { getGoogleLoginConfig, getGoogleLoginAuthUrl } from '../../../utils/googleLoginOAuth'
import { newStateToken, setGoogleLoginStateCookie } from '../../../utils/googleLoginState'

function isPopupQuery(event: any) {
  return (getQuery(event) as any)?.popup === '1'
}

function sendPopupHtml(event: any, payload: { type: string; error?: string }, fallbackUrl: string) {
  setHeader(event, 'content-type', 'text/html; charset=utf-8')
  const data = JSON.stringify(payload)
  const origin = getRequestURL(event).origin
  return `<!doctype html><html><head><meta charset="utf-8"><title>Login Google</title><style>body{font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;background:#f8fafc;color:#334155}p{max-width:360px;text-align:center;line-height:1.6}a{color:#16a34a}</style></head><body><script>
    (function(){
      var d=${data}; var o=${JSON.stringify(origin)};
      try{ var ch=new BroadcastChannel('google_auth'); ch.postMessage(d); ch.close(); }catch(e){}
      try{ if(window.opener && !window.opener.closed) window.opener.postMessage(d, o); }catch(e){}
      try{ localStorage.setItem('google_auth', JSON.stringify({ ...d, _t: Date.now() })); }catch(e){}
      try{ window.close(); }catch(e){}
      setTimeout(function(){ try{ window.close(); }catch(e){} }, 500);
    })();
  <\/script><p>Permintaan diproses. Silakan tutup jendela ini jika tidak tertutup otomatis.<br><a href="#" onclick="try{window.close()}catch(e){};return false">Tutup jendela</a> &middot; <a href="${fallbackUrl}">buka manual</a></p></body></html>`
}

export default defineEventHandler((event) => {
  let config
  try {
    config = getGoogleLoginConfig()
  } catch {
    const errUrl = '/login?error=google-config'
    if (isPopupQuery(event)) return sendPopupHtml(event, { type: 'google-auth-error', error: 'google-config' }, errUrl)
    return sendRedirect(event, errUrl)
  }

  const query = getQuery(event) as any
  if (query.popup === '1') {
    setCookie(event, 'google_oauth_popup', '1', {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 600,
      secure: !import.meta.dev
    })
  }

  const state = newStateToken()
  setGoogleLoginStateCookie(event, state)
  return sendRedirect(event, getGoogleLoginAuthUrl(state, config))
})
