<template>
  <UDashboardPanel id="activity-detail">
    <template #header>
      <UDashboardNavbar :title="activity ? `Detail Aktivitas #${activity.id}` : 'Detail Aktivitas'">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton variant="ghost" icon="i-lucide-arrow-left" :to="backTo">Kembali</UButton>
          <UButton
            v-if="canEdit"
            variant="subtle"
            icon="i-lucide-pencil"
            :disabled="!activity"
            @click="editModal?.openEdit(activity)"
          >
            Edit
          </UButton>
          <UButton
            v-if="canDelete"
            color="error"
            variant="subtle"
            icon="i-lucide-trash-2"
            :disabled="!activity"
            @click="deleteModal?.open()"
          >
            Hapus
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="pending" class="space-y-4">
        <USkeleton class="h-8 w-1/3" />
        <USkeleton class="h-40 w-full" />
        <USkeleton class="h-32 w-full" />
      </div>

      <UAlert
        v-else-if="error"
        color="error"
        variant="subtle"
        :title="errorMessage"
        description="Aktivitas tidak ditemukan atau Anda tidak memiliki akses."
      >
        <template #actions>
          <UButton variant="ghost" :to="backTo">Kembali ke daftar</UButton>
        </template>
      </UAlert>

      <template v-else-if="activity">
        <UCard class="overflow-visible">
          <template #header>
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :style="{ backgroundColor: (activity.kategori_warna || '#ccc') + '20', color: activity.kategori_warna || '#666' }"
              >
                {{ activity.kategori_nama }}
              </span>
              <span class="text-sm text-muted">{{ formatDate(activity.tanggal) }}</span>
            </div>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <p class="text-xs font-medium text-muted mb-1">Pelapor</p>
              <p class="text-sm">{{ activity.user_nama }} <span class="text-muted">({{ activity.user_role }})</span></p>
            </div>
            <div>
              <p class="text-xs font-medium text-muted mb-1">Wilayah</p>
              <p class="text-sm">{{ activity.region_nama }}</p>
            </div>
            <div>
              <p class="text-xs font-medium text-muted mb-1">Sekolah</p>
              <p class="text-sm">{{ activity.nama_sekolah || '-' }}</p>
              <p v-if="activity.npsn" class="text-xs text-muted mt-0.5">NPSN: {{ activity.npsn }}</p>
            </div>
            <div>
              <p class="text-xs font-medium text-muted mb-1">Jam</p>
              <p class="text-sm">{{ formatJam(activity.jam_mulai, activity.jam_selesai) }}</p>
            </div>
            <div>
              <p class="text-xs font-medium text-muted mb-1">Dibuat</p>
              <p class="text-sm">{{ formatDateTime(activity.created_at) }}</p>
            </div>
            <div class="md:col-span-2">
              <p class="text-xs font-medium text-muted mb-1">Deskripsi</p>
              <p class="text-sm whitespace-pre-wrap">{{ activity.deskripsi }}</p>
            </div>
          </div>

          <div v-if="activity.files?.length" class="mt-6">
            <p class="text-xs font-medium text-muted mb-2">Lampiran ({{ activity.files.length }})</p>
            <ul class="divide-y divide-default rounded-lg border border-default">
              <li v-for="f in activity.files" :key="f.id" class="flex items-center justify-between gap-3 px-3 py-2">
                <button
                  type="button"
                  class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left hover:underline"
                  @click="previewFile = f"
                >
                  <UIcon name="i-lucide-paperclip" class="w-4 h-4 shrink-0 text-muted" />
                  <span class="truncate text-sm">{{ f.nama_file }}</span>
                  <span class="shrink-0 text-xs text-muted">{{ formatSize(f.ukuran_bytes) }}</span>
                </button>
                <div class="flex shrink-0 gap-1">
                  <UButton
                    icon="i-lucide-eye"
                    variant="ghost"
                    size="xs"
                    @click="previewFile = f"
                  >
                    Preview
                  </UButton>
                  <UButton
                    icon="i-lucide-download"
                    variant="ghost"
                    size="xs"
                    :href="fileDownloadUrl(f)"
                    target="_blank"
                    rel="noopener"
                  >
                    Unduh
                  </UButton>
                </div>
              </li>
            </ul>
          </div>
        </UCard>

        <UCard class="mt-6 overflow-visible">
          <template #header>
            <h3 class="text-base font-semibold">Komentar ({{ comments.length }})</h3>
          </template>

          <div v-if="commentsPending" class="space-y-2">
            <USkeleton class="h-12 w-full" />
            <USkeleton class="h-12 w-full" />
          </div>
          <p v-else-if="!comments.length" class="text-sm text-muted">Belum ada komentar.</p>
          <ul v-else class="space-y-3">
            <li v-for="c in comments" :key="c.id" class="rounded-lg bg-elevated/50 px-3 py-2">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-medium">
                    {{ c.user_id === user?.id ? 'Anda' : (c.user_nama || `Pengguna #${c.user_id}`) }}
                  </span>
                  <UBadge v-if="c.user_role" size="xs" variant="subtle" :color="roleBadgeColor(c.user_role)">
                    {{ ucwords(c.user_role) }}
                  </UBadge>
                </div>
                <span class="text-xs text-muted">{{ formatDateTime(c.created_at) }}</span>
              </div>
              <p class="mt-1 text-sm whitespace-pre-wrap">{{ c.komentar }}</p>
            </li>
          </ul>

          <UForm :state="commentForm" class="mt-4 flex items-start gap-2" @submit="postComment">
            <UTextarea
              v-model="commentForm.komentar"
              placeholder="Tulis komentar..."
              :rows="2"
              class="flex-1"
              :disabled="commentSaving"
            />
            <UButton type="submit" icon="i-lucide-send" :loading="commentSaving" :disabled="commentSaving || !commentForm.komentar.trim()">
              Kirim
            </UButton>
          </UForm>
        </UCard>
      </template>
    </template>
  </UDashboardPanel>

  <ActivityAddModal ref="editModal" hide-trigger @success="reload" />
  <ActivityDeleteModal
    ref="deleteModal"
    :count="1"
    :name="activity?.deskripsi?.slice(0, 60) || 'aktivitas ini'"
    @confirm="handleDelete"
  />

  <UModal
    v-model:open="previewOpen"
    :title="previewFile?.nama_file || 'Preview Lampiran'"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <div class="flex items-center justify-center min-h-[200px]">
        <img
          v-if="previewKind === 'image'"
          :src="previewUrl"
          :alt="previewFile?.nama_file || 'Preview'"
          class="max-h-[60vh] w-full rounded object-contain"
        />
        <embed
          v-else-if="previewKind === 'pdf'"
          :src="previewUrl"
          type="application/pdf"
          class="h-[70vh] w-full rounded"
        />
        <div v-else class="py-8 text-center text-muted">
          <UIcon name="i-lucide-file-text" class="mx-auto mb-2 w-12 h-12" />
          <p>Preview tidak tersedia untuk file ini.</p>
          <p class="mt-1 text-xs">{{ previewFile?.nama_file }}</p>
        </div>
      </div>
    </template>

    <template #footer>
      <UButton variant="ghost" @click="previewFile = null">Tutup</UButton>
      <UButton
        icon="i-lucide-download"
        :href="fileDownloadUrl(previewFile)"
        target="_blank"
        rel="noopener"
      >
        Unduh
      </UButton>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import ActivityAddModal from '~/components/ActivityAddModal.vue'
import ActivityDeleteModal from '~/components/ActivityDeleteModal.vue'
import { formatDate, formatDateTime } from '~/utils/date'

const props = defineProps<{ backTo: string }>()

const route = useRoute()
const { user } = useAuth()
const toast = useToast()

const id = computed(() => Number(route.params.id))

const { data: activity, pending, error, refresh: reload } = await useAsyncData(
  `activity-${id.value}`,
  () => $fetch(`/api/activities/${id.value}`, { headers: useRequestHeaders(['cookie']) }),
  { default: () => null }
)

const errorMessage = computed(() => {
  const e: any = error.value
  return e?.data?.statusMessage || e?.statusMessage || e?.message || 'Gagal memuat aktivitas'
})

const canEdit = computed(() => {
  if (!activity.value || !user.value) return false
  if (user.value.role === 'admin') return true
  if (user.value.role === 'anggota') return activity.value.user_id === user.value.id
  if (user.value.role === 'koordinator') return activity.value.user_id === user.value.id
  return false
})
const canDelete = computed(() => canEdit.value)

const editModal = useTemplateRef('editModal')
const deleteModal = useTemplateRef('deleteModal')

const previewFile = ref<any>(null)
const previewOpen = computed({
  get: () => previewFile.value !== null,
  set: (v: boolean) => { if (!v) previewFile.value = null }
})

function isImageFile(f: any) {
  if (!f) return false
  const mime = String(f.tipe_mime || f.mime_type || '')
  if (mime.startsWith('image/')) return true
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(String(f.nama_file || ''))
}

function isPdfFile(f: any) {
  if (!f) return false
  const mime = String(f.tipe_mime || f.mime_type || '')
  if (mime === 'application/pdf') return true
  return /\.pdf$/i.test(String(f.nama_file || ''))
}

const previewKind = computed<'image' | 'pdf' | 'other'>(() => {
  if (!previewFile.value) return 'other'
  if (isImageFile(previewFile.value)) return 'image'
  if (isPdfFile(previewFile.value)) return 'pdf'
  return 'other'
})

const previewUrl = computed(() => {
  if (!previewFile.value) return ''
  return previewFile.value.url_file || `/api/activity-files/${previewFile.value.id}?inline=1`
})

function fileDownloadUrl(f: any) {
  if (!f) return ''
  return f.url_file || `/api/activity-files/${f.id}`
}

async function handleDelete() {
  deleteModal.value?.setLoading(true)
  try {
    await $fetch(`/api/activities/${id.value}`, { method: 'DELETE' })
    toast.add({ color: 'success', title: 'Aktivitas berhasil dihapus' })
    await navigateTo(props.backTo)
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.data?.statusMessage || e?.statusMessage || 'Gagal menghapus' })
  } finally {
    deleteModal.value?.setLoading(false)
  }
}

const comments = ref<any[]>([])
const commentsPending = ref(false)
const commentSaving = ref(false)
const commentForm = reactive({ komentar: '' })

async function loadComments() {
  commentsPending.value = true
  try {
    comments.value = await $fetch(`/api/comments/${id.value}`)
  } catch {
    comments.value = []
  } finally {
    commentsPending.value = false
  }
}

async function postComment() {
  const text = commentForm.komentar.trim()
  if (!text) return
  commentSaving.value = true
  try {
    const created: any = await $fetch('/api/comments', {
      method: 'POST',
      body: { activity_id: id.value, komentar: text }
    })
    comments.value.push(created)
    commentForm.komentar = ''
    toast.add({ color: 'success', title: 'Komentar terkirim' })
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.data?.statusMessage || e?.statusMessage || 'Gagal mengirim komentar' })
  } finally {
    commentSaving.value = false
  }
}

function roleBadgeColor(role?: string) {
  switch (role) {
    case 'admin':
      return 'error'
    case 'kepala':
      return 'info'
    case 'koordinator':
      return 'success'
    case 'anggota':
      return 'neutral'
    default:
      return 'neutral'
  }
}

function ucwords(value?: string) {
  if (!value) return ''
  return String(value)
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatJam(mulai?: string | null, selesai?: string | null) {
  if (!mulai && !selesai) return '-'
  return `${mulai || '-'}${selesai ? ' - ' + selesai : ''}`
}

function formatSize(bytes: any) {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n <= 0) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

onMounted(() => {
  loadComments()
})
</script>
