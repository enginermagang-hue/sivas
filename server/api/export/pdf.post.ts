export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const auth = event.context.auth as any

  const params = new URLSearchParams()
  if (body.tanggal_dari) params.set('tanggal_dari', body.tanggal_dari)
  if (body.tanggal_sampai) params.set('tanggal_sampai', body.tanggal_sampai)
  if (body.region_id) params.set('region_id', String(body.region_id))
  if (body.kategori_id) params.set('kategori_id', String(body.kategori_id))

  const query = params.toString()
  let url: string

  if (auth.role === 'koordinator') {
    url = `/koordinator/export/preview${query ? '?' + query : ''}`
  } else if (auth.role === 'anggota') {
    url = `/anggota/export/preview${query ? '?' + query : ''}`
  } else {
    url = `/kepala/export/preview${query ? '?' + query : ''}`
  }

  return { url }
})