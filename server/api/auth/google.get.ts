// server/api/auth/google.get.ts
import { getOAuthClient } from '../../utils/oauthClient'

export default defineEventHandler(async (event) => {
  const oAuth2Client = getOAuthClient()
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.file']
  })

  sendRedirect(event, authUrl, 302)
})
