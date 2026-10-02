<script setup lang="ts">
import { formatDate, formatDateTime, parseDate } from '~/utils/date'

definePageMeta({ layout: 'default' })

const { user, fetchMe } = useAuth()
const toast = useToast()

const loading = ref(true)
const savingProfile = ref(false)
const savingPassword = ref(false)
const savingAvatar = ref(false)
const error = ref('')

const profile = ref<any>(null)
const koordinator = ref<any>(null)

// form profil
const formNama = ref('')
const formEmail = ref('')

// form password
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

// avatar
const fileInput = ref<HTMLInputElement | null>(null)
const pendingAvatar = ref<string | null>(null) // null = no change, '' = remove, 'data:...' = new
const avatarPreview = computed(() => {
  if (pendingAvatar.value !== null) {
    if (pendingAvatar.value === '') return ''
    return pendingAvatar.value
  }
  return profile.value?.avatar || profile.value?.google_avatar || ''
})
const displayAvatarSrc = computed(() => {
  const p = avatarPreview.value
  if (p) return p
  const name = profile.value?.nama || user.value?.nama || 'User'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
})

function roleLabel(role: string) {
  const map: Record<string, string> = { admin: 'Admin', koordinator: 'Koordinator', anggota: 'Anggota', kepala: 'Kepala' }
  return map[role] || role
}

async function loadProfile() {
  loading.value = true
  error.value = ''
  try {
    const res: any = await $fetch('/api/profile')
    profile.value = res.user
    koordinator.value = res.koordinator
    formNama.value = res.user.nama || ''
    formEmail.value = res.user.email || ''
    pendingAvatar.value = null
  } catch (e: any) {
    error.value = e?.statusMessage || e?.data?.statusMessage || 'Gagal memuat profil'
  } finally {
    loading.value = false
  }
}

function pickAvatar() {
  fileInput.value?.click()
}

function onAvatarFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast.add({ color: 'error', title: 'File harus berupa gambar' })
    input.value = ''
    return
  }
  if (file.size > 500 * 1024) {
    toast.add({ color: 'error', title: 'Ukuran avatar maksimal 500KB' })
    input.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    pendingAvatar.value = String(reader.result || '')
  }
  reader.readAsDataURL(file)
  input.value = ''
}

function removeAvatar() {
  pendingAvatar.value = ''
}

async function saveAvatar() {
  if (pendingAvatar.value === null) return
  savingAvatar.value = true
  try {
    const payload: any = { avatar: pendingAvatar.value === '' ? null : pendingAvatar.value }
    const res: any = await $fetch('/api/profile', { method: 'PUT', body: payload })
    profile.value = res.user
    koordinator.value = res.koordinator
    pendingAvatar.value = null
    await fetchMe()
    toast.add({ color: 'success', title: 'Avatar diperbarui' })
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || e?.data?.statusMessage || 'Gagal menyimpan avatar' })
  } finally {
    savingAvatar.value = false
  }
}

async function saveProfile() {
  const nama = formNama.value.trim()
  const email = formEmail.value.trim()
  if (!nama) {
    toast.add({ color: 'error', title: 'Nama wajib diisi' })
    return
  }
  if (!email) {
    toast.add({ color: 'error', title: 'Email wajib diisi' })
    return
  }
  savingProfile.value = true
  try {
    const res: any = await $fetch('/api/profile', { method: 'PUT', body: { nama, email } })
    profile.value = res.user
    koordinator.value = res.koordinator
    await fetchMe()
    toast.add({ color: 'success', title: 'Profil diperbarui' })
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || e?.data?.statusMessage || 'Gagal menyimpan profil' })
  } finally {
    savingProfile.value = false
  }
}

async function savePassword() {
  if (!newPassword.value || newPassword.value.length < 6) {
    toast.add({ color: 'error', title: 'Password baru minimal 6 karakter' })
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    toast.add({ color: 'error', title: 'Konfirmasi password tidak cocok' })
    return
  }
  if (!currentPassword.value) {
    toast.add({ color: 'error', title: 'Password saat ini wajib diisi' })
    return
  }
  savingPassword.value = true
  try {
    const res: any = await $fetch('/api/profile', {
      method: 'PUT',
      body: {
        current_password: currentPassword.value,
        password: newPassword.value,
        password_confirm: confirmPassword.value
      }
    })
    profile.value = res.user
    koordinator.value = res.koordinator
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    toast.add({ color: 'success', title: 'Password diperbarui' })
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || e?.data?.statusMessage || 'Gagal mengubah password' })
  } finally {
    savingPassword.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <UDashboardPanel id="profile">
    <template #header>
      <UDashboardNavbar title="Profil Saya">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="loading" class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-muted" />
      </div>

      <div v-else-if="error" class="p-6">
        <UAlert color="error" variant="soft" :title="error" />
        <UButton class="mt-4" color="primary" @click="loadProfile">Coba lagi</UButton>
      </div>

      <div v-else class="max-w-3xl mx-auto space-y-6 p-4">
        <!-- Header card -->
        <UCard>
          <div class="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div class="relative shrink-0">
              <UAvatar :src="displayAvatarSrc" :alt="profile.nama" size="3xl" />
              <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onAvatarFileChange" >
            </div>
            <div class="flex-1 min-w-0">
              <h1 class="text-xl font-bold text-highlighted truncate">{{ profile.nama }}</h1>
              <p class="text-sm text-muted truncate">{{ profile.email }}</p>
              <div class="flex flex-wrap gap-2 mt-2">
                <UBadge :color="profile.status === 'active' ? 'success' : 'neutral'" variant="soft">{{ roleLabel(profile.role) }}</UBadge>
                <UBadge v-if="profile.status !== 'active'" color="error" variant="soft">Nonaktif</UBadge>
                <span class="text-xs text-muted self-center">Bergabung {{ parseDate(profile.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}</span>
              </div>
              <div v-if="profile.last_login" class="text-xs text-muted mt-1">Login terakhir: {{ formatDateTime(profile.last_login) }}</div>
            </div>
            <div class="flex flex-col gap-2 w-full sm:w-auto">
              <UButton icon="i-lucide-image" variant="soft" block @click="pickAvatar">Ganti foto</UButton>
              <UButton v-if="profile.avatar || pendingAvatar" icon="i-lucide-trash-2" color="neutral" variant="ghost" block @click="removeAvatar">Hapus foto</UButton>
              <UButton
                v-if="pendingAvatar !== null"
                color="primary"
                :loading="savingAvatar"
                block
                @click="saveAvatar"
              >
                Simpan avatar
              </UButton>
              <p v-if="pendingAvatar !== null" class="text-xs text-muted text-center">Pratinjau belum disimpan</p>
            </div>
          </div>
        </UCard>

        <!-- Wilayah & Koordinator -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UCard>
            <template #header>
              <div class="flex items-center gap-2 font-semibold">
                <UIcon name="i-lucide-map-pinned" class="w-4 h-4" />
                Wilayah
              </div>
            </template>
            <div v-if="profile.region_nama" class="space-y-1">
              <p class="font-medium text-highlighted">{{ profile.region_nama }}</p>
              <p class="text-sm text-muted">Kode: {{ profile.region_kode || '-' }}</p>
            </div>
            <p v-else class="text-sm text-muted">Tidak terhubung ke wilayah</p>
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center gap-2 font-semibold">
                <UIcon name="i-lucide-user-star" class="w-4 h-4" />
                Koordinator Wilayah
              </div>
            </template>
            <div v-if="koordinator" class="space-y-1">
              <p class="font-medium text-highlighted">{{ koordinator.nama }}</p>
              <p class="text-sm text-muted">{{ koordinator.email }}</p>
            </div>
            <p v-else-if="profile.region_id" class="text-sm text-muted">Belum ada koordinator untuk wilayah ini</p>
            <p v-else class="text-sm text-muted">—</p>
          </UCard>
        </div>

        <!-- Edit profil -->
        <UCard>
          <template #header>
            <h2 class="font-semibold">Ubah profil</h2>
            <p class="text-sm text-muted">Perbarui nama dan email Anda</p>
          </template>
          <div class="space-y-4">
            <UFormField label="Nama" required>
              <UInput v-model="formNama" placeholder="Nama lengkap" class="w-full" />
            </UFormField>
            <UFormField label="Email" required>
              <UInput v-model="formEmail" type="email" placeholder="nama@example.com" class="w-full" />
            </UFormField>
            <div class="flex justify-end">
              <UButton color="primary" :loading="savingProfile" @click="saveProfile">Simpan perubahan</UButton>
            </div>
          </div>
        </UCard>

        <!-- Ganti password -->
        <UCard>
          <template #header>
            <h2 class="font-semibold">Ganti password</h2>
            <p class="text-sm text-muted">Kosongkan jika tidak ingin mengubah password</p>
          </template>
          <div class="space-y-4">
            <UFormField label="Password saat ini">
              <UInput v-model="currentPassword" type="password" placeholder="••••••••" class="w-full" />
            </UFormField>
            <UFormField label="Password baru">
              <UInput v-model="newPassword" type="password" placeholder="Minimal 6 karakter" class="w-full" />
            </UFormField>
            <UFormField label="Konfirmasi password baru">
              <UInput v-model="confirmPassword" type="password" placeholder="Ulangi password baru" class="w-full" />
            </UFormField>
            <div class="flex justify-end">
              <UButton color="primary" variant="outline" :loading="savingPassword" @click="savePassword">Ubah password</UButton>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
