<template>
  <div>
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
          <LineChart :data="chartData7Days" :options="chartOptions" />
        </div>
      </UCard>

      <UCard>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Aktivitas per Wilayah</h3>
        <div class="h-64">
          <BarChart :data="chartDataByRegion" :options="chartOptions" />
        </div>
      </UCard>
    </div>
  </div>
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
}

onMounted(async () => {
  await loadStats()
})
</script>
