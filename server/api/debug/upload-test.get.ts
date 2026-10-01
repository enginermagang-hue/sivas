import { google } from 'googleapis'

export default defineEventHandler(async (event) => {
  // Hanya boleh dijalankan di mode dev
  if (process.env.NODE_ENV !== 'development') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Debug route hanya tersedia di development'
    })
  }

  try {
    const fileName = `test-upload-${Date.now()}.txt`
    const content = `Ini adalah file tes upload ke Google Drive (OAuth2).\nWaktu: ${new Date().toISOString()}`

    // Ambil token dari session
    const session = await useSession(event)
    const accessToken = session.get().accessToken

    if (!accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Access token diperlukan. Kunjungi /api/auth/google terlebih dahulu.'
      })
    }

    const oAuth2Client = new google.auth.OAuth2()
    oAuth2Client.setCredentials({ access_token: accessToken })

    const drive = google.drive({ version: 'v3', auth: oAuth2Client })

    const res = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: 'text/plain'
      },
      media: {
        mimeType: 'text/plain',
        body: Buffer.from(content)
      },
      fields: 'id,name,mimeType,size'
    })

    return {
      success: true,
      message: 'Upload berhasil!',
      fileId: res.data.id,
      nama: res.data.name,
      url: `https://drive.google.com/file/d/${res.data.id}/view`,
      ukuran: Number(res.data.size || 0)
    }
  } catch (error: any) {
    console.error('[upload-test]', error)
    return {
      success: false,
      message: error?.message || 'Upload gagal',
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }
  }
})
