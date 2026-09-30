import { google } from 'googleapis'
import { Readable } from 'node:stream'
import { getGoogleConnection } from './googleTokenStore'

export const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.file']
export const DRIVE_NOT_CONNECTED_MESSAGE =
  'Google Drive belum terhubung. Buka halaman Integrations lalu tekan "Hubungkan Google Drive".'
export const DRIVE_CONNECTION_EXPIRED_MESSAGE =
  'Koneksi Google Drive kedaluwarsa atau dicabut (invalid_grant). Tekan "Hubungkan ulang" di halaman Integrations lalu selesaikan consent Google.'

export function isInvalidGrant(error: unknown): boolean {
  const message = String((error as any)?.message ?? error ?? '')
  const errors = Array.isArray((error as any)?.errors) ? (error as any).errors : []
  return (
    /invalid_grant/i.test(message) ||
    errors.some((item: any) => String(item?.reason ?? '').toLowerCase() === 'invalid_grant')
  )
}

function readOAuthClientConfig() {
  const config = useRuntimeConfig()
  const clientId = String(config.googleOauthClientId ?? '').trim()
  const clientSecret = String(config.googleOauthClientSecret ?? '').trim()
  const redirectUri = String(config.googleRedirectUri ?? '').trim()

  if (!clientId || !clientSecret || !redirectUri) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Kredensial OAuth Google belum lengkap di environment.'
    })
  }
  return { clientId, clientSecret, redirectUri }
}

export async function getOAuth2Client() {
  const { clientId, clientSecret, redirectUri } = readOAuthClientConfig()
  const conn = await getGoogleConnection()
  const refreshToken = conn?.refreshToken ?? ''
  if (!refreshToken) {
    throw createError({ statusCode: 401, statusMessage: DRIVE_NOT_CONNECTED_MESSAGE })
  }
  const client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
  client.setCredentials({ refresh_token: refreshToken })
  return client
}

async function getDrive() {
  return google.drive({ version: 'v3', auth: await getOAuth2Client() })
}

export async function uploadToDrive(fileName: string, mimeType: string, data: Buffer, folderId?: string) {
  const drive = await getDrive()
  const safeName = fileName.replace(/[\\/]/g, '-')
  const fileMetadata: any = {
    name: safeName,
    parents: folderId ? [folderId] : undefined
  }
  const media = {
    mimeType,
    // googleapis v182 (fetch-based uploader) membutuhkan stream, bukan Buffer.
    // Bungkus dalam array agar Readable.from mendorong satu chunk utuh,
    // bukan mengiterasi byte per byte.
    body: Readable.from([Buffer.from(data)])
  }
  const res = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id,name,mimeType,size'
  })
  return {
    id: res.data.id as string,
    nama: res.data.name as string,
    tipe_mime: res.data.mimeType as string,
    ukuran_bytes: Number(res.data.size || 0)
  }
}

export async function deleteDriveFile(fileId: string) {
  const drive = await getDrive()
  try {
    await drive.files.delete({ fileId })
  } catch (error: any) {
    const status = Number(error?.code ?? error?.status ?? 0)
    const reason = String(error?.errors?.[0]?.reason ?? '')
    if (status === 404 || reason === 'notFound') return
    throw error
  }
}

export async function getDriveFileBuffer(fileId: string) {
  const drive = await getDrive()
  const res = await drive.files.get(
    {
      fileId,
      alt: 'media'
    },
    { responseType: 'stream' }
  )

  return new Promise<{ buffer: Buffer; mimeType?: string }>((resolve, reject) => {
    const chunks: Buffer[] = []
    const stream = res.data as any
    if (!stream || typeof stream.on !== 'function') {
      return reject(new Error('Respons Google Drive tidak berupa stream'))
    }
    stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    stream.on('end', () => {
      const headers = res.headers as any
      const contentType =
        typeof headers?.get === 'function' ? headers.get('content-type') : headers?.['content-type']
      resolve({ buffer: Buffer.concat(chunks), mimeType: contentType ?? undefined })
    })
    stream.on('error', reject)
  })
}

export async function findOrCreateFolder(name: string, parentId?: string) {
  const drive = await getDrive()
  const query = parentId
    ? `name='${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    : `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`

  const res = await drive.files.list({
    q: query,
    fields: 'files(id,name)',
    pageSize: 10
  })

  const found = res.data.files?.[0]
  if (found?.id) return found.id

  const fileMetadata: any = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentId ? [parentId] : undefined
  }
  const createRes = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id'
  })
  return createRes.data.id as string
}

export async function findOrCreateActivityFolder(pathParts: string[]) {
  const cleanParts = pathParts.map((part) => part.trim()).filter(Boolean)
  if (cleanParts.length === 0) {
    throw createError({ statusCode: 500, statusMessage: 'Nama folder Google Drive tidak valid' })
  }

  let folderId: string | undefined
  for (const part of cleanParts) {
    folderId = await findOrCreateFolder(part, folderId)
  }
  return folderId as string
}

export async function getConnectedDriveAccount() {
  const drive = await getDrive()
  const res = await drive.about.get({ fields: 'user' })
  return {
    email: res.data.user?.emailAddress ?? null,
    displayName: res.data.user?.displayName ?? null
  }
}
