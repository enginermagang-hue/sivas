// server/api/auth/google/callback.get.ts
import { getOAuthClient } from '../../../utils/oauthClient'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const oAuth2Client = getOAuthClient()

  try {
    const { tokens } = await oAuth2Client.getToken(query.code as string)
    oAuth2Client.setCredentials(tokens)

    const session = useSession(event)
    await session.set({ accessToken: tokens.access_token })

    sendRedirect(event, '/upload-test', 302)
  } catch (err) {
    console.error('[OAuth callback error]', err)
    throw createError({ statusCode: 500, statusMessage: 'OAuth callback failed' })
  }
})
