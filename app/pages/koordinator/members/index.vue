<template>
<UDashboardPanel id="koordinator-members">
  <template #header>
    <UDashboardNavbar title="Daftar Anggota Wilayah">
      <template #leading>
        <UDashboardSidebarCollapse />
      </template>
    </UDashboardNavbar>
  </template>

  <template #body>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Daftar Anggota Wilayah</h1>
    </div>

    <UCard>
      <UTable :rows="members" :columns="columns">
        <template #nama-data="{ row }">
          <div class="font-medium text-gray-900 dark:text-white">{{ row.nama }}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">{{ row.email }}</div>
        </template>
        <template #status-data="{ row }">
          <UBadge :color="row.status === 'active' ? 'success' : 'error'" variant="soft" size="sm">
            {{ row.status === 'active' ? 'Aktif' : 'Nonaktif' }}
          </UBadge>
        </template>
        <template #actions-data="{ row }">
          <UButton icon="i-lucide-activity" color="neutral" variant="ghost" size="sm" :to="`/koordinator/activities?user_id=${row.id}`">
            Aktivitas
          </UButton>
          <UButton icon="i-lucide-plus-circle" color="primary" variant="ghost" size="sm" :to="`/koordinator/input?user_id=${row.id}`">
            Input
          </UButton>
        </template>
      </UTable>
    </UCard>
  </template>
</UDashboardPanel>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { user } = useAuth()
const members = ref<any[]>([])

const columns = [
  { id: 'nama', key: 'nama', label: 'Nama' },
  { id: 'email', key: 'email', label: 'Email' },
  { id: 'status', key: 'status', label: 'Status' },
  { id: 'actions', key: 'actions', label: 'Aksi' }
]

async function loadMembers() {
  const data = await $fetch('/api/users')
  members.value = data.filter((u: any) => u.role === 'anggota' && u.region_id === user.value?.regionId)
}

onMounted(async () => {
  await loadMembers()
})
</script>
