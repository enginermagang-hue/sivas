export const GOOGLE_LOGIN_STATE_COOKIE = 'google_login_state'
export const GOOGLE_LOGIN_STATE_MAX_AGE = 600

export function newStateToken(): string {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
}

export function setGoogleLoginStateCookie(event: any, state: string) {
  setCookie(event, GOOGLE_LOGIN_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: GOOGLE_LOGIN_STATE_MAX_AGE,
    secure: !import.meta.dev
  })
}

export function getGoogleLoginStateCookie(event: any): string | undefined {
  return getCookie(event, GOOGLE_LOGIN_STATE_COOKIE)
}
