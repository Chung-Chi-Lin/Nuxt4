export function useTagInput(initialTags: string[] = []) {
  const tags     = ref<string[]>([...initialTags])
  const tagInput = ref('')

  function addTag() {
    const t = tagInput.value.trim().replace(/,/g, '')
    if (t && !tags.value.includes(t) && tags.value.length < 5) tags.value.push(t)
    tagInput.value = ''
  }

  function handleTagKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
  }

  function removeTag(i: number) { tags.value.splice(i, 1) }

  return { tags, tagInput, addTag, handleTagKeydown, removeTag }
}
