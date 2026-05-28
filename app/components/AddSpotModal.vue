<template>
  <div class="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/50" @click="$emit('cancel')" />

    <div class="relative bg-food-surface rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl">

      <!-- Header -->
      <div class="sticky top-0 bg-food-surface px-5 py-4 border-b border-food-border flex items-center justify-between z-10">
        <h2 class="font-bold text-food-brown">📍 新增美食標記</h2>
        <button @click="$emit('cancel')" aria-label="關閉"
          class="w-7 h-7 flex items-center justify-center rounded-full text-food-muted hover:bg-food-beige hover:text-food-brown transition">✕</button>
      </div>

      <div class="p-5 space-y-5">

        <!-- 座標 -->
        <div class="bg-food-beige rounded-xl px-4 py-2.5 text-xs text-food-muted flex items-center gap-2">
          <span>📌</span>
          <span class="font-mono">{{ lat.toFixed(5) }}, {{ lng.toFixed(5) }}</span>
          <span v-if="sourceName" class="ml-1 text-food-caramel truncate">— {{ sourceName }}</span>
        </div>

        <!-- POI 驗證 -->
        <div v-if="poiInfo != null"
          :class="poiInfo.loading ? 'bg-food-beige text-food-muted'
            : poiInfo.found      ? 'bg-green-50 border border-green-200 text-green-700'
                                 : 'bg-yellow-50 border border-yellow-200 text-yellow-700'"
          class="rounded-xl px-3.5 py-2.5 text-xs flex items-start gap-2">
          <span class="shrink-0 mt-px">{{ poiInfo.loading ? '🔍' : poiInfo.found ? '✅' : '⚠️' }}</span>
          <span v-if="poiInfo.loading">驗證位置中…</span>
          <span v-else-if="poiInfo.found">
            已確認：<strong>{{ poiInfo.name }}</strong>
            <span class="opacity-60 ml-1">({{ poiInfo.type }})</span>
          </span>
          <span v-else>未找到已知店家，請確認是真實地點再標記</span>
        </div>

        <!-- Google Maps 搜尋確認 -->
        <a :href="`https://www.google.com/maps/search/${encodeURIComponent(name || '地點')}/@${lat},${lng},17z`"
          target="_blank" rel="noopener noreferrer"
          class="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-food-beige text-food-muted text-xs font-bold hover:bg-food-border hover:text-food-brown transition">
          🗺️ 在 Google Maps 搜尋確認
        </a>

        <!-- 類型（必選）-->
        <div>
          <label class="block text-xs font-bold text-food-muted mb-2 tracking-wider uppercase">
            類型 <span class="text-food-red">*</span>
          </label>
          <div class="flex gap-2">
            <button v-for="cat in SPOT_CATEGORIES" :key="cat.key" type="button"
              @click="category = cat.key"
              :aria-pressed="category === cat.key"
              class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-bold transition"
              :class="category === cat.key
                ? 'border-food-caramel bg-food-beige text-food-caramel'
                : 'border-food-border text-food-muted hover:border-food-caramel/50 hover:text-food-brown'">
              <span>{{ cat.icon }}</span>
              <span>{{ cat.label }}</span>
            </button>
          </div>
        </div>

        <!-- 圖示 -->
        <div>
          <label class="block text-xs font-bold text-food-muted mb-2 tracking-wider uppercase">圖示</label>

          <!-- Page navigation -->
          <div class="flex items-center justify-between mb-2">
            <p class="text-[10px] text-food-muted font-medium">{{ EMOJI_PAGES[emojiPage].label }}</p>
            <div class="flex items-center gap-1.5">
              <button type="button" aria-label="上一頁"
                class="w-6 h-6 rounded-full flex items-center justify-center text-food-muted hover:text-food-brown hover:bg-food-beige transition disabled:opacity-30 text-base font-bold"
                :disabled="emojiPage === 0"
                @click="emojiPage--"
              >‹</button>
              <div class="flex gap-1">
                <button type="button"
                  v-for="n in EMOJI_PAGES.length"
                  :key="n"
                  :aria-label="`第 ${n} 頁`"
                  :aria-pressed="emojiPage === n - 1"
                  class="w-1.5 h-1.5 rounded-full transition-colors"
                  :class="emojiPage === n - 1 ? 'bg-food-caramel' : 'bg-food-border hover:bg-food-muted'"
                  @click="emojiPage = n - 1"
                />
              </div>
              <button type="button" aria-label="下一頁"
                class="w-6 h-6 rounded-full flex items-center justify-center text-food-muted hover:text-food-brown hover:bg-food-beige transition disabled:opacity-30 text-base font-bold"
                :disabled="emojiPage === EMOJI_PAGES.length - 1"
                @click="emojiPage++"
              >›</button>
            </div>
          </div>

          <!-- Emoji grid -->
          <div class="flex flex-wrap gap-2 mb-2">
            <button v-for="e in EMOJI_PAGES[emojiPage].emojis" :key="e" type="button"
              :aria-label="`選擇圖示 ${e}`"
              :aria-pressed="emoji === e"
              @click="emoji = e"
              :class="emoji === e ? 'ring-2 ring-food-caramel bg-food-beige' : 'bg-food-input hover:bg-food-beige'"
              class="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition">
              {{ e }}
            </button>
          </div>

          <!-- Custom input -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-food-muted">自訂：</span>
            <input v-model="emoji" type="text" maxlength="2" placeholder="🍽️" aria-label="自訂圖示"
              class="w-14 h-9 rounded-xl text-center text-xl bg-food-input border border-food-border focus:border-food-caramel focus:outline-none" />
          </div>
        </div>

        <!-- 名稱 -->
        <div>
          <label class="block text-xs font-bold text-food-muted mb-1.5 tracking-wider uppercase">名稱 <span class="text-food-red">*</span></label>
          <input v-model="name" type="text" maxlength="50" placeholder="例：師大路胡椒餅"
            class="w-full px-4 py-3 rounded-xl bg-food-input border border-food-border text-food-brown placeholder-food-border focus:outline-none focus:border-food-caramel transition text-sm" />
          <p v-if="nameError" class="text-food-red text-xs mt-1">{{ nameError }}</p>
        </div>

        <!-- 標籤 -->
        <div>
          <label class="block text-xs font-bold text-food-muted mb-1.5 tracking-wider uppercase">標籤（最多 5 個）</label>
          <div v-if="tags.length" class="flex flex-wrap gap-1.5 mb-2">
            <span v-for="(tag, i) in tags" :key="i"
              class="inline-flex items-center gap-1 px-2.5 py-1 bg-food-beige text-food-muted rounded-full text-xs">
              {{ tag }}
              <button type="button" :aria-label="`移除標籤 ${tag}`" @click="removeTag(i)" class="hover:text-food-red transition leading-none">✕</button>
            </span>
          </div>
          <input v-if="tags.length < 5" v-model="tagInput" type="text" maxlength="15"
            placeholder="輸入標籤後按 Enter 或逗號"
            @keydown="handleTagKeydown"
            class="w-full px-4 py-2.5 rounded-xl bg-food-input border border-food-border text-food-brown placeholder-food-border focus:outline-none focus:border-food-caramel transition text-sm" />
        </div>

        <!-- 備註 -->
        <div>
          <label class="block text-xs font-bold text-food-muted mb-1.5 tracking-wider uppercase">備註</label>
          <textarea v-model="notes" rows="3" maxlength="200" placeholder="心得、推薦餐點、注意事項..."
            class="w-full px-4 py-3 rounded-xl bg-food-input border border-food-border text-food-brown placeholder-food-border focus:outline-none focus:border-food-caramel transition text-sm resize-none" />
        </div>

        <!-- 照片 -->
        <div>
          <label class="block text-xs font-bold text-food-muted mb-1.5 tracking-wider uppercase">
            照片
            <span class="font-normal normal-case text-food-border ml-1">最多 3 張，每張 ≤ 2 MB</span>
          </label>
          <div class="grid grid-cols-3 gap-2">
            <div v-for="(preview, i) in newPreviews" :key="i"
              class="relative aspect-square rounded-xl overflow-hidden bg-food-beige border border-food-border">
              <img :src="preview" class="w-full h-full object-cover" :alt="`照片預覽 ${i + 1}`" />
              <button type="button" :aria-label="`移除照片 ${i + 1}`" @click="removeNewPhoto(i)"
                class="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-black/80 transition leading-none">
                ✕
              </button>
            </div>
            <button v-if="newPreviews.length < 3" type="button" @click="triggerPhotoInput" aria-label="新增照片"
              class="aspect-square rounded-xl border-2 border-dashed border-food-border hover:border-food-caramel bg-food-beige hover:bg-food-beige/60 flex flex-col items-center justify-center gap-1 text-food-muted hover:text-food-caramel transition">
              <span class="text-xl leading-none select-none">📷</span>
              <span class="text-[10px] font-bold">新增</span>
            </button>
          </div>
          <input ref="photoInputEl" type="file" accept="image/jpeg,image/png,image/webp" multiple class="hidden" @change="handlePhotoSelect" />
          <p v-if="photoError" class="text-food-red text-xs mt-1">{{ photoError }}</p>
        </div>

        <!-- 公開切換 -->
        <div class="flex items-center justify-between py-1">
          <div>
            <p class="text-sm font-bold text-food-brown">公開標記</p>
            <p class="text-xs text-food-muted mt-0.5">開啟後所有使用者都能看到</p>
          </div>
          <button type="button" @click="isPublic = !isPublic" :aria-pressed="isPublic" aria-label="公開標記"
            :class="isPublic ? 'bg-food-caramel justify-end' : 'bg-food-border justify-start'"
            class="w-12 h-6 rounded-full px-0.5 flex items-center transition-colors">
            <span class="w-5 h-5 bg-white rounded-full shadow-sm transition-all" />
          </button>
        </div>

        <p v-if="saveError" class="text-food-red text-sm">{{ saveError }}</p>

      </div>

      <!-- 底部按鈕 -->
      <div class="sticky bottom-0 bg-food-surface px-5 pb-5 pt-3 border-t border-food-border flex gap-3">
        <button type="button" @click="$emit('cancel')"
          class="flex-1 py-3 rounded-xl bg-food-beige text-food-muted font-bold text-sm hover:text-food-brown transition active:scale-95">
          取消
        </button>
        <button type="button" @click="handleSave" :disabled="saving"
          class="flex-1 py-3 rounded-xl bg-food-caramel text-white font-bold text-sm hover:bg-food-orange disabled:opacity-50 transition active:scale-95 flex items-center justify-center gap-2">
          <svg v-if="saving" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <span>{{ saving ? (savingStatus || '儲存中…') : '儲存標記' }}</span>
        </button>
      </div>

    </div>
  </div>
</template>

<script lang="ts" setup>
const EMOJI_PAGES = [
  {
    label: '主食類',
    emojis: ['🍜', '🍝', '🍛', '🍲', '🥘', '🫕', '🍱', '🍣', '🥟', '🌮', '🌯', '🥙', '🍔', '🍖', '🍗', '🍤'],
  },
  {
    label: '海鮮小吃',
    emojis: ['🦐', '🦑', '🦞', '🦀', '🐟', '🍢', '🌭', '🥪', '🥗', '🧆', '🥚', '🍕', '🥩', '🫔', '🔥', '🍽️'],
  },
  {
    label: '甜點飲料',
    emojis: ['🧋', '☕', '🫖', '🍰', '🧁', '🍩', '🍦', '🍮', '🍫', '🍬', '🥐', '🍞', '🥖', '🧇', '🧃', '🍷'],
  },
  {
    label: '地標場所',
    emojis: ['🏪', '🏬', '🏨', '🎪', '🛒', '🌳', '🗼', '🏛️', '🌃', '🎠', '🌆', '🏙️', '🎭', '🗺️', '📍', '⭐'],
  },
] as const

const emojiPage = ref(0)

const props = defineProps<{
  lat: number
  lng: number
  sourceName?: string
  poiInfo?: { name: string; type: string; found: boolean; loading: boolean } | null
  address?: string
}>()

const emit = defineEmits<{
  saved: [result: any]
  cancel: []
}>()

const token = useCookie('auth_token')

const category  = ref<string>('food')
const emoji     = ref('📍')
const name      = ref(props.sourceName ?? '')
const nameError = ref('')
const saveError = ref('')
const saving    = ref(false)
const savingStatus = ref('')
const isPublic  = ref(true)
const notes     = ref('')

const { tags, tagInput, addTag, handleTagKeydown, removeTag } = useTagInput()
const { photoInputEl, newFiles, newPreviews, photoError, triggerPhotoInput, handlePhotoSelect, removeNewPhoto } = usePhotoUpload()

async function handleSave() {
  if (saving.value) return
  nameError.value = ''; saveError.value = ''
  if (!name.value.trim()) { nameError.value = '請填寫地點名稱'; return }

  saving.value = true
  savingStatus.value = '儲存標記中…'
  try {
    const result = await $fetch<any>('/api/spots', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value ?? ''}` },
      body: {
        name:      name.value.trim(),
        emoji:     emoji.value || '📍',
        lat:       props.lat,
        lng:       props.lng,
        tags:      tags.value,
        notes:     notes.value.trim(),
        is_public: isPublic.value,
        address:   props.address || null,
        category:  category.value,
      },
    })

    if (newFiles.value.length > 0) {
      savingStatus.value = `上傳照片中… (${newFiles.value.length} 張)`
      const form = new FormData()
      form.append('spotId', result.spot.id)
      newFiles.value.forEach(f => form.append('photos', f))
      try {
        const { photo_urls } = await $fetch<{ photo_urls: string[] }>('/api/spots/upload-photos', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token.value ?? ''}` },
          body: form,
        })
        result.spot.photo_urls = photo_urls
      } catch {
        // Photos failed silently
      }
    }

    emit('saved', result)
  } catch (err: any) {
    if (isTokenError(err)) { useTokenExpiry().triggerExpiry(); return }
    saveError.value = err.data?.statusMessage ?? '儲存失敗，請稍後再試'
  } finally {
    saving.value = false
    savingStatus.value = ''
  }
}
</script>
