<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="flex min-h-screen">
      <aside class="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div class="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <UIcon name="i-lucide-activity" class="w-6 h-6 text-primary-500 mr-2" />
          <span class="text-lg font-bold text-gray-900 dark:text-white">Aktivitas Harian</span>
        </div>
        <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <UButton
            v-for="item in menuItems"
            :key="item.to"
            :to="item.to"
            variant="ghost"
            color="neutral"
            class="w-full justify-start"
            :class="{ 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400': isActive(item.to) }"
          >
            <UIcon :name="item.icon" class="w-5 h-5 mr-3" />
            {{ item.label }}
          </UButton>
        </nav>
        <div class="p-4 border-t border-gray-200 dark:border-gray-700">
          <UButton
            variant="ghost"
            color="neutral"
            class="w-full justify-start"
            @click="logout"
          >
            <UIcon name="i-lucide-log-out" class="w-5 h-5 mr-3" />
            Keluar
          </UButton>
        </div>
      </aside>

      <div class="flex-1 lg:pl-64">
        <header class="flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center lg:hidden">
            <UIcon name="i-lucide-activity" class="w-6 h-6 text-primary-500 mr-2" />
            <span class="text-lg font-bold text-gray-900 dark:text-white">Aktivitas Harian</span>
          </div>
          <div class="flex items-center gap-4 ml-auto">
            <NotificationBell />
            <UAvatar :text="user?.nama || 'U'" />
            <div class="hidden sm:block">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ user?.nama }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 capitalize">{{ user?.role }}</p>
            </div>
          </div>
        </header>

        <main class="p-6">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, logout } = useAuth()

const menuItems = computed(() => {
  const role = user.value?.role
  const items: any[] = []

  if (role === 'admin') {
    items.push(
      { to: '/admin/users', label: 'Pengguna', icon: 'i-lucide-users' },
      { to: '/admin/regions', label: 'Wilayah', icon: 'i-lucide-map' },
      { to: '/admin/categories', label: 'Kategori', icon: 'i-lucide-tag' }
    )
  } else if (role === 'koordinator') {
    items.push(
      { to: '/koordinator/members', label: 'Anggota', icon: 'i-lucide-users' },
      { to: '/koordinator/activities', label: 'Aktivitas', icon: 'i-lucide-activity' },
      { to: '/koordinator/input', label: 'Input Aktivitas', icon: 'i-lucide-plus-circle' }
    )
  } else if (role === 'anggota') {
    items.push(
      { to: '/anggota/activities', label: 'Aktivitas', icon: 'i-lucide-activity' },
      { to: '/anggota/input', label: 'Input Aktivitas', icon: 'i-lucide-plus-circle' }
    )
  } else if (role === 'kepala') {
    items.push(
      { to: '/kepala/dashboard', label: 'Dashboard', icon: 'i-lucide-layout-dashboard' },
      { to: '/kepala/activities', label: 'Aktivitas', icon: 'i-lucide-activity' },
      { to: '/kepala/export', label: 'Export', icon: 'i-lucide-download' }
    )
  }

  return items
})

function isActive(to: string) {
  const route = useRoute()
  return route.path === to || route.path.startsWith(to + '/')
}
</script>
