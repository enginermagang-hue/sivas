<template>
  <UModal v-model:open="open" :title="modalTitle" :ui="{ footer: 'justify-end' }">
    <slot />

    <template #body>
      <p class="text-sm text-muted">
        Apakah Anda yakin ingin menghapus
        <strong class="text-highlighted">{{ displayText }}</strong>?
        Tindakan ini tidak dapat dibatalkan.
      </p>
    </template>

    <template #footer>
      <UButton variant="ghost" :disabled="loading" @click="open = false">Batal</UButton>
      <UButton color="error" :loading="loading" :disabled="loading" @click="handleConfirm">Hapus</UButton>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{ count: number; name?: string }>()

const emit = defineEmits(['confirm'])

const open = ref(false)
const loading = ref(false)

const displayText = computed(() => {
  if (props.name) {
    return `"${props.name}"`
  }
  return `${props.count} aktivitas terpilih`
})

const modalTitle = computed(() => {
  if (props.name) {
    return `Hapus aktivitas`
  }
  return `Hapus ${props.count} aktivitas`
})

function openModal() {
  open.value = true
}

function closeModal() {
  open.value = false
}

function setLoading(val: boolean) {
  loading.value = val
}

function handleConfirm() {
  emit('confirm')
}

defineExpose({ open: openModal, close: closeModal, setLoading })
</script>
