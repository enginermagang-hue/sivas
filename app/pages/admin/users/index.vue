<template>
  <UDashboardPanel id="admin-users">
    <template #header>
      <UDashboardNavbar title="Kelola Pengguna">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UsersAddModal ref="usersAddModal" @success="handleModalSuccess" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="search"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Cari pengguna..."
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <UsersDeleteModal ref="usersDeleteModal" :count="selectedCount" :name="bulkDeleteName" @confirm="handleConfirmDelete">
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
          </UsersDeleteModal>

          <USelect
            v-model="roleFilter"
            :items="[
              { label: 'Semua Role', value: 'all' },
              { label: 'Admin', value: 'admin' },
              { label: 'Koordinator', value: 'koordinator' },
              { label: 'Anggota', value: 'anggota' },
              { label: 'Kepala', value: 'kepala' }
            ]"
            placeholder="Filter role"
            class="min-w-28"
          />

          <USelect
            v-model="statusFilter"
            :items="[
              { label: 'Semua Status', value: 'all' },
              { label: 'Aktif', value: 'active' },
              { label: 'Nonaktif', value: 'inactive' }
            ]"
            placeholder="Filter status"
            class="min-w-28"
          />
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
        :data="users"
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
          {{ selectedCount }} dari {{ filteredUsers.length }} data terpilih.
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination
            :default-page="pagination.pageIndex + 1"
            :items-per-page="pagination.pageSize"
            :total="filteredUsers.length"
            @update:page="(p: number) => table.tableApi.setPageIndex(p - 1)"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import UsersAddModal from '~/components/admin/UsersAddModal.vue'
import UsersDeleteModal from '~/components/admin/UsersDeleteModal.vue'
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

const users = ref<any[]>([])
const regions = ref<any[]>([])
const loading = ref(false)

const usersAddModal = ref<InstanceType<typeof UsersAddModal> | null>(null)
const usersDeleteModal = useTemplateRef('usersDeleteModal')
const table = useTemplateRef('table')

const search = ref('')
const roleFilter = ref('all')
const statusFilter = ref('all')
const rowSelection = ref<Record<string, boolean>>({})
const deleteTarget = ref<any>(null)
const bulkDeleteName = ref('')
const deleting = ref(false)
const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

const filteredUsers = computed(() => {
  let result = [...users.value]

  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter((u: any) =>
      (u.nama || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    )
  }

  if (roleFilter.value !== 'all') {
    result = result.filter((u: any) => u.role === roleFilter.value)
  }

  if (statusFilter.value !== 'all') {
    result = result.filter((u: any) => u.status === statusFilter.value)
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
      const u = row.original
      return h('div', { class: 'flex items-center gap-3' }, [
        h(resolveComponent('UAvatar'), {
          size: 'lg',
          text: (u.nama || '?').charAt(0).toUpperCase()
        }),
        h('div', undefined, [
          h('p', { class: 'font-medium text-highlighted' }, u.nama),
          h('p', { class: 'text-sm text-muted' }, u.email)
        ])
      ])
    }
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }: any) => {
      const colors: Record<string, string> = {
        admin: 'red',
        koordinator: 'blue',
        anggota: 'green',
        kepala: 'purple'
      }
      return h(resolveComponent('UBadge'), {
        color: colors[row.original.role] || 'neutral',
        variant: 'soft',
        class: 'capitalize'
      }, () => upperFirst(row.original.role))
    }
  },
  {
    accessorKey: 'region_id',
    header: 'Wilayah',
    cell: ({ row }: any) => {
      const region = regions.value.find((r: any) => r.id === row.original.region_id)
      return region?.nama || '-'
    }
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
            usersAddModal.value?.openEdit(row.original)
          }
        },
        {
          label: 'Hapus',
          icon: 'i-lucide-trash-2',
          color: 'error' as const,
          onSelect() {
            deleteTarget.value = row.original
            bulkDeleteName.value = row.original.nama
            usersDeleteModal.value?.open()
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

async function loadUsers() {
  loading.value = true
  try {
    const data = await $fetch('/api/users')
    users.value = data
  } finally {
    loading.value = false
  }
}

async function loadRegions() {
  const data = await $fetch('/api/regions')
  regions.value = data
}

function openEdit(row: any) {
  usersAddModal.value?.openEdit(row)
}

async function handleModalSuccess() {
  await loadUsers()
}

async function handleConfirmDelete() {
  usersDeleteModal.value?.setLoading(true)
  try {
    if (deleteTarget.value?.id) {
      await $fetch(`/api/users/${deleteTarget.value.id}`, { method: 'DELETE' })
      toast.add({ color: 'success', title: 'Pengguna berhasil dihapus' })
      deleteTarget.value = null
      bulkDeleteName.value = ''
    } else {
      const selectedIds = Object.keys(rowSelection.value).filter(key => rowSelection.value[key])
      if (!selectedIds.length) {
        usersDeleteModal.value?.close()
        return
      }
      await Promise.all(selectedIds.map(id => $fetch(`/api/users/${id}`, { method: 'DELETE' })))
      toast.add({ color: 'success', title: `${selectedIds.length} pengguna berhasil dihapus` })
      rowSelection.value = {}
    }
    await loadUsers()
    usersDeleteModal.value?.close()
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || 'Gagal menghapus' })
  } finally {
    usersDeleteModal.value?.setLoading(false)
    deleting.value = false
  }
}

function roleColor(role: string) {
  const colors: Record<string, string> = {
    admin: 'red',
    koordinator: 'blue',
    anggota: 'green',
    kepala: 'purple'
  }
  return colors[role] || 'neutral'
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    admin: 'Admin',
    koordinator: 'Koordinator',
    anggota: 'Anggota',
    kepala: 'Kepala'
  }
  return labels[role] || role
}

function getRegionName(regionId: number) {
  const region = regions.value.find(r => r.id === regionId)
  return region?.nama || '-'
}

onMounted(async () => {
  await loadRegions()
  await loadUsers()
})
</script>
