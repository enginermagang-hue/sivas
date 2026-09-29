<template>
<UDashboardPanel id="anggota-input">
  <template #header>
    <UDashboardNavbar title="Input Aktivitas">
      <template #leading>
        <UDashboardSidebarCollapse />
      </template>
    </UDashboardNavbar>
  </template>

  <template #body>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Input Aktivitas</h1>
    </div>

    <UCard>
      <ActivityForm
        :categories="categories"
        @submit="handleSubmit"
        @cancel="navigateTo('/anggota/activities')"
      />
    </UCard>
  </template>
</UDashboardPanel>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { user } = useAuth()
const toast = useToast()
const categories = ref<any[]>([])

async function loadCategories() {
  const data = await $fetch('/api/categories')
  categories.value = data
}

async function handleSubmit(form: any) {
  try {
    await $fetch('/api/activities', {
      method: 'POST',
      body: {
        ...form,
        user_id: user.value?.id,
        region_id: user.value?.regionId
      }
    })
    toast.add({ color: 'success', title: 'Aktivitas berhasil disimpan' })
    await navigateTo('/anggota/activities')
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || 'Gagal menyimpan aktivitas' })
  }
}

onMounted(async () => {
  await loadCategories()
})
</script>
