<template>
  <UPopover
    v-model:open="open"
    :content="{ side: 'bottom', sideOffset: 8, align: 'start' }"
    :ui="{ content: 'w-80 p-3' }"
  >
    <UButton
      variant="outline"
      color="neutral"
      :label="selectedLabel"
      :icon="modelValue || 'i-lucide-smile-plus'"
      class="w-full justify-between"
    />
    <template #content>
      <div class="space-y-3">
        <UInput
          v-model="search"
          placeholder="Cari icon..."
          icon="i-lucide-search"
          size="sm"
          class="w-full"
        />
        <div class="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
          <div
            v-for="icon in filteredIcons"
            :key="icon"
            :class="[
              'flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer select-none transition-colors',
              icon === modelValue
                ? 'bg-primary/10 ring-2 ring-primary'
                : 'hover:bg-elevated'
            ]"
            @click="pickIcon(icon)"
          >
            <UIcon :name="icon" class="w-5 h-5" />
            <span class="text-xs text-muted mt-0.5 truncate w-full text-center">
              {{ iconLabel(icon) }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue?: string
}>(), {
  modelValue: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const search = ref('')
const open = ref(false)

const icons = [
  'i-lucide-star', 'i-lucide-heart', 'i-lucide-calendar', 'i-lucide-calendar-days',
  'i-lucide-clock', 'i-lucide-users', 'i-lucide-user', 'i-lucide-briefcase',
  'i-lucide-clipboard-list', 'i-lucide-file-text', 'i-lucide-megaphone', 'i-lucide-flag',
  'i-lucide-map-pin', 'i-lucide-camera', 'i-lucide-image', 'i-lucide-music',
  'i-lucide-book-open', 'i-lucide-graduation-cap', 'i-lucide-wrench', 'i-lucide-truck',
  'i-lucide-coffee', 'i-lucide-palette', 'i-lucide-rocket', 'i-lucide-lightbulb',
  'i-lucide-target', 'i-lucide-award', 'i-lucide-bell', 'i-lucide-message-circle',
  'i-lucide-phone', 'i-lucide-mail', 'i-lucide-home', 'i-lucide-building-2',
  'i-lucide-dumbbell', 'i-lucide-utensils', 'i-lucide-shopping-cart', 'i-lucide-trophy',
  'i-lucide-sparkles', 'i-lucide-tag', 'i-lucide-folder', 'i-lucide-globe',
  'i-lucide-compass', 'i-lucide-puzzle', 'i-lucide-gift', 'i-lucide-handshake',
  'i-lucide-sprout', 'i-lucide-paw-print', 'i-lucide-bike', 'i-lucide-bus'
]

const filteredIcons = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return icons
  return icons.filter(i => i.toLowerCase().includes(q))
})

const selectedLabel = computed(() => {
  return props.modelValue || 'Pilih icon'
})

function iconLabel(icon: string) {
  return icon.replace(/^i-lucide-/, '')
}

function pickIcon(icon: string) {
  emit('update:modelValue', icon)
  search.value = ''
  open.value = false
}
</script>
