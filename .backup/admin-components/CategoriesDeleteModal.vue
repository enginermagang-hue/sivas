<script setup lang="ts">
withDefaults(defineProps<{
  count?: number
}>(), {
  count: 0
})

const open = ref(false)

const emit = defineEmits(['confirm'])

async function handleConfirm() {
  emit('confirm')
  open.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="`Hapus ${count} kategori`"
    description="Apakah Anda yakin? Tindakan ini tidak dapat dibatalkan."
  >
    <slot />

    <template #body>
      <div class="flex justify-end gap-2">
        <UButton
          label="Batal"
          color="neutral"
          variant="subtle"
          @click="open = false"
        />
        <UButton
          label="Hapus"
          color="error"
          variant="solid"
          @click="handleConfirm"
        />
      </div>
    </template>
  </UModal>
</template>
