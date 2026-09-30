<template>
  <UDashboardPanel id="admin-regions">
    <template #header>
      <UDashboardNavbar title="Kelola Wilayah">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <RegionsAddModal ref="regionsAddModal" @success="loadRegions" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="search"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Cari wilayah..."
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <RegionsDeleteModal ref="regionsDeleteModal" :count="selectedCount" :name="bulkDeleteName" @confirm="handleConfirmDelete">
            <UButton
              label="Hapus"
              color="error"
              variant="subtle"
              icon="i-lucide-trash"
              :disabled="!selectedCount"
              @click="bulkDeleteName = ''"
            >
              <template #trailing>
                <UBadge color="error" variant="solid">{{ selectedCount }}</UBadge>
              </template>
            </UButton>
          </RegionsDeleteModal>
        </div>
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
        :data="regions"
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
          {{ selectedCount }} dari {{ filteredRegions.length }} data terpilih.
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination
            :default-page="pagination.pageIndex + 1"
            :items-per-page="pagination.pageSize"
            :total="filteredRegions.length"
            @update:page="(p: number) => table.tableApi.setPageIndex(p - 1)"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import RegionsAddModal from '~/components/admin/RegionsAddModal.vue'
import RegionsDeleteModal from '~/components/admin/RegionsDeleteModal.vue'
import { getPaginationRowModel } from '@tanstack/table-core'
import { upperFirst } from 'scule'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  layout: 'default'
})

const { user } = useAuth()
const toast = useToast()

if (user.value?.role !== 'admin') {
  throw createError({ statusCode: 403, statusMessage: 'Tidak diizinkan' })
}

const regions = ref<any[]>([])
const loading = ref(false)

const regionsAddModal = useTemplateRef('regionsAddModal')
const regionsDeleteModal = useTemplateRef('regionsDeleteModal')
const table = useTemplateRef('table')

const search = ref('')
const rowSelection = ref<Record<string, boolean>>({})
const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

const filteredRegions = computed(() => {
  let result = [...regions.value]

  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter((r: any) =>
      (r.nama || '').toLowerCase().includes(q) ||
      (r.kode || '').toLowerCase().includes(q)
    )
  }

  return result
})

const selectedCount = computed(() => {
  return Object.values(rowSelection.value).filter(Boolean).length
})

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
    accessorKey: 'nama',
    header: 'Nama Wilayah',
    cell: ({ row }: any) => row.original.nama
  },
  {
    accessorKey: 'kode',
    header: 'Kode',
    cell: ({ row }: any) => row.original.kode
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }: any) => {
      const color = row.original.status === 'active' ? 'success' : 'error'
      return h(resolveComponent('UBadge'), {
        color,
        variant: 'soft'
      }, () => row.original.status === 'active' ? 'Aktif' : 'Nonaktif')
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
            regionsAddModal.value?.openEdit(row.original)
          }
        },
        {
          label: 'Hapus',
          icon: 'i-lucide-trash-2',
          color: 'error' as const,
          onSelect() {
            deleteTarget.value = row.original
            bulkDeleteName.value = row.original.nama
            regionsDeleteModal.value?.open()
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

async function loadRegions() {
  loading.value = true
  try {
    const data = await $fetch('/api/regions')
    regions.value = data
  } finally {
    loading.value = false
  }
}

function openEdit(row: any) {
  regionsAddModal.value?.openEdit(row)
}

const deleteTarget = ref<any>(null)
const bulkDeleteName = ref('')
const deleting = ref(false)

async function handleConfirmDelete() {
  regionsDeleteModal.value?.setLoading(true)
  try {
    if (deleteTarget.value?.id) {
      await $fetch(`/api/regions/${deleteTarget.value.id}`, { method: 'DELETE' })
      toast.add({ color: 'success', title: 'Wilayah berhasil dihapus' })
      deleteTarget.value = null
      bulkDeleteName.value = ''
    } else {
      const selectedIds = Object.keys(rowSelection.value).filter(key => rowSelection.value[key])
      if (!selectedIds.length) {
        regionsDeleteModal.value?.close()
        return
      }
      await Promise.all(selectedIds.map(id => $fetch(`/api/regions/${id}`, { method: 'DELETE' })))
      toast.add({ color: 'success', title: `${selectedIds.length} wilayah berhasil dihapus` })
      rowSelection.value = {}
    }
    await loadRegions()
    regionsDeleteModal.value?.close()
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || 'Gagal menghapus' })
  } finally {
    regionsDeleteModal.value?.setLoading(false)
    deleting.value = false
  }
}

onMounted(async () => {
  await loadRegions()
})
</script>
