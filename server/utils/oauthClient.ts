// server/utils/oauthClient.ts
import { google } from 'googleapis'

export function getOAuthClient() {
  const config = useRuntimeConfig()
  return new google.auth.OAuth2(
    config.googleOAuthClientId,
    config.googleOAuthClientSecret,
    config.googleRedirectUri
  )
}
