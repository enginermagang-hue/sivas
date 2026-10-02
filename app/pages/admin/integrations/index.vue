<template>
<UDashboardPanel id="admin-integrations">
  <template #header>
    <UDashboardNavbar title="Integrasi Google Drive">
      <template #leading>
        <UDashboardSidebarCollapse />
      </template>
    </UDashboardNavbar>
  </template>

  <template #body>
    <UCard>
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Koneksi penyimpanan lampiran</h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Semua upload anggota dan koordinator disimpan ke akun Google yang terhubung di sini.
          </p>
        </div>
        <UBadge :color="statusColor" variant="subtle">{{ statusLabel }}</UBadge>
      </div>

      <div v-if="status?.email" class="mt-4 text-sm text-gray-700 dark:text-gray-200">
        Akun terhubung: <strong>{{ status.displayName || status.email }}</strong>
        <span v-if="status.displayName" class="text-gray-500">({{ status.email }})</span>
        <span v-if="connectedSince" class="text-gray-500"> — terhubung sejak {{ connectedSince }}</span>
      </div>

      <UAlert
        v-if="status?.expired"
        class="mt-4"
        color="warning"
        variant="soft"
        title="Koneksi Google Drive kedaluwarsa"
        description="Refresh token tidak berlaku lagi. Tekan Hubungkan ulang lalu selesaikan consent Google."
      />

      <UAlert
        v-if="feedback"
        class="mt-4"
        :color="feedbackColor"
        variant="soft"
        :title="feedback"
        @close="feedback = ''"
      />

      <div class="mt-6 flex flex-wrap gap-2">
        <UButton
          icon="i-lucide-plug"
          color="primary"
          :loading="connecting"
          @click="startConnect"
        >
          {{ status?.connected ? 'Hubungkan ulang' : 'Hubungkan Google Drive' }}
        </UButton>
        <UButton
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="soft"
          :loading="checking"
          @click="refreshStatus"
        >
          Periksa koneksi
        </UButton>
        <UButton
          icon="i-lucide-unplug"
          color="error"
          variant="soft"
          :loading="disconnecting"
          :disabled="!status?.connected"
          @click="disconnect"
        >
          Putuskan
        </UButton>
      </div>
    </UCard>
  </template>
</UDashboardPanel>
</template>

<script setup lang="ts">
import { parseDate } from '~/utils/date'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()

const status = ref<{ connected: boolean; expired: boolean; email: string | null; displayName: string | null; connectedAt: string | null } | null>(null)
const feedback = ref('')
const feedbackColor = ref<'success' | 'error' | 'warning'>('success')
const checking = ref(false)
const connecting = ref(false)
const disconnecting = ref(false)

const statusLabel = computed(() => {
  if (!status.value) return 'Memeriksa...'
  if (status.value.expired) return 'Kedaluwarsa'
  return status.value.connected ? 'Terhubung' : 'Belum terhubung'
})

const statusColor = computed(() => {
  if (!status.value) return 'neutral'
  if (status.value.expired) return 'warning'
  return status.value.connected ? 'success' : 'neutral'
})

const connectedSince = computed(() => {
  if (!status.value?.connectedAt) return ''
  const d = parseDate(String(status.value.connectedAt))
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
})

function consumeOAuthResult() {
  const result = String(route.query.google ?? '')
  if (!result) return
  if (result === 'connected') {
    feedback.value = 'Google Drive berhasil dihubungkan.'
    feedbackColor.value = 'success'
  } else if (result === 'denied') {
    feedback.value = 'Koneksi dibatalkan di halaman Google.'
    feedbackColor.value = 'warning'
  } else if (result === 'no_token') {
    feedback.value = 'Google tidak menerbitkan refresh token. Ulangi proses dan pastikan consent diberikan penuh.'
    feedbackColor.value = 'warning'
  } else if (result === 'error') {
    feedback.value = 'Gagal menyelesaikan koneksi Google. Coba lagi.'
    feedbackColor.value = 'error'
  }
  router.replace({ query: {} })
}

function startConnect() {
  connecting.value = true
  window.location.href = '/api/auth/google'
}

async function refreshStatus() {  checking.value = true
  connecting.value = false
  try {
    status.value = await $fetch('/api/integrations/google')
  } catch (e: any) {
    feedback.value = e?.data?.statusMessage || e?.statusMessage || 'Gagal memeriksa status integrasi'
    feedbackColor.value = 'error'
  } finally {
    checking.value = false
  }
}

async function disconnect() {
  disconnecting.value = true
  feedback.value = ''
  try {
    const result: any = await $fetch('/api/integrations/google/disconnect', { method: 'POST' })
    feedback.value = result.message
    feedbackColor.value = 'success'
    await refreshStatus()
  } catch (e: any) {
    feedback.value = e?.data?.statusMessage || e?.statusMessage || 'Gagal memutuskan koneksi'
    feedbackColor.value = 'error'
  } finally {
    disconnecting.value = false
  }
}

onMounted(() => {
  connecting.value = false
  consumeOAuthResult()
  refreshStatus()
})
</script>
