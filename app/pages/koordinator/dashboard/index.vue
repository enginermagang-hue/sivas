<template>
  <UDashboardPanel id="koordinator-dashboard">
    <template #header>
      <UDashboardNavbar :title="`Halo, ${user?.nama || 'Koordinator'}`">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <ActivityAddModal @success="loadDashboard" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="ready" class="space-y-6">
        <h1 class="text-2xl font-bold">Dashboard Wilayah</h1>

        <!-- Stat cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard title="Anggota Aktif" :value="stats.totalAnggota" icon="i-lucide-users" color="blue" />
          <DashboardCard title="Aktivitas 7 Hari" :value="stats.last7Days" icon="i-lucide-calendar-days" color="green" />
          <DashboardCard title="Hari Ini" :value="stats.today" icon="i-lucide-calendar" color="orange" />
          <DashboardCard title="Bulan Ini" :value="stats.thisMonth" icon="i-lucide-activity" color="purple" />
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UCard>
            <h3 class="text-lg font-semibold mb-4">Aktivitas 7 Hari Terakhir</h3>
            <div class="h-64">
              <LineChart v-if="chartData7Days.datasets.length" :data="chartData7Days" :options="chartOptions" />
              <p v-else class="flex items-center justify-center h-full text-muted">Tidak ada data</p>
            </div>
          </UCard>

          <UCard>
            <h3 class="text-lg font-semibold mb-4">Aktivitas per Kategori</h3>
            <div class="h-64">
              <BarChart v-if="chartDataByCategory.datasets.length" :data="chartDataByCategory" :options="chartOptions" />
              <p v-else class="flex items-center justify-center h-full text-muted">Tidak ada data</p>
            </div>
          </UCard>
        </div>

        <!-- Recent activities -->
        <UCard>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">Aktivitas Terbaru</h3>
            <UButton
              label="Lihat Semua"
              variant="ghost"
              size="sm"
              icon="i-lucide-arrow-right"
              to="/koordinator/activities"
              trailing
            />
          </div>
          <div v-if="recentActivities.length" class="space-y-3">
            <ActivityCard v-for="activity in recentActivities" :key="activity.id" :activity="activity" />
          </div>
          <p v-else class="text-sm text-muted">Belum ada aktivitas</p>
        </UCard>
      </div>

      <div v-else class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-muted" />
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import ActivityCard from '~/components/ActivityCard.vue'
import ActivityAddModal from '~/components/ActivityAddModal.vue'

definePageMeta({
  layout: 'default'
})

const { user } = useAuth()
const activities = ref<any[]>([])
const ready = ref(false)

if (user.value?.role !== 'koordinator') {
  throw createError({ statusCode: 403, statusMessage: 'Tidak diizinkan' })
}

const stats = reactive({
  totalAnggota: 0,
  last7Days: 0,
  today: 0,
  thisMonth: 0
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
}

const chartData7Days = ref({
  labels: [] as string[],
  datasets: [] as any[]
})

const chartDataByCategory = ref({
  labels: [] as string[],
  datasets: [] as any[]
})

async function loadDashboard() {
  try {
    const [dashboardRes, activitiesRes] = await Promise.all([
      $fetch('/api/dashboard/stats'),
      $fetch('/api/activities')
    ])
    activities.value = activitiesRes

    stats.totalAnggota = Number(dashboardRes.totalAnggota ?? 0)
    stats.today = Number(dashboardRes.today ?? 0)
    stats.thisMonth = Number(dashboardRes.thisMonth ?? 0)

    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 6)

    stats.last7Days = activities.value.filter((a: any) => {
      const d = new Date(a.tanggal)
      return d >= weekAgo
    }).length

    // Chart: 7-day trend
    const labels: string[] = []
    const data: number[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      labels.push(d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }))
      const count = activities.value.filter((a: any) => a.tanggal === dateStr).length
      data.push(count)
    }
    chartData7Days.value = {
      labels,
      datasets: [{
        label: 'Aktivitas',
        data,
        borderColor: '#3B82F6',
        backgroundColor: '#3B82F6',
        tension: 0.3,
        fill: true
      }]
    }

    // Chart: activities per category
    const catCounts: Record<string, number> = {}
    const catColors: Record<string, string> = {}
    activities.value.forEach((a: any) => {
      const name = a.kategori_nama || 'Tanpa Kategori'
      catCounts[name] = (catCounts[name] || 0) + 1
      catColors[name] = a.kategori_warna || '#9CA3AF'
    })
    const catLabels = Object.keys(catCounts)
    chartDataByCategory.value = {
      labels: catLabels,
      datasets: [{
        label: 'Aktivitas',
        data: catLabels.map(l => catCounts[l]),
        backgroundColor: catLabels.map(l => catColors[l])
      }]
    }

    ready.value = true
  } catch {
    ready.value = true
  }
}

const recentActivities = computed(() => activities.value.slice(0, 5))

onMounted(async () => {
  await loadDashboard()
})
</script>
