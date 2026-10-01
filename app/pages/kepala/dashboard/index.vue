<template>
<UDashboardPanel id="kepala-dashboard">
  <template #header>
    <UDashboardNavbar title="Dashboard Kepala">
      <template #leading>
        <UDashboardSidebarCollapse />
      </template>
    </UDashboardNavbar>
  </template>

  <template #body>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Kepala</h1>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <DashboardCard title="Total Aktivitas Hari Ini" :value="stats.today" icon="i-lucide-activity" color="blue" />
      <DashboardCard title="Total Aktivitas Bulan Ini" :value="stats.thisMonth" icon="i-lucide-calendar" color="green" />
      <DashboardCard title="Total Wilayah" :value="stats.totalRegions" icon="i-lucide-map" color="purple" />
      <DashboardCard title="Total Pengguna" :value="stats.totalUsers" icon="i-lucide-users" color="orange" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <UCard>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Aktivitas 7 Hari Terakhir</h3>
        <div class="h-64">
          <LineChart v-if="chartData7Days.datasets.length" :data="chartData7Days" :options="chartOptions" />
          <div v-else class="flex items-center justify-center h-full text-gray-500">Tidak ada data</div>
        </div>
      </UCard>

      <UCard>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Aktivitas per Wilayah</h3>
        <div class="h-64">
          <BarChart v-if="chartDataByRegion.datasets.length" :data="chartDataByRegion" :options="chartOptions" />
          <div v-else class="flex items-center justify-center h-full text-gray-500">Tidak ada data</div>
        </div>
      </UCard>
    </div>
  </template>
</UDashboardPanel>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { user } = useAuth()
const stats = ref({
  today: 0,
  thisMonth: 0,
  totalRegions: 0,
  totalUsers: 0
})

const chartData7Days = ref({
  labels: [] as string[],
  datasets: [] as any[]
})
const chartDataByRegion = ref({
  labels: [] as string[],
  datasets: [] as any[]
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  }
}

async function loadStats() {
  const [users, regions, activitiesToday, activitiesMonth] = await Promise.all([
    $fetch('/api/users'),
    $fetch('/api/regions'),
    $fetch('/api/activities?tanggal=' + new Date().toISOString().split('T')[0]),
    $fetch('/api/activities')
  ])

  stats.value = {
    today: activitiesToday.length,
    thisMonth: activitiesMonth.filter((a: any) => {
      const date = new Date(a.tanggal)
      const now = new Date()
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }).length,
    totalRegions: regions.length,
    totalUsers: users.length
  }

  const labels7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })
  })

  const data7Days = labels7Days.map(label => {
    const date = new Date()
    const parts = label.split(' ')
    date.setDate(date.getDate() - (6 - labels7Days.indexOf(label)))
    const dateStr = date.toISOString().split('T')[0]
    return activitiesMonth.filter((a: any) => a.tanggal === dateStr).length
  })

  chartData7Days.value = {
    labels: labels7Days,
    datasets: [
      {
        label: 'Aktivitas',
        data: data7Days,
        borderColor: '#3B82F6',
        backgroundColor: '#3B82F6',
        tension: 0.3
      }
    ]
  }

  const regionCounts: Record<string, number> = {}
  activitiesMonth.forEach((a: any) => {
    regionCounts[a.region_nama] = (regionCounts[a.region_nama] || 0) + 1
  })

  chartDataByRegion.value = {
    labels: Object.keys(regionCounts),
    datasets: [
      {
        label: 'Aktivitas',
        data: Object.values(regionCounts),
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
      }
    ]
  }
}

onMounted(async () => {
  await loadStats()
})
</script>
