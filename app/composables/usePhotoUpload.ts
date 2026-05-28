export function usePhotoUpload(existingCount: () => number = () => 0, maxPhotos = 3) {
  const photoInputEl = ref<HTMLInputElement | null>(null)
  const newFiles     = ref<File[]>([])
  const newPreviews  = ref<string[]>([])
  const photoError   = ref('')

  onUnmounted(() => newPreviews.value.forEach(url => URL.revokeObjectURL(url)))

  function triggerPhotoInput() { photoInputEl.value?.click() }

  function handlePhotoSelect(e: Event) {
    photoError.value = ''
    const input = e.target as HTMLInputElement
    const files = Array.from(input.files ?? [])
    for (const file of files) {
      if (existingCount() + newFiles.value.length >= maxPhotos) break
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        photoError.value = '只接受 JPG、PNG、WebP 格式'; continue
      }
      if (file.size > 2 * 1024 * 1024) {
        photoError.value = '每張照片不超過 2 MB'; continue
      }
      newFiles.value.push(file)
      newPreviews.value.push(URL.createObjectURL(file))
    }
    if (input) input.value = ''
  }

  function removeNewPhoto(i: number) {
    URL.revokeObjectURL(newPreviews.value[i])
    newFiles.value.splice(i, 1)
    newPreviews.value.splice(i, 1)
  }

  return { photoInputEl, newFiles, newPreviews, photoError, triggerPhotoInput, handlePhotoSelect, removeNewPhoto }
}
