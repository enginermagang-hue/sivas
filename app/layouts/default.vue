<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const toast = useToast()
const open = ref(false)

const { user, logout } = useAuth()

const links = computed<NavigationMenuItem[][]>(() => {
  const role = user.value?.role
  const mainItems: NavigationMenuItem[] = []

  if (role === 'admin') {
    mainItems.push(
      { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/admin/dashboard', onSelect: () => { open.value = false } },
      { label: 'Pengguna', icon: 'i-lucide-users', to: '/admin/users', onSelect: () => { open.value = false } },
      { label: 'Wilayah', icon: 'i-lucide-map', to: '/admin/regions', onSelect: () => { open.value = false } },
      { label: 'Kategori', icon: 'i-lucide-tag', to: '/admin/categories', onSelect: () => { open.value = false } }
    )
  } else if (role === 'koordinator') {
    mainItems.push(
      { label: 'Anggota', icon: 'i-lucide-users', to: '/koordinator/members', onSelect: () => { open.value = false } },
      { label: 'Aktivitas', icon: 'i-lucide-activity', to: '/koordinator/activities', onSelect: () => { open.value = false } },
      { label: 'Input Aktivitas', icon: 'i-lucide-plus-circle', to: '/koordinator/input', onSelect: () => { open.value = false } }
    )
  } else if (role === 'anggota') {
    mainItems.push(
      { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/anggota/dashboard', onSelect: () => { open.value = false } },
      { label: 'Aktivitas', icon: 'i-lucide-activity', to: '/anggota/activities', onSelect: () => { open.value = false } }
    )
  } else if (role === 'kepala') {
    mainItems.push(
      { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/kepala/dashboard', onSelect: () => { open.value = false } },
      { label: 'Aktivitas', icon: 'i-lucide-activity', to: '/kepala/activities', onSelect: () => { open.value = false } },
      { label: 'Export', icon: 'i-lucide-download', to: '/kepala/export', onSelect: () => { open.value = false } }
    )
  }

  const secondaryItems: NavigationMenuItem[] = [
    {
      label: 'Feedback',
      icon: 'i-lucide-message-circle',
      to: 'https://github.com/nuxt-ui-templates/dashboard',
      target: '_blank',
      onSelect: () => { open.value = false }
    },
    {
      label: 'Help & Support',
      icon: 'i-lucide-info',
      to: 'https://github.com/nuxt-ui-templates/dashboard',
      target: '_blank',
      onSelect: () => { open.value = false }
    }
  ]

  return [mainItems, secondaryItems]
})

const groups = computed(() => [
  {
    id: 'links',
    label: 'Go to',
    items: links.value.flat()
  },
  {
    id: 'code',
    label: 'Code',
    items: [
      {
        id: 'source',
        label: 'View page source',
        icon: 'i-simple-icons-github',
        to: `https://github.com/nuxt-ui-templates/dashboard/blob/main/app/pages${route.path === '/' ? '/index' : route.path}.vue`,
        target: '_blank'
      }
    ]
  }
])

onMounted(async () => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') {
    return
  }

  toast.add({
    title: 'We use first-party cookies to enhance your experience on our website.',
    duration: 0,
    close: false,
    actions: [
      {
        label: 'Accept',
        color: 'neutral',
        variant: 'outline',
        onClick: () => {
          cookie.value = 'accepted'
        }
      },
      {
        label: 'Opt out',
        color: 'neutral',
        variant: 'ghost'
      }
    ]
  })
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <NotificationsSlideover />

    <UToaster />
    <slot />
  </UDashboardGroup>
</template>
