// server/api/upload.post.ts
import { uploadToDriveOAuth } from '../utils/googleDrive'

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  const file = form?.find(f => f.name === 'file')
  const folderId = getQuery(event).folderId as string | undefined

  if (!file || !file.data) {
    throw createError({ statusCode: 400, statusMessage: 'No file provided' })
  }

  const session = await useSession(event)
  const accessToken = session.get().accessToken

  if (!accessToken) {
    throw createError({ statusCode: 401, statusMessage: 'Login required first' })
  }

  const result = await uploadToDriveOAuth(
    file.filename || 'upload.txt',
    file.type || 'application/octet-stream',
    Buffer.from(file.data),
    accessToken,
    folderId
  )

  return result
})
