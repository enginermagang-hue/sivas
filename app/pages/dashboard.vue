<script setup lang="ts">
const { user } = useAuth()

watchEffect(() => {
  const role = user.value?.role
  if (role === 'admin') {
    navigateTo('/admin/users')
  } else if (role === 'koordinator') {
    navigateTo('/koordinator/members')
  } else if (role === 'anggota') {
    navigateTo('/anggota/activities')
  } else if (role === 'kepala') {
    navigateTo('/kepala/dashboard')
  } else {
    navigateTo('/login')
  }
})
</script>
