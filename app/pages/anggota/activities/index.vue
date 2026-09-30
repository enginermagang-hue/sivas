<template>
  <UDashboardPanel id="anggota-activities">
    <template #header>
      <UDashboardNavbar title="Aktivitas Saya">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
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

        <ActivityDeleteModal ref="activityDeleteModal" :count="selectedCount" :name="bulkDeleteName" @confirm="handleConfirmDelete">
          <UButton
            v-if="selectedCount"
            label="Hapus"
            color="error"
            variant="subtle"
            icon="i-lucide-trash"
            @click="bulkDeleteName = ''"
          >
            <template #trailing>
              <UBadge color="error" variant="solid">{{ selectedCount }}</UBadge>
            </template>
          </UButton>
        </ActivityDeleteModal>
      </div>

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
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import ActivityAddModal from '~/components/ActivityAddModal.vue'
import ActivityDeleteModal from '~/components/ActivityDeleteModal.vue'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  layout: 'default'
})

const { user } = useAuth()
const toast = useToast()

if (user.value?.role !== 'anggota') {
  throw createError({ statusCode: 403, statusMessage: 'Tidak diizinkan' })
}

const activities = ref<any[]>([])
const categories = ref<any[]>([])
const loading = ref(false)

const activityAddModal = useTemplateRef('activityAddModal')
const activityDeleteModal = useTemplateRef('activityDeleteModal')
const table = useTemplateRef('table')

const search = ref('')
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
  return !!search.value || kategoriFilter.value || dateMode.value
})

const filteredActivities = computed(() => {
  let result = [...activities.value]

  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter((a: any) =>
      (a.deskripsi || '').toLowerCase().includes(q) ||
      (a.kategori_nama || '').toLowerCase().includes(q) ||
      (a.user_nama || '').toLowerCase().includes(q) ||
      (a.region_nama || '').toLowerCase().includes(q)
    )
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

// Watch filters → reset to page 1
watch([kategoriFilter, dateMode], () => {
  pagination.value.pageIndex = 0
})

function resetFilters() {
  search.value = ''
  kategoriFilter.value = undefined
  dateMode.value = ''
  dateDay.value = ''
  dateMonth.value = ''
  pagination.value.pageIndex = 0
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
  await loadCategories()
  await loadActivities()
})
</script>
