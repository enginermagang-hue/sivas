<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const { user, logout } = useAuth()
const colorMode = useColorMode()
const appConfig = useAppConfig()
const toast = useToast()

const colors = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']
const neutrals = ['slate', 'gray', 'zinc', 'neutral', 'stone', 'taupe', 'mauve', 'mist', 'olive']

const userData = computed(() => ({
  name: user.value?.nama || 'User',
  avatar: {
    src: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.value?.nama || 'User')}&background=random`,
    alt: user.value?.nama || 'User'
  }
}))

const items = computed<DropdownMenuItem[][]>(() => {
  const userItem: DropdownMenuItem = {
    type: 'label',
    label: userData.value.name,
    avatar: userData.value.avatar
  }

  const themeItem: DropdownMenuItem = {
    label: 'Theme',
    icon: 'i-lucide-palette',
    children: [
      {
        label: 'Primary',
        slot: 'chip',
        chip: appConfig.ui.colors.primary,
        content: { align: 'center', collisionPadding: 16 },
        children: colors.map(color => ({
          label: color,
          chip: color,
          slot: 'chip',
          checked: appConfig.ui.colors.primary === color,
          type: 'checkbox',
          onSelect: (e: Event) => {
            e.preventDefault()
            appConfig.ui.colors.primary = color
          }
        }))
      },
      {
        label: 'Neutral',
        slot: 'chip',
        chip: appConfig.ui.colors.neutral === 'neutral' ? 'old-neutral' : appConfig.ui.colors.neutral,
        content: { align: 'end', collisionPadding: 16 },
        children: neutrals.map(color => ({
          label: color,
          chip: color === 'neutral' ? 'old-neutral' : color,
          slot: 'chip',
          type: 'checkbox',
          checked: appConfig.ui.colors.neutral === color,
          onSelect: (e: Event) => {
            e.preventDefault()
            appConfig.ui.colors.neutral = color
          }
        }))
      }
    ]
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

  const templatesItem: DropdownMenuItem = {
    label: 'Templates',
    icon: 'i-lucide-layout-template',
    children: [
      { label: 'Starter', to: 'https://starter-template.nuxt.dev/' },
      { label: 'Landing', to: 'https://landing-template.nuxt.dev/' },
      { label: 'Docs', to: 'https://docs-template.nuxt.dev/' },
      { label: 'SaaS', to: 'https://saas-template.nuxt.dev/' },
      { label: 'Dashboard', to: 'https://dashboard-template.nuxt.dev/', color: 'primary', checked: true, type: 'checkbox' },
      { label: 'Chat', to: 'https://chat-template.nuxt.dev/' },
      { label: 'Portfolio', to: 'https://portfolio-template.nuxt.dev/' },
      { label: 'Changelog', to: 'https://changelog-template.nuxt.dev/' },
      { label: 'Editor', to: 'https://editor-template.nuxt.dev/' },
      { label: 'Calendar', to: 'https://calendar-template.nuxt.dev/' }
    ]
  }

  const docsItem: DropdownMenuItem = {
    label: 'Documentation',
    icon: 'i-lucide-book-open',
    to: 'https://ui.nuxt.com/docs/getting-started/installation/nuxt',
    target: '_blank'
  }

  const githubItem: DropdownMenuItem = {
    label: 'GitHub repository',
    icon: 'i-simple-icons-github',
    to: 'https://github.com/nuxt-ui-templates/dashboard',
    target: '_blank'
  }

  const vercelItem: DropdownMenuItem = {
    label: 'Deploy to Vercel',
    icon: 'i-simple-icons-vercel',
    to: 'https://vercel.com/new/clone?repository-name=dashboard&repository-url=https%3A%2F%2Fgithub.com%2Fnuxt-ui-templates%2Fdashboard&demo-image=https%3A%2F%2Fui.nuxt.com%2Fassets%2Ftemplates%2Fnuxt%2Fdashboard-dark.png&demo-url=https%3A%2F%2Fdashboard-template.nuxt.dev%2F&demo-title=Nuxt%20Dashboard%20Template&demo-description=A%20dashboard%20template%20with%20multi-column%20layout%20for%20building%20sophisticated%20admin%20interfaces.',
    target: '_blank'
  }

  const logoutItem: DropdownMenuItem = {
    label: 'Log out',
    icon: 'i-lucide-log-out'
  }

  return [
    [userItem, themeItem, appearanceItem, templatesItem, docsItem, githubItem, vercelItem],
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
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down'
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{ trailingIcon: 'text-dimmed' }"
    />
    <template #chip-leading="{ item }">
      <div class="inline-flex items-center justify-center shrink-0 size-5">
        <span
          class="rounded-full ring ring-bg bg-(--chip-light) dark:bg-(--chip-dark) size-2"
          :style="{
            '--chip-light': `var(--color-${(item as any).chip}-500)`,
            '--chip-dark': `var(--color-${(item as any).chip}-400)`
          }"
        />
      </div>
    </template>
    <template #item="{ item }">
      <span v-if="item.label === 'Log out'" @click="handleLogout">
        {{ item.label }}
      </span>
    </template>
  </UDropdownMenu>
</template>
