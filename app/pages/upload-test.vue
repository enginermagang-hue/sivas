<template>
  <div class="p-6">
    <h1 class="text-xl font-bold mb-4">Upload File ke Google Drive (OAuth2)</h1>
    <input type="file" ref="fileInput" />
    <button @click="onUpload" class="ml-2 btn btn-primary">Upload</button>
  </div>
</template>

<script setup lang="ts">
const fileInput = ref<HTMLElement | null>(null)

const onUpload = async () => {
  const file = (fileInput.value as HTMLInputElement)?.files?.[0]
  if (!file) return alert('Pilih file dulu')

  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await $fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    console.log('Upload result:', res)
    alert(`Upload success!\nFile ID: ${(res as any).id}`)
  } catch (err: any) {
    console.error(err)
    alert(`Upload failed: ${err?.data?.message || err.message}`)
  }
}
</script>
