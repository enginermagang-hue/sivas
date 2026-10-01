<template>
  <UCard>
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-2">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :style="{ backgroundColor: (activity.kategori_warna || '#ccc') + '20', color: activity.kategori_warna || '#666' }">
            {{ activity.kategori_nama }}
          </span>
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(activity.tanggal) }}</span>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">{{ activity.user_nama }}</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">{{ activity.region_nama }}</p>
        <p v-if="activity.nama_sekolah || activity.npsn" class="text-sm text-gray-600 dark:text-gray-300 mb-2">
          {{ activity.nama_sekolah || '-' }}
          <span v-if="activity.npsn" class="text-gray-500 dark:text-gray-400">• NPSN {{ activity.npsn }}</span>
        </p>
        <p class="text-gray-700 dark:text-gray-300 line-clamp-2">{{ activity.deskripsi }}</p>
        <div class="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
          <span v-if="activity.jam_mulai" class="flex items-center gap-1">
            <UIcon name="i-lucide-clock" class="w-4 h-4" />
            {{ activity.jam_mulai }}
          </span>
          <span v-if="activity.jam_selesai" class="flex items-center gap-1">
            <UIcon name="i-lucide-clock" class="w-4 h-4" />
            {{ activity.jam_selesai }}
          </span>
          <span class="flex items-center gap-1">
            <UIcon name="i-lucide-paperclip" class="w-4 h-4" />
            {{ activity.file_count || 0 }} lampiran
          </span>
        </div>
      </div>
      <UButton icon="i-lucide-arrow-right" variant="ghost" size="sm" :to="detailLink" />
    </div>
  </UCard>
</template>

<script lang="ts">
import { defineComponent, computed, type PropType } from 'vue'
import { useAuth } from '~/composables/useAuth'

export default defineComponent({
  props: {
    activity: {
      type: Object as PropType<any>,
      required: true
    }
  },
  setup(props) {
    const { user } = useAuth()
    const detailLink = computed(() => {
      const role = user.value?.role || 'anggota'
      return `/${role}/activities/${props.activity.id}`
    })

    function formatDate(dateStr: string) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    return { detailLink, formatDate }
  }
})
</script>
