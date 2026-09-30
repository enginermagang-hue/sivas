<template>
  <UDashboardPanel id="admin-categories">
    <template #header>
      <UDashboardNavbar title="Kelola Kategori">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <CategoriesAddModal ref="categoriesAddModal" @success="handleModalSuccess" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="search"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Cari kategori..."
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <CategoriesDeleteModal ref="categoriesDeleteModal" :count="selectedCount" :name="bulkDeleteName" @confirm="handleConfirmDelete">
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
          </CategoriesDeleteModal>
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
        :data="categories"
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
          {{ selectedCount }} dari {{ filteredCategories.length }} data terpilih.
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination
            :default-page="pagination.pageIndex + 1"
            :items-per-page="pagination.pageSize"
            :total="filteredCategories.length"
            @update:page="(p: number) => table.tableApi.setPageIndex(p - 1)"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import CategoriesAddModal from '~/components/admin/CategoriesAddModal.vue'
import CategoriesDeleteModal from '~/components/admin/CategoriesDeleteModal.vue'
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

const categories = ref<any[]>([])
const loading = ref(false)

const categoriesAddModal = ref<InstanceType<typeof CategoriesAddModal> | null>(null)
const categoriesDeleteModal = useTemplateRef('categoriesDeleteModal')
const table = useTemplateRef('table')

const search = ref('')
const rowSelection = ref<Record<string, boolean>>({})
const deleteTarget = ref<any>(null)
const bulkDeleteName = ref('')
const deleting = ref(false)
const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

const filteredCategories = computed(() => {
  let result = [...categories.value]

  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter((c: any) =>
      (c.nama || '').toLowerCase().includes(q) ||
      (c.warna || '').toLowerCase().includes(q) ||
      (c.icon || '').toLowerCase().includes(q)
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
    header: 'Nama',
    cell: ({ row }: any) => {
      const c = row.original
      return h('div', { class: 'flex items-center gap-3' }, [
        h('span', {
          class: 'w-4 h-4 rounded-full',
          style: { backgroundColor: c.warna || '#ccc' }
        }),
        h('div', undefined, [
          h('p', { class: 'font-medium text-highlighted' }, c.nama),
          h('p', { class: 'text-sm text-muted' }, c.icon || '-')
        ])
      ])
    }
  },
  {
    accessorKey: 'warna',
    header: 'Warna',
    cell: ({ row }: any) => row.original.warna || '-'
  },
  {
    accessorKey: 'icon',
    header: 'Icon',
    cell: ({ row }: any) => {
      const icon = row.original.icon
      if (!icon) return '-'
      const label = String(icon).replace(/^i-lucide-/, '')
      return h('div', { class: 'flex items-center gap-2 min-w-0' }, [
        h(resolveComponent('UIcon'), { name: icon, class: 'w-4 h-4 shrink-0 text-muted' }),
        h('span', { class: 'truncate text-sm max-w-32', title: label }, label)
      ])
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
            categoriesAddModal.value?.openEdit(row.original)
          }
        },
        {
          label: 'Hapus',
          icon: 'i-lucide-trash-2',
          color: 'error' as const,
          onSelect() {
            deleteTarget.value = row.original
            bulkDeleteName.value = row.original.nama
            categoriesDeleteModal.value?.open()
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

async function loadCategories() {
  loading.value = true
  try {
    const data = await $fetch('/api/categories')
    categories.value = data
  } finally {
    loading.value = false
  }
}

function openEdit(row: any) {
  categoriesAddModal.value?.openEdit(row)
}

async function handleModalSuccess() {
  await loadCategories()
}

async function handleConfirmDelete() {
  categoriesDeleteModal.value?.setLoading(true)
  try {
    if (deleteTarget.value?.id) {
      await $fetch(`/api/categories/${deleteTarget.value.id}`, { method: 'DELETE' })
      toast.add({ color: 'success', title: 'Kategori berhasil dihapus' })
      deleteTarget.value = null
      bulkDeleteName.value = ''
    } else {
      const selectedIds = Object.keys(rowSelection.value).filter(key => rowSelection.value[key])
      if (!selectedIds.length) {
        categoriesDeleteModal.value?.close()
        return
      }
      await Promise.all(selectedIds.map(id => $fetch(`/api/categories/${id}`, { method: 'DELETE' })))
      toast.add({ color: 'success', title: `${selectedIds.length} kategori berhasil dihapus` })
      rowSelection.value = {}
    }
    await loadCategories()
    categoriesDeleteModal.value?.close()
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || 'Gagal menghapus' })
  } finally {
    categoriesDeleteModal.value?.setLoading(false)
    deleting.value = false
  }
}

onMounted(async () => {
  await loadCategories()
})
</script>
