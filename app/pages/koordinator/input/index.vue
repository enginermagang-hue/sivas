<template>
<UDashboardPanel id="koordinator-input">
  <template #header>
    <UDashboardNavbar title="Input Aktivitas untuk Anggota">
      <template #leading>
        <UDashboardSidebarCollapse />
      </template>
    </UDashboardNavbar>
  </template>

  <template #body>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Input Aktivitas untuk Anggota</h1>
    </div>

    <UCard>
      <UForm :state="form" @submit="handleSubmit">
        <div class="space-y-4">
          <UFormField label="Pilih Anggota" name="user_id" required>
            <USelect
              v-model="form.user_id"
              :options="members"
              value-attribute="id"
              option-attribute="nama"
              placeholder="Pilih anggota"
            />
          </UFormField>

          <template v-if="form.user_id">
            <ActivityForm
              :categories="categories"
              :users="members"
              @submit="handleActivitySubmit"
              @cancel="form.user_id = null"
            />
          </template>
        </div>
      </UForm>
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
const members = ref<any[]>([])
const categories = ref<any[]>([])
const form = reactive({
  user_id: undefined as number | undefined
})

async function loadMembers() {
  const data = await $fetch('/api/users')
  members.value = data.filter((u: any) => u.role === 'anggota' && u.region_id === user.value?.regionId)
}

async function loadCategories() {
  const data = await $fetch('/api/categories')
  categories.value = data
}

async function handleActivitySubmit(activityForm: any) {
  try {
    await $fetch('/api/activities', {
      method: 'POST',
      body: {
        ...activityForm,
        user_id: form.user_id,
        region_id: user.value?.regionId
      }
    })
    toast.add({ color: 'success', title: 'Aktivitas berhasil disimpan' })
    await navigateTo('/koordinator/activities')
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || 'Gagal menyimpan aktivitas' })
  }
}

onMounted(async () => {
  await loadMembers()
  await loadCategories()
})
</script>
