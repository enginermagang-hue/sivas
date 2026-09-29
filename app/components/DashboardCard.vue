<template>
  <UCard>
    <div class="flex items-center gap-3">
      <UIcon :name="icon" :class="`w-8 h-8 text-${color}-500`" />
      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ title }}</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ value }}</p>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  icon?: string
  color?: string
}>()
</script>
