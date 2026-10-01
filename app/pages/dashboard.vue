<script setup lang="ts">
const { user } = useAuth()

watchEffect(() => {
  const role = user.value?.role
  if (role === 'admin') {
    navigateTo('/admin/dashboard')
  } else if (role === 'koordinator') {
    navigateTo('/koordinator/dashboard')
  } else if (role === 'anggota') {
    navigateTo('/anggota/dashboard')
  } else if (role === 'kepala') {
    navigateTo('/kepala/dashboard')
  } else {
    navigateTo('/login')
  }
})
</script>
