export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const auth = event.context.auth as any

  if (auth.role === 'kepala') {
    throw createError({ statusCode: 403, statusMessage: 'Kepala tidak dapat melakukan export' })
  }

  const params = new URLSearchParams()
  if (body.tanggal_dari) params.set('tanggal_dari', body.tanggal_dari)
  if (body.tanggal_sampai) params.set('tanggal_sampai', body.tanggal_sampai)
  if (body.kategori_id) params.set('kategori_id', String(body.kategori_id))

  // Scope-aware: keep scope/anggota_id for koordinator
  if (auth.role === 'koordinator') {
    const scope = String(body.scope || 'wilayah')
    params.set('scope', scope)
    if (scope === 'anggota' && (body.anggota_id || body.user_id)) {
      params.set('anggota_id', String(body.anggota_id ?? body.user_id))
    }
  }

  const query = params.toString()
  let url: string

  if (auth.role === 'koordinator') {
    url = `/koordinator/export/preview${query ? '?' + query : ''}`
  } else if (auth.role === 'anggota') {
    url = `/anggota/export/preview${query ? '?' + query : ''}`
  } else {
    throw createError({ statusCode: 403, statusMessage: 'Tidak diizinkan' })
  }

  return { url }
})
