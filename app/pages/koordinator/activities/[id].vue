<template>
  <ActivityDetailView back-to="/koordinator/activities" />
</template>

<script setup lang="ts">
import ActivityDetailView from '~/components/ActivityDetailView.vue'

definePageMeta({
  layout: 'default'
})

const { user } = useAuth()

if (user.value?.role !== 'koordinator') {
  throw createError({ statusCode: 403, statusMessage: 'Tidak diizinkan' })
}
</script>
