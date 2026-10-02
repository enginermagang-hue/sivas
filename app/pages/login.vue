<script setup lang="ts">
import * as z from 'zod'
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'

definePageMeta({ layout: false })

const { login, googleLogin, fetchMe } = useAuth()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const loading = ref(false)
const error = ref('')

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  'google-config': 'Login Google belum dikonfigurasi. Hubungi admin.',
  'google-cancelled': 'Login Google dibatalkan.',
  'google-unregistered': 'Akun Google tidak terdaftar. Hubungi admin.',
  'google-inactive': 'Akun nonaktif. Hubungi admin.',
  'google': 'Login Google gagal. Silakan coba lagi.'
}

function showGoogleErrorToast(code: string) {
  const msg = GOOGLE_ERROR_MESSAGES[code]
  if (!msg) return
  error.value = msg
  const isWarning = code === 'google-unregistered' || code === 'google-inactive'
  const isCancelled = code === 'google-cancelled'
  toast.add({
    title: isWarning ? 'Akun tidak terdaftar' : isCancelled ? 'Login dibatalkan' : 'Login Google gagal',
    description: msg,
    color: isWarning ? 'warning' : isCancelled ? 'neutral' : 'error',
    icon: isWarning ? 'i-lucide-triangle-alert' : isCancelled ? 'i-lucide-circle-pause' : 'i-lucide-circle-x'
  })
}

onMounted(() => {
  const q = route.query.error
  if (typeof q === 'string' && GOOGLE_ERROR_MESSAGES[q]) {
    showGoogleErrorToast(q)
    router.replace({ query: {} })
  }
  let lastKey = ''
  let lastAt = 0
  const handleGooglePayload = async (data: any) => {
    if (!data || typeof data.type !== 'string') return
    const key = `${data.type}:${data.error ?? ''}`
    const now = Date.now()
    if (key === lastKey && now - lastAt < 1500) return
    lastKey = key
    lastAt = now
    if (data.type === 'google-auth-success') {
      await fetchMe()
      toast.add({ title: 'Berhasil masuk', description: 'Mengalihkan ke dashboard...', color: 'success' })
      await navigateTo('/', { replace: true })
    } else if (data.type === 'google-auth-error' && typeof data.error === 'string') {
      showGoogleErrorToast(data.error)
    }
  }
  const onMessage = async (e: MessageEvent) => {
    if (e.origin !== window.location.origin) return
    await handleGooglePayload(e.data)
  }
  window.addEventListener('message', onMessage)
  let bc: BroadcastChannel | null = null
  try {
    bc = new BroadcastChannel('google_auth')
    bc.onmessage = (e: MessageEvent) => { void handleGooglePayload(e.data) }
  } catch {}
  onBeforeUnmount(() => {
    window.removeEventListener('message', onMessage)
    try { bc?.close() } catch {}
  })
})

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

const providers = [
  {
    label: 'Login Google',
    icon: 'i-simple-icons-google',
    color: 'neutral' as const,
    variant: 'outline' as const,
    class: 'group transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:scale-[1.01] motion-safe:transition-all',
    ui: { leadingIcon: 'transition-all duration-300 ease-out motion-safe:group-hover:scale-110 motion-safe:group-hover:text-[#4285F4]' },
    onClick: () => googleLogin()
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
    toast.add({ title: 'Berhasil masuk', description: 'Mengalihkan...', color: 'success' })
    await router.push('/')
  } catch (e: any) {
    error.value = e?.statusMessage || e?.data?.statusMessage || 'Login gagal'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-sm">
      <UAuthForm
        :schema="schema"
        :fields="fields"
        :providers="providers"
        separator="atau"
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
            variant="subtle"
            icon="i-lucide-circle-x"
            :title="error"
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
