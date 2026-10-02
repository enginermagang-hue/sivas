<template>
  <UDashboardPanel id="kepala-activities">
    <template #header>
      <UDashboardNavbar title="Semua Aktivitas">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>


      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <div class="flex flex-wrap items-center gap-1.5">
          <UInput
            v-model="search"
            class="max-w-sm"
            icon="i-lucide-search"
            placeholder="Cari aktivitas..."
          />

          <USelect
            v-model="regionFilter"
            :items="regionFilterItems"
            placeholder="Semua Wilayah"
            clearable
            class="w-48"
          />

          <USelect
            v-model="kategoriFilter"
            :items="categoryFilterItems"
            placeholder="Semua Kategori"
            clearable
            class="w-48"
          />

          <USelect
            v-model="dateMode"
            :items="dateModeItems"
            placeholder="Rentang Waktu"
            clearable
            class="w-40"
          />

          <UInput
            v-if="dateMode === 'day'"
            v-model="dateDay"
            type="date"
            class="w-44"
          />

          <UInput
            v-else-if="dateMode === 'month'"
            v-model="dateMonth"
            type="month"
            class="w-44"
          />

          <UButton
            v-if="hasActiveFilters"
            label="Reset"
            variant="ghost"
            size="sm"
            icon="i-lucide-x"
            @click="resetFilters"
          />
        </div>

        <div class="flex items-center gap-1">
          <UButton
            size="sm"
            variant="ghost"
            :color="viewMode === 'table' ? 'primary' : 'neutral'"
            @click="viewMode = 'table'"
          >
            <UIcon name="i-lucide-table" /> Tabel
          </UButton>
          <UButton
            size="sm"
            variant="ghost"
            :color="viewMode === 'card' ? 'primary' : 'neutral'"
            @click="viewMode = 'card'"
          >
            <UIcon name="i-lucide-layout" /> Card
          </UButton>
          <UButton
            size="sm"
            variant="ghost"
            :color="viewMode === 'compact' ? 'primary' : 'neutral'"
            @click="viewMode = 'compact'"
          >
            <UIcon name="i-lucide-list" /> Ringkas
          </UButton>
        </div>
      </div>

      <div v-if="viewMode === 'table'">
        <UTable
          ref="table"
          v-model:pagination="pagination"
          :pagination-options="{
            getPaginationRowModel: getPaginationRowModel()
          }"
          :get-row-id="(row: any) => String(row.id)"
          class="shrink-0"
          :data="filteredActivities"
          :columns="columns"
          :loading="loading"
          :ui="{
            base: 'table-fixed border-separate border-spacing-0',
            thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
            tbody: '[&>tr]:last:[&>td]:border-b-0',
            th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
            td: 'border-b border-default',
            separator: 'h-0'
          }"
        />

        <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
          <div class="text-sm text-muted">
            {{ filteredActivities.length }} data.
          </div>

          <div class="flex items-center gap-1.5">
            <UPagination
              :default-page="pagination.pageIndex + 1"
              :items-per-page="pagination.pageSize"
              :total="filteredActivities.length"
              @update:page="(p: number) => table.tableApi.setPageIndex(p - 1)"
            />
          </div>
        </div>
      </div>

      <div v-else-if="viewMode === 'card'" class="space-y-4">
        <UCard v-if="paginatedActivities.length === 0">
          <p class="text-center text-gray-500 dark:text-gray-400 py-8">Tidak ada aktivitas</p>
        </UCard>
        <ActivityCard v-for="activity in paginatedActivities" :key="activity.id" :activity="activity" />
        <div v-if="filteredActivities.length > listPageSize" class="flex items-center justify-center gap-1.5 pt-4">
          <UButton
            icon="i-lucide-chevron-left"
            variant="ghost"
            size="sm"
            :disabled="listPage <= 1"
            @click="listPage--"
          />
          <span class="text-sm text-muted">Halaman {{ listPage }} dari {{ Math.ceil(filteredActivities.length / listPageSize) }}</span>
          <UButton
            icon="i-lucide-chevron-right"
            variant="ghost"
            size="sm"
            :disabled="listPage >= Math.ceil(filteredActivities.length / listPageSize)"
            @click="listPage++"
          />
        </div>
      </div>

      <div v-else-if="viewMode === 'compact'" class="space-y-2">
        <UCard v-if="paginatedActivities.length === 0">
          <p class="text-center text-gray-500 dark:text-gray-400 py-8">Tidak ada aktivitas</p>
        </UCard>
        <div
          v-for="activity in paginatedActivities"
          :key="activity.id"
          class="flex items-center justify-between gap-3 rounded-lg border border-default p-3 hover:bg-elevated/50 cursor-pointer"
          @click="navigateTo(`/kepala/activities/${activity.id}`)"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" :style="{ backgroundColor: (activity.kategori_warna || '#ccc') + '20', color: activity.kategori_warna || '#666' }">
                {{ activity.kategori_nama }}
              </span>
              <span class="text-xs text-muted">{{ formatDate(activity.tanggal) }}<template v-if="activity.jam_mulai || activity.jam_selesai">, {{ [activity.jam_mulai, activity.jam_selesai].filter(Boolean).join(' - ') }}</template></span>
              <span class="text-xs text-muted">{{ activity.region_nama }}</span>
            </div>
            <p class="text-sm text-gray-700 dark:text-gray-300 truncate">{{ activity.deskripsi }}</p>
          </div>
          <div class="flex items-center gap-3 text-xs text-muted shrink-0">
            <span class="flex items-center gap-1">
              <UIcon name="i-lucide-paperclip" class="w-3 h-3" />
              {{ activity.file_count || 0 }}
            </span>
          </div>
        </div>
        <div v-if="filteredActivities.length > listPageSize" class="flex items-center justify-center gap-1.5 pt-4">
          <UButton
            icon="i-lucide-chevron-left"
            variant="ghost"
            size="sm"
            :disabled="listPage <= 1"
            @click="listPage--"
          />
          <span class="text-sm text-muted">Halaman {{ listPage }} dari {{ Math.ceil(filteredActivities.length / listPageSize) }}</span>
          <UButton
            icon="i-lucide-chevron-right"
            variant="ghost"
            size="sm"
            :disabled="listPage >= Math.ceil(filteredActivities.length / listPageSize)"
            @click="listPage++"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { formatDate, getLocalDateString } from '~/utils/date'
import ActivityCard from '~/components/ActivityCard.vue'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  layout: 'default'
})

const { user } = useAuth()
const toast = useToast()

const activities = ref<any[]>([])
const regions = ref<any[]>([])
const categories = ref<any[]>([])
const loading = ref(false)

const viewMode = ref<'table' | 'card' | 'compact'>('table')
const regionFilter = ref<number | undefined>()
const kategoriFilter = ref<number | undefined>()
const dateMode = ref('')
const dateDay = ref('')
const dateMonth = ref('')
const search = ref('')
const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

const listPage = ref(1)
const listPageSize = computed(() => ({
  table: 10,
  card: 6,
  compact: 10
}[viewMode.value] as number))

const paginatedActivities = computed(() => {
  const start = (listPage.value - 1) * listPageSize.value
  const end = start + listPageSize.value
  return filteredActivities.value.slice(start, end)
})

const regionFilterItems = computed(() => {
  const items = [{ label: 'Semua Wilayah', value: undefined }]
  for (const r of regions.value) {
    items.push({ label: r.nama, value: Number(r.id) })
  }
  return items
})

const categoryFilterItems = computed(() => {
  const items = [{ label: 'Semua Kategori', value: undefined }]
  for (const c of categories.value) {
    items.push({ label: c.nama, value: Number(c.id) })
  }
  return items
})

const dateModeItems = [
  { label: 'Hari Ini', value: 'today' },
  { label: 'Per Hari', value: 'day' },
  { label: 'Per Bulan', value: 'month' }
]

const hasActiveFilters = computed(() => {
  return !!search.value || !!regionFilter.value || !!kategoriFilter.value || !!dateMode.value
})

const filteredActivities = computed(() => {
  let result = [...activities.value]

  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter((a: any) =>
      (a.deskripsi || '').toLowerCase().includes(q) ||
      (a.kategori_nama || '').toLowerCase().includes(q) ||
      (a.user_nama || '').toLowerCase().includes(q) ||
      (a.region_nama || '').toLowerCase().includes(q) ||
      (a.nama_sekolah || '').toLowerCase().includes(q) ||
      (a.npsn || '').toLowerCase().includes(q)
    )
  }

  if (regionFilter.value) {
    result = result.filter((a: any) => Number(a.region_id) === regionFilter.value)
  }

  if (kategoriFilter.value) {
    result = result.filter((a: any) => Number(a.kategori_id) === kategoriFilter.value)
  }

  if (dateMode.value === 'today') {
    const today = getLocalDateString()
    result = result.filter((a: any) => a.tanggal === today)
  } else if (dateMode.value === 'day' && dateDay.value) {
    result = result.filter((a: any) => a.tanggal === dateDay.value)
  } else if (dateMode.value === 'month' && dateMonth.value) {
    result = result.filter((a: any) => a.tanggal.startsWith(dateMonth.value))
  }

  return result
})

watch([filteredActivities, viewMode], () => {
  listPage.value = 1
})

const columns: TableColumn<any>[] = [
  {
    accessorKey: 'tanggal',
    header: 'Tanggal',
    cell: ({ row }: any) => {
      const a = row.original
      const time = [a.jam_mulai, a.jam_selesai].filter(Boolean).join(' - ')
      return h('div', { class: 'text-sm leading-tight' }, [
        h('div', formatDate(a.tanggal)),
        time ? h('div', { class: 'text-xs text-muted' }, time) : null
      ])
    }
  },
  {
    accessorKey: 'kategori_nama',
    header: 'Kategori',
    cell: ({ row }: any) => {
      const c = row.original
      return h('div', { class: 'flex items-center gap-2' }, [
        h('span', {
          class: 'w-3 h-3 rounded-full shrink-0',
          style: { backgroundColor: c.kategori_warna || '#ccc' }
        }),
        h('span', { class: 'text-sm' }, c.kategori_nama || '-')
      ])
    }
  },
  {
    accessorKey: 'deskripsi',
    header: 'Deskripsi',
    cell: ({ row }: any) => {
      const a = row.original
      return h('div', { class: 'max-w-xs' }, [
        h('p', { class: 'truncate text-sm' }, a.deskripsi),
        h('p', { class: 'text-xs text-muted mt-0.5' }, `${a.user_nama} • ${a.region_nama}`)
      ])
    }
  },
  {
    accessorKey: 'nama_sekolah',
    header: 'Sekolah',
    cell: ({ row }: any) => {
      const a = row.original
      if (!a.nama_sekolah && !a.npsn) return h('span', { class: 'text-sm text-muted' }, '-')
      return h('div', { class: 'max-w-xs' }, [
        h('p', { class: 'truncate text-sm' }, a.nama_sekolah || '-'),
        a.npsn ? h('p', { class: 'text-xs text-muted mt-0.5' }, `NPSN: ${a.npsn}`) : null
      ])
    }
  },
  {
    accessorKey: 'region_nama',
    header: 'Wilayah',
    cell: ({ row }: any) => row.original.region_nama || '-'
  },
  {
    accessorKey: 'file_count',
    header: 'Lampiran',
    cell: ({ row }: any) => h('span', { class: 'text-sm text-center' }, row.original.file_count ?? 0)
  },
  {
    id: 'actions',
    cell: ({ row }: any) => {
      const items = [
        {
          label: 'Detail',
          icon: 'i-lucide-eye',
          onSelect() {
            navigateTo(`/kepala/activities/${row.original.id}`)
          }
        }
      ]

      return h(
        'div',
        { class: 'text-right' },
        h(
          resolveComponent('UDropdownMenu'),
          {
            content: { align: 'end' },
            items
          },
          () =>
            h(resolveComponent('UButton'), {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              class: 'ml-auto'
            })
        )
      )
    }
  }
]

function resetFilters() {
  search.value = ''
  regionFilter.value = undefined
  kategoriFilter.value = undefined
  dateMode.value = ''
  dateDay.value = ''
  dateMonth.value = ''
  pagination.value.pageIndex = 0
}

async function loadRegions() {
  try {
    regions.value = await $fetch('/api/regions')
  } catch {
    regions.value = []
  }
}

async function loadCategories() {
  try {
    categories.value = await $fetch('/api/categories')
  } catch {
    categories.value = []
  }
}

async function loadActivities() {
  loading.value = true
  try {
    const data = await $fetch('/api/activities')
    activities.value = data
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadRegions()
  await loadCategories()
  await loadActivities()
})
</script>
