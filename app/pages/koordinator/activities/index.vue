<template>
<UDashboardPanel id="koordinator-activities">
  <template #header>
    <UDashboardNavbar title="Aktivitas Wilayah">
      <template #leading>
        <UDashboardSidebarCollapse />
      </template>
    </UDashboardNavbar>
  </template>

  <template #body>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Aktivitas Wilayah</h1>
    </div>

    <div class="space-y-4">
      <UCard v-if="activities.length === 0">
        <p class="text-center text-gray-500 dark:text-gray-400 py-8">Belum ada aktivitas di wilayah Anda</p>
      </UCard>
      <ActivityCard v-for="activity in activities" :key="activity.id" :activity="activity" />
    </div>
  </template>
</UDashboardPanel>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { user } = useAuth()
const activities = ref<any[]>([])

async function loadActivities() {
  const data = await $fetch('/api/activities')
  activities.value = data
}

onMounted(async () => {
  await loadActivities()
})
</script>
