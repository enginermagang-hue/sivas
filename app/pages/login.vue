<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-sm">
      <UAuthForm
        :schema="schema"
        :fields="fields"
        title="Masuk"
        description="Masuk ke akun Aktivitas Harian"
        icon="i-lucide-activity"
        :submit="{ label: 'Masuk', block: true }"
        :loading="loading"
        @submit="onSubmit"
      >
        <template #validation>
          <UAlert
            v-if="error"
            color="error"
            variant="soft"
            :title="error"
            @close="error = ''"
          />
        </template>
        <template #footer>
          <p class="text-center text-sm text-muted">
            Demo: admin@example.com / admin123
          </p>
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>

<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'

definePageMeta({
  layout: false
})

const { login } = useAuth()
const router = useRouter()

const loading = ref(false)
const error = ref('')

const fields: AuthFormField[] = [
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    placeholder: 'nama@example.com',
    required: true
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    placeholder: '••••••••',
    required: true
  }
]

const schema = z.object({
  email: z.email({
    error: (iss: any) => (iss.input === undefined ? 'Email wajib diisi' : 'Email tidak valid')
  }),
  password: z.string({ error: 'Password wajib diisi' }).min(1, 'Password wajib diisi')
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  loading.value = true
  error.value = ''

  try {
    await login(payload.data.email, payload.data.password)
    await router.push('/')
  } catch (e: any) {
    error.value = e?.statusMessage || 'Login gagal'
  } finally {
    loading.value = false
  }
}
</script>
