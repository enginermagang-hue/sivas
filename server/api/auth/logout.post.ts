import { SESSION_COOKIE, destroySession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, SESSION_COOKIE)
  await destroySession(token)

  deleteCookie(event, SESSION_COOKIE, { path: '/' })

  return { success: true }
})
