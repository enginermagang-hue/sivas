<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="flex items-center justify-center">
          <UIcon name="i-lucide-activity" class="w-8 h-8 text-primary-500 mr-2" />
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Aktivitas Harian</h1>
        </div>
      </template>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <UFormField label="Email" name="email">
          <UInput
            v-model="email"
            type="email"
            placeholder="nama@example.com"
            :disabled="loading"
            required
          />
        </UFormField>

        <UFormField label="Password" name="password">
          <UInput
            v-model="password"
            type="password"
            placeholder="••••••••"
            :disabled="loading"
            required
          />
        </UFormField>

        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          :title="error"
          @close="error = ''"
        />

        <UButton
          type="submit"
          block
          :loading="loading"
          :disabled="loading"
        >
          Masuk
        </UButton>
      </form>

      <template #footer>
        <p class="text-center text-sm text-gray-500 dark:text-gray-400">
          Demo: admin@example.com / admin123
        </p>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const { login } = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''

  try {
    await login(email.value, password.value)
    await router.push('/')
  } catch (e: any) {
    error.value = e?.statusMessage || 'Login gagal'
  } finally {
    loading.value = false
  }
}
</script>
