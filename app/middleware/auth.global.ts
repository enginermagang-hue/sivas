export default defineNuxtRouteMiddleware(async (to) => {
  const { user, loaded, fetchMe } = useAuth()
  if (!loaded.value) await fetchMe()

  const publicPages = ['/login']
  const isPublic = publicPages.includes(to.path) || to.path.startsWith('/panduan')

  if (!user.value && !isPublic) {
    return navigateTo('/login')
  }
  if (user.value && to.path === '/login') {
    return navigateTo('/')
  }
  if (user.value && to.path.startsWith('/admin') && user.value.role !== 'admin') {
    return navigateTo('/')
  }
  if (user.value && to.path.startsWith('/kepala') && user.value.role !== 'kepala') {
    throw createError({ statusCode: 403, statusMessage: 'Tidak diizinkan mengakses halaman Kepala' })
  }
  if (user.value && to.path.startsWith('/koordinator') && user.value.role !== 'koordinator') {
    throw createError({ statusCode: 403, statusMessage: 'Tidak diizinkan mengakses halaman Koordinator' })
  }
  if (user.value && to.path.startsWith('/anggota') && user.value.role !== 'anggota') {
    throw createError({ statusCode: 403, statusMessage: 'Tidak diizinkan mengakses halaman Anggota' })
  }
})
