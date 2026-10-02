<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const { user, logout } = useAuth()
const colorMode = useColorMode()
const toast = useToast()

function avatarSrc(): string {
  const a = (user.value as any)?.avatar
  const g = (user.value as any)?.googleAvatar
  if (a && String(a).trim()) return String(a)
  if (g && String(g).trim()) return String(g)
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.value?.nama || 'User')}&background=random`
}

const userData = computed(() => ({
  label: user.value?.nama || 'User',
  avatar: {
    src: avatarSrc(),
    alt: user.value?.nama || 'User'
  }
}))

const items = computed<DropdownMenuItem[][]>(() => {
  const userItem: DropdownMenuItem = {
    type: 'label',
    label: userData.value.label,
    avatar: userData.value.avatar
  }

  const profileItem: DropdownMenuItem = {
    label: 'Profil',
    icon: 'i-lucide-user',
    to: '/profile'
  }

  const appearanceItem: DropdownMenuItem = {
    label: 'Appearance',
    icon: 'i-lucide-sun-moon',
    children: [
      {
        label: 'Light',
        icon: 'i-lucide-sun',
        type: 'checkbox',
        checked: colorMode.value === 'light',
        onSelect(e: Event) {
          e.preventDefault()
          colorMode.preference = 'light'
        }
      },
      {
        label: 'Dark',
        icon: 'i-lucide-moon',
        type: 'checkbox',
        checked: colorMode.value === 'dark',
        onUpdateChecked(checked: boolean) {
          if (checked) {
            colorMode.preference = 'dark'
          }
        },
        onSelect(e: Event) {
          e.preventDefault()
        }
      }
    ]
  }

  const logoutItem: DropdownMenuItem = {
    label: 'Log out',
    icon: 'i-lucide-log-out',
    onSelect() {
      void handleLogout()
    }
  }

  return [
    [userItem, profileItem, appearanceItem],
    [logoutItem]
  ]
})

async function handleLogout() {
  try {
    await logout()
    toast.add({ color: 'success', title: 'Berhasil keluar' })
    navigateTo('/login')
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || 'Gagal keluar' })
  }
}
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      v-bind="{
        ...userData,
        label: collapsed ? undefined : userData.label,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down'
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{ trailingIcon: 'text-dimmed' }"
    />
  </UDropdownMenu>
</template>
