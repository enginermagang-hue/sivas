<script setup lang="ts">
defineProps<{ collapsed?: boolean }>()

const { isNotificationsSlideoverOpen } = useDashboard()

const { data: notifications } = await useFetch<any[]>('/api/notifications', {
  lazy: false,
  default: () => [],
  query: { unread: '1' }
})

const unreadCount = computed(() => (notifications.value || []).filter((n: any) => !n.read).length)

let poll: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  poll = setInterval(async () => {
    try {
      const data = await $fetch<any[]>('/api/notifications', { query: { unread: '1' } })
      notifications.value = data as any
    } catch {}
  }, 30000)
})
onBeforeUnmount(() => { if (poll) clearInterval(poll) })
</script>

<template>
  <UChip :show="unreadCount > 0" :text="String(unreadCount)" color="error" size="sm" :class="collapsed ? '' : 'w-full'">
    <UButton
      :label="collapsed ? undefined : 'Notifikasi'"
      icon="i-lucide-bell"
      color="neutral"
      variant="ghost"
      :block="!collapsed"
      :square="collapsed"
      trailing-icon="i-lucide-chevron-right"
      :ui="{ trailingIcon: 'text-dimmed' }"
      aria-label="Notifikasi"
      @click="isNotificationsSlideoverOpen = true"
    />
  </UChip>
</template>
