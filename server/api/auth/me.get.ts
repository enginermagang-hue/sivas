export default defineEventHandler(async (event) => {
  const auth = event.context.auth as any
  if (!auth) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  return {
    user: {
      id: auth.userId,
      nama: auth.nama,
      email: auth.email,
      role: auth.role,
      regionId: auth.regionId
    }
  }
})
