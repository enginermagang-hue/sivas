<script setup lang="ts">
import { formatTimeAgo } from '@vueuse/core'
import { parseDate } from '~/utils/date'

const { user } = useAuth()
const { isNotificationsSlideoverOpen } = useDashboard()

const { data: notifications, refresh } = await useFetch<any[]>('/api/notifications', {
  lazy: false,
  default: () => [],
  watch: [isNotificationsSlideoverOpen]
})

watch(isNotificationsSlideoverOpen, (open) => {
  if (open) refresh()
})

async function markAllAsRead() {
  try {
    await $fetch('/api/notifications/read', { method: 'POST' })
    await refresh()
  } catch (e: any) {
    console.error('Failed to mark notifications as read', e)
  }
}

function onNotificationClick(n: any) {
  isNotificationsSlideoverOpen.value = false
  const id = n?.entity_id
  if (!id) return
  const role = user.value?.role
  if (role === 'anggota') navigateTo(`/anggota/activities/${id}`)
  else if (role === 'koordinator') navigateTo(`/koordinator/activities/${id}`)
  else if (role === 'kepala') navigateTo(`/kepala/activities/${id}`)
  else if (role === 'admin') navigateTo(`/kepala/activities/${id}`)
}

let poll: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  poll = setInterval(() => { void refresh() }, 30000)
})
onBeforeUnmount(() => {
  if (poll) clearInterval(poll)
})
</script>

<template>
  <USlideover
    v-model:open="isNotificationsSlideoverOpen"
    title="Notifikasi"
  >
    <template #body>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Notifikasi</h3>
        <UButton
          v-if="notifications.some((n) => !n.read)"
          variant="ghost"
          size="xs"
          @click="markAllAsRead"
        >
          Tandai semua dibaca
        </UButton>
      </div>

      <div v-if="notifications.length === 0" class="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Tidak ada notifikasi
      </div>

      <NuxtLink
        v-for="notification in notifications"
        :key="notification.id"
        class="px-3 py-2.5 rounded-md hover:bg-elevated/50 flex items-start gap-3 relative -mx-3 first:-mt-3 last:-mb-3 cursor-pointer"
        @click="onNotificationClick(notification)"
      >
        <UChip
          color="error"
          :show="!notification.read"
          inset
        >
          <UAvatar
            icon="i-lucide-bell"
            size="md"
            color="neutral"
            variant="ghost"
          />
        </UChip>

        <div class="text-sm flex-1">
          <p class="flex items-center justify-between">
            <span class="text-highlighted font-medium">{{ notification.title }}</span>
            <time
              :datetime="notification.created_at"
              class="text-muted text-xs"
              v-text="formatTimeAgo(parseDate(notification.created_at))"
            />
          </p>
          <p class="text-dimmed">
            {{ notification.message }}
          </p>
        </div>
      </NuxtLink>
    </template>
  </USlideover>
</template>
