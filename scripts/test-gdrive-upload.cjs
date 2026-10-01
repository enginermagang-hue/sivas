/**
 * Skrip CLI untuk tes upload ke Google Drive (Shared Drive)
 * Jalankan: node scripts/test-gdrive-upload.cjs
 */
const { google } = require('googleapis')
const path = require('path')
const fs = require('fs')

const keyPath = path.join(__dirname, '..', 'server', 'utils', 'gdrive-keys', 'sipker-510206-006333cf7fa8.json')
const SA_KEY = JSON.parse(fs.readFileSync(keyPath, 'utf-8'))

const SCOPES = ['https://www.googleapis.com/auth/drive.file']
const FOLDER_ID = process.env.GDRIVE_FOLDER_ID || 'root'

async function main() {
  const auth = new google.auth.GoogleAuth({
    credentials: SA_KEY,
    scopes: SCOPES
  })

  const drive = google.drive({ version: 'v3', auth })

  const fileName = `test-sivas-${Date.now()}.txt`
  const content = `Hello Sivas!\nCreated: ${new Date().toISOString()}`

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType: 'text/plain',
      parents: FOLDER_ID !== 'root' ? [FOLDER_ID] : undefined
    },
    media: {
      mimeType: 'text/plain',
      body: content
    },
    fields: 'id,name,mimeType,size',
    supportsAllDrives: true,
    ...(FOLDER_ID !== 'root' && { driveId: FOLDER_ID })
  })

  const file = res.data
  console.log('✅ Upload berhasil!')
  console.log('File ID  :', file.id)
  console.log('Nama     :', file.name)
  console.log('Size     :', file.size, 'bytes')
  if (FOLDER_ID !== 'root') {
    console.log('URL      : https://drive.google.com/file/d/' + file.id + '/view')
  } else {
    console.log('URL      : https://drive.google.com/file/d/' + file.id + '/view')
  }
  console.log('\n👉 Buka folder Google Drive yang kamu share untuk melihat file ini.')
}

main().catch(err => {
  console.error('❌ Upload gagal:', err.message || err)
  console.error(err.errors || '')
  process.exit(1)
})
