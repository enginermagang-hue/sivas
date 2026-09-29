<template>
  <UDropdown :items="localeItems" :ui="{ width: 'w-40' }">
    <UButton color="neutral" variant="ghost" icon="i-lucide-globe">
      {{ currentLocaleLabel }}
    </UButton>

    <template #content="{ close }">
      <div v-for="item in localeItems" :key="item.label">
        <UButton
          v-for="loc in item"
          :key="loc.value"
          variant="ghost"
          class="w-full justify-start"
          :class="{ 'bg-primary-50 dark:bg-primary-900/20': locale === loc.value }"
          @click="selectLocale(loc.value); close()"
        >
          {{ loc.label }}
        </UButton>
      </div>
    </template>
  </UDropdown>
</template>

<script setup lang="ts">
const { locale, setLocale } = useI18n()

const locales = [
  { label: 'Indonesia', value: 'id' },
  { label: 'English', value: 'en' }
]

const localeItems = computed(() => [locales])

const currentLocaleLabel = computed(() => {
  const found = locales.find(l => l.value === locale.value)
  return found?.label || 'Language'
})

function selectLocale(loc: string) {
  setLocale(loc)
}
</script>
