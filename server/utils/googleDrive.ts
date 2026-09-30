import { google } from 'googleapis'
import { useDb } from './db'

const SCOPES = ['https://www.googleapis.com/auth/drive.file']

function getAuth() {
  const config = useRuntimeConfig()
  const raw = (config.googleDriveServiceAccount as string) || ''
  if (!raw) {
    throw createError({ statusCode: 500, statusMessage: 'Google Drive service account belum dikonfigurasi' })
  }
  const credentials = JSON.parse(raw)
  return google.auth.fromJSON(credentials).getClient() as Promise<any>
}

async function getDrive() {
  const auth = await getAuth()
  return google.drive({ version: 'v3', auth })
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
    body: Buffer.from(data)
  }
  const res = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id,name,mimeType,size'
  })
  return {
    id: res.data.id,
    nama: res.data.name,
    tipe_mime: res.data.mimeType,
    ukuran_bytes: Number(res.data.size || 0)
  }
}

export async function deleteDriveFile(fileId: string) {
  const drive = await getDrive()
  await drive.files.delete({
    fileId
  })
}

export async function getDriveFileBuffer(fileId: string) {
  const drive = await getDrive()
  const res = await drive.files.get({
    fileId,
    alt: 'media'
  }, { responseType: 'stream' })

  return new Promise<{ buffer: Buffer; mimeType?: string }>((resolve, reject) => {
    const chunks: Buffer[] = []
    const stream = res.data as any
    if (!stream || typeof stream.on !== 'function') {
      return reject(new Error('Invalid response stream'))
    }
    stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    stream.on('end', () => {
      resolve({
        buffer: Buffer.concat(chunks),
        mimeType: (res as any).headers?.['content-type']
      })
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

// --- OAuth2-based upload using user token ---
export async function uploadToDriveOAuth(
  fileName: string,
  mimeType: string,
  data: Buffer,
  accessToken: string,
  folderId?: string
) {
  const oAuth2Client = new google.auth.OAuth2()
  oAuth2Client.setCredentials({ access_token: accessToken })

  const drive = google.drive({ version: 'v3', auth: oAuth2Client })

  const safeName = fileName.replace(/[\\/]/g, '-')
  const fileMetadata: any = {
    name: safeName,
    parents: folderId ? [folderId] : undefined
  }

  const media = {
    mimeType,
    body: Buffer.from(data)
  }

  const res = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id,name,mimeType,size'
  })

  return {
    id: res.data.id,
    nama: res.data.name,
    tipe_mime: res.data.mimeType,
    ukuran_bytes: Number(res.data.size || 0)
  }
}
