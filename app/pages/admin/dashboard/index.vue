<template>
  <UDashboardPanel id="admin-dashboard">
    <template #header>
      <UDashboardNavbar title="Dashboard Admin">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6" v-if="ready">
        <h1 class="text-2xl font-bold">Dashboard Admin</h1>

        <!-- Stat cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard title="Total Pengguna" :value="stats.totalUsers" icon="i-lucide-users" color="blue" />
          <DashboardCard title="Total Wilayah" :value="stats.totalRegions" icon="i-lucide-map" color="purple" />
          <DashboardCard title="Total Kategori" :value="stats.totalCategories" icon="i-lucide-tag" color="orange" />
          <DashboardCard title="Aktivitas Hari Ini" :value="stats.todayActivities" icon="i-lucide-activity" color="green" />
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

        <!-- Two-column detail -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Recent activities -->
          <UCard>
            <h3 class="text-lg font-semibold mb-4">Aktivitas Terbaru</h3>
            <div v-if="recentActivities.length" class="space-y-3">
              <div v-for="a in recentActivities" :key="a.id" class="flex items-start gap-3">
                <UIcon name="i-lucide-activity" class="w-4 h-4 text-primary mt-0.5" />
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-sm text-highlighted truncate">{{ a.deskripsi }}</p>
                  <p class="text-xs text-muted">
                    {{ formatDate(a.tanggal) }} • {{ a.user_nama }} • {{ a.region_nama }}
                  </p>
                </div>
                <UBadge :color="categoryColor(a.kategori_warna)" variant="soft" class="shrink-0">
                  {{ a.kategori_nama }}
                </UBadge>
              </div>
            </div>
            <p v-else class="text-sm text-muted">Tidak ada aktivitas</p>
          </UCard>

          <!-- Region summary -->
          <UCard>
            <h3 class="text-lg font-semibold mb-4">Ringkasan Wilayah</h3>
            <div v-if="regionSummary.length" class="space-y-3">
              <div v-for="r in regionSummary" :key="r.id" class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: r.warna }"></span>
                  <span class="text-sm font-medium">{{ r.nama }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <UBadge :color="r.status === 'active' ? 'success' : 'neutral'" variant="soft" size="sm">
                    {{ r.status === 'active' ? 'Aktif' : 'Nonaktif' }}
                  </UBadge>
                  <span class="text-xs text-muted">
                    ({{ r.koordinator ? r.koordinator : '0' }} koordinator, {{ r.anggota }} anggota)
                  </span>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-muted">Tidak ada wilayah</p>
          </UCard>
        </div>
      </div>

      <div v-else class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-muted" />
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { getLocalDateString, formatDate } from '~/utils/date'
import { ref, reactive, onMounted, computed } from 'vue'

definePageMeta({
  layout: 'default'
})

const { user } = useAuth()
const regions = ref<any[]>([])
const users = ref<any[]>([])
const categories = ref<any[]>([])
const activities = ref<any[]>([])
const ready = ref(false)

if (user.value?.role !== 'admin') {
  throw createError({ statusCode: 403, statusMessage: 'Tidak diizinkan' })
}

const stats = reactive({
  totalUsers: 0,
  totalRegions: 0,
  totalCategories: 0,
  todayActivities: 0
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

async function loadData() {
  const [regionsRes, usersRes, categoriesRes, activitiesRes] = await Promise.all([
    $fetch('/api/regions'),
    $fetch('/api/users'),
    $fetch('/api/categories'),
    $fetch('/api/activities')
  ])

  regions.value = regionsRes
  users.value = usersRes
  categories.value = categoriesRes
  activities.value = activitiesRes

  // Stats
  stats.totalUsers = users.value.length
  stats.totalRegions = regions.value.length
  stats.totalCategories = categories.value.length
  const today = getLocalDateString()
  stats.todayActivities = activities.value.filter((a: any) => a.tanggal === today).length

  // Chart: 7-day trend
  const labels: string[] = []
  const data: number[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = getLocalDateString(d)
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
    const name = a.kategori_nama || 'Tanpa Nama'
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
}

const recentActivities = computed(() => {
  return activities.value.slice(0, 8)
})

const regionSummary = computed(() => {
  return regions.value.map(r => {
    const regionUsers = users.value.filter(u => Number(u.region_id) === Number(r.id))
    const coords = regionUsers.filter(u => u.role === 'koordinator' && u.deleted_at == null)
    const anggota = regionUsers.filter(u => u.role === 'anggota').length
    return {
      id: r.id,
      nama: r.nama,
      warna: r.warna || '#ccc',
      status: r.status || 'active',
      koordinator: coords.length,
      anggota: anggota
    }
  })
})



function categoryColor(hex?: string) {
  const colors: Record<string, string> = {
    '#3B82F6': 'blue',
    '#10B981': 'success',
    '#F59E0B': 'warning',
    '#EF4444': 'error',
    '#8B5CF6': 'purple',
    '#6B7280': 'neutral'
  }
  return colors[hex || '#9CA3AF'] || 'neutral'
}

onMounted(async () => {
  await loadData()
})
</script>
