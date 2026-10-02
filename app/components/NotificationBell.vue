<template>
  <UDropdown :items="menuItems" :ui="{ width: 'w-72' }">
    <UButton color="neutral" variant="ghost" icon="i-lucide-bell">
      <span v-if="unreadCount > 0" class="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
        {{ unreadCount }}
      </span>
    </UButton>

    <template #content="{ close }">
      <div class="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Notifikasi</h3>
        <UButton v-if="unreadCount > 0" variant="ghost" size="xs" @click="markAllAsRead(close)">
          Tandai semua dibaca
        </UButton>
      </div>
      <div v-if="notifications.length === 0" class="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Tidak ada notifikasi
      </div>
      <div v-for="notification in notifications" :key="notification.id" class="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0">
        <div class="flex items-start gap-2">
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ notification.title }}</p>
            <p class="text-sm text-gray-600 dark:text-gray-300">{{ notification.message }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ formatDate(notification.created_at) }}</p>
          </div>
          <span v-if="!notification.read" class="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
        </div>
      </div>
    </template>
  </UDropdown>
</template>

<script setup lang="ts">
import { formatDateTime } from '~/utils/date'

const { user } = useAuth()
const toast = useToast()
const notifications = ref<any[]>([])
const unreadCount = ref(0)
const loading = ref(false)
let refreshInterval: NodeJS.Timeout | null = null

async function loadNotifications() {
  try {
    const data = await $fetch('/api/notifications')
    notifications.value = data
    unreadCount.value = data.filter((n: any) => !n.read).length
  } catch {
    // ignore
  }
}

async function markAllAsRead(close: () => void) {
  try {
    await $fetch('/api/notifications/read', { method: 'POST' })
    notifications.value.forEach(n => n.read = 1)
    unreadCount.value = 0
    toast.add({ color: 'success', title: 'Semua notifikasi telah dibaca' })
    close()
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || 'Gagal menandai notifikasi' })
  }
}

function formatDate(dateStr: string) {
  return formatDateTime(dateStr) || ''
}

onMounted(() => {
  loadNotifications()
  refreshInterval = setInterval(loadNotifications, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
})

const menuItems = computed(() => [
  [
    {
      label: `Notifikasi (${unreadCount.value})`,
      icon: 'i-lucide-bell',
      disabled: true
    }
  ]
])
</script>
