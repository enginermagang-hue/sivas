<template>
  <UDashboardPanel id="koordinator-activities">
    <template #header>
      <UDashboardNavbar title="Aktivitas Wilayah">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton icon="i-lucide-download" to="/koordinator/export">Export</UButton>
          <ActivityAddModal ref="activityAddModal" @success="loadActivities" />
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
            v-model="anggotaFilter"
            :items="memberFilterItems"
            placeholder="Semua Anggota"
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
          v-model:row-selection="rowSelection"
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
            {{ selectedCount }} dari {{ filteredActivities.length }} data terpilih.
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
          @click="navigateTo(`/koordinator/activities/${activity.id}`)"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" :style="{ backgroundColor: (activity.kategori_warna || '#ccc') + '20', color: activity.kategori_warna || '#666' }">
                {{ activity.kategori_nama }}
              </span>
              <span class="text-xs text-muted">{{ formatDate(activity.tanggal) }}</span>
              <span class="text-xs text-muted">{{ activity.region_nama }}</span>
            </div>
            <p class="text-sm text-gray-700 dark:text-gray-300 truncate">{{ activity.deskripsi }}</p>
          </div>
          <div class="flex items-center gap-3 text-xs text-muted shrink-0">
            <span v-if="activity.jam_mulai" class="flex items-center gap-1">
              <UIcon name="i-lucide-clock" class="w-3 h-3" />
              {{ activity.jam_mulai }}
            </span>
            <span v-if="activity.jam_selesai" class="flex items-center gap-1">
              <UIcon name="i-lucide-clock" class="w-3 h-3" />
              {{ activity.jam_selesai }}
            </span>
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
import ActivityAddModal from '~/components/ActivityAddModal.vue'
import ActivityCard from '~/components/ActivityCard.vue'
import ActivityDeleteModal from '~/components/ActivityDeleteModal.vue'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  layout: 'default'
})

const { user } = useAuth()
const toast = useToast()

if (user.value?.role !== 'koordinator') {
  throw createError({ statusCode: 403, statusMessage: 'Tidak diizinkan' })
}

const activities = ref<any[]>([])
const categories = ref<any[]>([])
const members = ref<any[]>([])
const loading = ref(false)

const viewMode = ref<'table' | 'card' | 'compact'>('table')
const activityAddModal = useTemplateRef('activityAddModal')
const activityDeleteModal = useTemplateRef('activityDeleteModal')
const table = useTemplateRef('table')

const search = ref('')
const anggotaFilter = ref<number | undefined>()
const kategoriFilter = ref<number | undefined>()
const dateMode = ref('')
const dateDay = ref('')
const dateMonth = ref('')
const rowSelection = ref<Record<string, boolean>>({})
const deleteTarget = ref<any>(null)
const bulkDeleteName = ref('')
const deleting = ref(false)
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

const memberFilterItems = computed(() => {
  const items = [{ label: 'Semua Anggota', value: undefined }]
  for (const m of members.value) {
    items.push({ label: m.nama, value: Number(m.id) })
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
  return !!search.value || anggotaFilter.value || kategoriFilter.value || dateMode.value
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

  if (anggotaFilter.value) {
    result = result.filter((a: any) => Number(a.user_id) === anggotaFilter.value)
  }

  if (kategoriFilter.value) {
    result = result.filter((a: any) => Number(a.kategori_id) === kategoriFilter.value)
  }

  if (dateMode.value === 'today') {
    const today = new Date().toISOString().split('T')[0]
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

const selectedCount = computed(() => {
  return Object.values(rowSelection.value).filter(Boolean).length
})

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' })
}

const columns: TableColumn<any>[] = [
  {
    id: 'select',
    header: ({ table: t }: any) =>
      h(resolveComponent('UCheckbox'), {
        modelValue: t.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : t.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          t.toggleAllPageRowsSelected(!!value),
        ariaLabel: 'Select all'
      }),
    cell: ({ row }: any) =>
      h(resolveComponent('UCheckbox'), {
        modelValue: row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        ariaLabel: 'Select row'
      })
  },
  {
    accessorKey: 'tanggal',
    header: 'Tanggal',
    cell: ({ row }: any) => formatDate(row.original.tanggal)
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
    accessorKey: 'jam_mulai',
    header: 'Jam',
    cell: ({ row }: any) => {
      const a = row.original
      const start = a.jam_mulai || ''
      const end = a.jam_selesai || ''
      return h('span', { class: 'text-sm' }, start ? `${start}${end ? ' - ' + end : ''}` : '-')
    }
  },
  {
    id: 'actions',
    cell: ({ row }: any) => {
      const items = [
        {
          label: 'Detail',
          icon: 'i-lucide-eye',
          onSelect() {
            navigateTo(`/koordinator/activities/${row.original.id}`)
          }
        },
        {
          label: 'Edit',
          icon: 'i-lucide-pencil',
          onSelect() {
            activityAddModal.value?.openEdit(row.original)
          }
        },
        {
          label: 'Hapus',
          icon: 'i-lucide-trash-2',
          color: 'error' as const,
          onSelect() {
            deleteTarget.value = row.original
            bulkDeleteName.value = row.original.deskripsi || 'aktivitas ini'
            activityDeleteModal.value?.open()
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

// Watch filters -> reset to page 1
watch([anggotaFilter, kategoriFilter, dateMode], () => {
  pagination.value.pageIndex = 0
})

function resetFilters() {
  search.value = ''
  anggotaFilter.value = undefined
  kategoriFilter.value = undefined
  dateMode.value = ''
  dateDay.value = ''
  dateMonth.value = ''
  pagination.value.pageIndex = 0
}

async function loadMembers() {
  try {
    const data = await $fetch('/api/users')
    members.value = (data as any[]).filter((u: any) => u.role === 'anggota' && u.region_id === user.value?.regionId)
  } catch {
    members.value = []
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

async function handleConfirmDelete() {
  activityDeleteModal.value?.setLoading(true)
  try {
    if (deleteTarget.value?.id) {
      await $fetch(`/api/activities/${deleteTarget.value.id}`, { method: 'DELETE' })
      toast.add({ color: 'success', title: 'Aktivitas berhasil dihapus' })
      deleteTarget.value = null
      bulkDeleteName.value = ''
    } else {
      const selectedIds = Object.keys(rowSelection.value).filter(key => rowSelection.value[key])
      if (!selectedIds.length) {
        activityDeleteModal.value?.close()
        return
      }
      await Promise.all(selectedIds.map(id => $fetch(`/api/activities/${id}`, { method: 'DELETE' })))
      toast.add({ color: 'success', title: `${selectedIds.length} aktivitas berhasil dihapus` })
      rowSelection.value = {}
    }
    await loadActivities()
    activityDeleteModal.value?.close()
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || 'Gagal menghapus' })
  } finally {
    activityDeleteModal.value?.setLoading(false)
    deleting.value = false
  }
}

onMounted(async () => {
  await loadMembers()
  await loadCategories()
  const qUserId = Number(useRoute().query.user_id)
  if (Number.isFinite(qUserId) && qUserId > 0 && members.value.some((m: any) => Number(m.id) === qUserId)) {
    anggotaFilter.value = qUserId
  }
  await loadActivities()
})
</script>