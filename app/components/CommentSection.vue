<template>
  <div class="space-y-4">
    <div v-if="comments.length === 0" class="text-center text-gray-500 dark:text-gray-400 py-8">
      Belum ada komentar
    </div>
    <div v-for="comment in comments" :key="comment.id" class="flex gap-3">
      <UAvatar :text="comment.user_nama" size="sm" />
      <div class="flex-1">
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-medium text-gray-900 dark:text-white">{{ comment.user_nama }}</span>
            <span class="text-xs text-gray-500">{{ formatDate(comment.created_at) }}</span>
          </div>
          <p class="text-sm text-gray-700 dark:text-gray-300">{{ comment.komentar }}</p>
        </div>
        <UButton
          v-if="comment.user_id === currentUserId"
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="xs"
          class="mt-1"
          :loading="deleting"
          @click="handleDelete(comment.id)"
        >
          Hapus
        </UButton>
      </div>
    </div>

    <div class="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
      <UAvatar :text="userName" size="sm" />
      <div class="flex-1">
        <UTextarea
          v-model="newComment"
          :rows="2"
          placeholder="Tulis komentar..."
          :disabled="submitting"
        />
        <UButton
          size="sm"
          class="mt-2"
          :loading="submitting"
          :disabled="!newComment.trim()"
          @click="handleSubmit"
        >
          Kirim
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDateTime } from '~/utils/date'

const props = defineProps<{
  activityId: number
}>()

const { user } = useAuth()
const toast = useToast()
const comments = ref<any[]>([])
const newComment = ref('')
const submitting = ref(false)
const deleting = ref(false)

const currentUserId = computed(() => user.value?.id)
const userName = computed(() => user.value?.nama || 'U')

async function loadComments() {
  try {
    const data = await $fetch(`/api/comments/${props.activityId}`)
    comments.value = data
  } catch {
    // ignore
  }
}

function formatDate(dateStr: string) {
  return formatDateTime(dateStr) || ''
}

async function handleSubmit() {
  if (!newComment.value.trim()) return

  submitting.value = true
  try {
    const comment = await $fetch(`/api/comments`, {
      method: 'POST',
      body: {
        activity_id: props.activityId,
        komentar: newComment.value.trim()
      }
    })
    comments.value.push(comment)
    newComment.value = ''
    toast.add({ color: 'success', title: 'Komentar berhasil ditambahkan' })
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || 'Gagal menambahkan komentar' })
  } finally {
    submitting.value = false
  }
}

async function handleDelete(commentId: number) {
  deleting.value = true
  try {
    await $fetch(`/api/comments/${commentId}`, { method: 'DELETE' })
    comments.value = comments.value.filter(c => c.id !== commentId)
    toast.add({ color: 'success', title: 'Komentar berhasil dihapus' })
  } catch (e: any) {
    toast.add({ color: 'error', title: e?.statusMessage || 'Gagal menghapus komentar' })
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadComments()
})
</script>
