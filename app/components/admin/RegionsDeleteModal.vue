<template>
  <UModal v-model:open="open" title="Hapus Wilayah">
    <slot />

    <template #body>
      <p class="text-sm text-muted">
        Apakah Anda yakin ingin menghapus
        <strong class="text-highlighted">{{ count }} wilayah terpilih</strong>?
        Tindakan ini tidak dapat dibatalkan.
      </p>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton variant="ghost" @click="open = false">Batal</UButton>
        <UButton color="error" @click="handleConfirm">Hapus</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
defineProps<{ count: number }>()

const emit = defineEmits(['confirm'])

const open = ref(false)

function handleConfirm() {
  emit('confirm')
  open.value = false
}
</script>
