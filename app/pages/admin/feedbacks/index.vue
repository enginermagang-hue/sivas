<script setup lang="ts">
import { formatDateTime } from '~/utils/date'

definePageMeta({ layout: 'default' })

const { user } = useAuth()
if (user.value?.role !== 'admin') throw createError({ statusCode: 403, statusMessage: 'Hanya admin' })

const toast = useToast()
const feedbacks = ref<any[]>([])
const loading = ref(true)
const search = ref('')
const kategoriFilter = ref<string>('all')
const statusFilter = ref<string>('all')

function kategoriLabel(k: string) {
  const m: Record<string, string> = { saran: 'Saran', bug: 'Bug', pertanyaan: 'Pertanyaan', lainnya: 'Lainnya' }
  return m[k] || k
}
function statusLabel(s: string) {
  return s === 'resolved' ? 'Selesai' : s === 'read' ? 'Dibaca' : 'Belum dibaca'
}
function statusColor(s: string): any {
  return s === 'resolved' ? 'success' : s === 'read' ? 'info' : 'warning'
}
function kategoriColor(k: string): any {
  return k === 'bug' ? 'error' : k === 'pertanyaan' ? 'info' : k === 'lainnya' ? 'neutral' : 'primary'
}

async function load() {
  loading.value = true
  try {
    const res: any = await $fetch('/api/feedbacks')
    feedbacks.value = Array.isArray(res) ? res : []
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || 'Gagal memuat feedback' })
  } finally {
    loading.value = false
  }
}

const filtered = computed(() => {
  let list = feedbacks.value
  if (kategoriFilter.value !== 'all') list = list.filter((f: any) => f.kategori === kategoriFilter.value)
  if (statusFilter.value !== 'all') list = list.filter((f: any) => f.status === statusFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter((f: any) =>
      String(f.pesan).toLowerCase().includes(q) ||
      String(f.user_nama || '').toLowerCase().includes(q) ||
      String(f.user_email || '').toLowerCase().includes(q)
    )
  }
  return list
})

async function setStatus(f: any, status: string) {
  try {
    await $fetch(`/api/feedbacks/${f.id}`, { method: 'PUT', body: { status } })
    f.status = status
    toast.add({ color: 'success', title: 'Status diperbarui' })
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || e?.data?.statusMessage || 'Gagal' })
  }
}

async function removeFeedback(f: any) {
  if (!confirm(`Hapus masukan dari ${f.user_nama}?`)) return
  try {
    await $fetch(`/api/feedbacks/${f.id}`, { method: 'DELETE' })
    feedbacks.value = feedbacks.value.filter((x: any) => x.id !== f.id)
    toast.add({ color: 'success', title: 'Feedback dihapus' })
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || 'Gagal menghapus' })
  }
}

onMounted(load)
</script>

<template>
  <UDashboardPanel id="admin-feedbacks">
    <template #header>
      <UDashboardNavbar title="Feedback Pengguna">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton to="/feedback" color="neutral" variant="soft" icon="i-lucide-message-circle">Halaman Feedback</UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4 space-y-4">
        <div class="flex flex-wrap gap-2">
          <UInput v-model="search" placeholder="Cari pesan / nama / email..." icon="i-lucide-search" class="min-w-64 flex-1 max-w-sm" />
          <USelect v-model="kategoriFilter" :items="[{ label: 'Semua kategori', value: 'all' }, { label: 'Saran', value: 'saran' }, { label: 'Bug', value: 'bug' }, { label: 'Pertanyaan', value: 'pertanyaan' }, { label: 'Lainnya', value: 'lainnya' }]" class="min-w-36" />
          <USelect v-model="statusFilter" :items="[{ label: 'Semua status', value: 'all' }, { label: 'Belum dibaca', value: 'unread' }, { label: 'Dibaca', value: 'read' }, { label: 'Selesai', value: 'resolved' }]" class="min-w-36" />
        </div>

        <div v-if="loading" class="flex justify-center py-12">
          <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-muted" />
        </div>

        <p v-else-if="filtered.length === 0" class="text-sm text-muted text-center py-8">Tidak ada feedback.</p>

        <div v-else class="space-y-3">
          <UCard v-for="f in filtered" :key="f.id">
            <div class="flex gap-3">
              <UAvatar :src="f.avatar || f.google_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.user_nama || 'User')}&background=random`" :alt="f.user_nama" size="md" />
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap gap-2 items-center">
                  <span class="font-medium text-highlighted">{{ f.user_nama }}</span>
                  <span class="text-xs text-muted">{{ f.user_email }} · {{ f.user_role }}</span>
                  <span v-if="f.region_nama" class="text-xs text-muted">· {{ f.region_nama }}</span>
                </div>
                <div class="flex flex-wrap gap-1.5 mt-1">
                  <UBadge :color="kategoriColor(f.kategori)" variant="soft">{{ kategoriLabel(f.kategori) }}</UBadge>
                  <UBadge :color="statusColor(f.status)" variant="soft">{{ statusLabel(f.status) }}</UBadge>
                  <span v-if="f.rating" class="text-xs text-muted flex items-center gap-0.5"><UIcon name="i-lucide-star" class="w-3 h-3 text-warning" /> {{ f.rating }}/5</span>
                  <span class="text-xs text-muted ml-auto">{{ formatDateTime(f.created_at) }}</span>
                </div>
                <p class="text-sm mt-2 whitespace-pre-wrap">{{ f.pesan }}</p>
                <div class="flex flex-wrap gap-1.5 mt-3">
                  <UButton v-if="f.status === 'unread'" size="xs" color="neutral" variant="soft" @click="setStatus(f, 'read')">Tandai dibaca</UButton>
                  <UButton v-if="f.status !== 'resolved'" size="xs" color="success" variant="soft" @click="setStatus(f, 'resolved')">Selesai</UButton>
                  <UButton v-if="f.status === 'resolved'" size="xs" color="neutral" variant="ghost" @click="setStatus(f, 'read')">Buka lagi</UButton>
                  <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash" @click="removeFeedback(f)">Hapus</UButton>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
