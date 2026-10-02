<script setup lang="ts">
const { loggingOut } = useAuth()
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- ponytail: global blocking overlay; upgrade to UModal if richer UX needed -->
    <div
      v-if="loggingOut"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Logout"
    >
      <div class="flex flex-col items-center gap-4 rounded-xl bg-white dark:bg-gray-900 px-8 py-6 shadow-xl">
        <UIcon name="i-lucide-loader-circle" class="animate-spin size-8 text-primary" aria-hidden="true" />
        <p class="text-sm font-medium">
          Logout...
        </p>
      </div>
    </div>
  </UApp>
</template>
