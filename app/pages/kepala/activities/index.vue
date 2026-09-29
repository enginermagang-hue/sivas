<template>
<UDashboardPanel id="kepala-activities">
  <template #header>
    <UDashboardNavbar title="Semua Aktivitas">
      <template #leading>
        <UDashboardSidebarCollapse />
      </template>
      <template #right>
        <UButton icon="i-lucide-download" to="/kepala/export">Export</UButton>
      </template>
    </UDashboardNavbar>
  </template>

  <template #body>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Semua Aktivitas</h1>
    </div>

    <UCard class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <UFormField label="Dari Tanggal">
          <UInput v-model="filters.tanggal_dari" type="date" />
        </UFormField>
        <UFormField label="Sampai Tanggal">
          <UInput v-model="filters.tanggal_sampai" type="date" />
        </UFormField>
        <UFormField label="Wilayah">
          <USelect
            v-model="filters.region_id"
            :options="regions"
            value-attribute="id"
            option-attribute="nama"
            placeholder="Semua Wilayah"
            clearable
          />
        </UFormField>
        <UFormField label="Kategori">
          <USelect
            v-model="filters.kategori_id"
            :options="categories"
            value-attribute="id"
            option-attribute="nama"
            placeholder="Semua Kategori"
            clearable
          />
        </UFormField>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <UButton variant="ghost" @click="resetFilters">Reset</UButton>
        <UButton @click="applyFilters">Filter</UButton>
      </div>
    </UCard>

    <div class="space-y-4">
      <UCard v-if="activities.length === 0">
        <p class="text-center text-gray-500 dark:text-gray-400 py-8">Tidak ada aktivitas</p>
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
const regions = ref<any[]>([])
const categories = ref<any[]>([])

const filters = reactive({
  tanggal_dari: '',
  tanggal_sampai: '',
  region_id: undefined as number | undefined,
  kategori_id: undefined as number | undefined
})

async function loadRegions() {
  regions.value = await $fetch('/api/regions')
}

async function loadCategories() {
  categories.value = await $fetch('/api/categories')
}

async function loadActivities() {
  const params: any = {}
  if (filters.tanggal_dari) params.tanggal = filters.tanggal_dari
  if (filters.region_id) params.region_id = String(filters.region_id)
  if (filters.kategori_id) params.kategori_id = String(filters.kategori_id)

  const data = await $fetch('/api/activities', { params })
  activities.value = data
}

function applyFilters() {
  loadActivities()
}

function resetFilters() {
  Object.assign(filters, {
    tanggal_dari: '',
    tanggal_sampai: '',
    region_id: undefined,
    kategori_id: undefined
  })
  loadActivities()
}

onMounted(async () => {
  await loadRegions()
  await loadCategories()
  await loadActivities()
})
</script>
