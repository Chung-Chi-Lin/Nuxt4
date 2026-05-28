<template>
  <div class="flex flex-col h-full">

    <!-- Header + search -->
    <div class="px-4 pt-4 pb-3 shrink-0">
      <div class="flex items-center justify-between mb-2.5">
        <p class="text-xs font-bold text-food-muted tracking-wider uppercase">📍 精選地點</p>
        <div class="flex items-center gap-2">
          <!-- 波吉小幫手（手機限定，桌機有固定按鈕）-->
          <button
            class="md:hidden w-7 h-7 rounded-full bg-food-caramel flex items-center justify-center text-sm shadow-sm hover:bg-food-orange transition active:scale-95"
            aria-label="波吉小助手"
            @click="emit('toggle-bot')"
          >🐶</button>
          <span v-if="!loading && spots.length" class="text-[10px] text-food-muted tabular-nums">
            最近 {{ spots.length }} 個
          </span>
        </div>
      </div>
      <div class="flex items-center gap-2 bg-food-input border border-food-border rounded-xl px-3 py-2.5">
        <span class="text-food-muted shrink-0 text-sm">🔍</span>
        <input v-model="search" type="text" placeholder="搜尋名稱、標籤、備註…"
          class="flex-1 bg-transparent text-sm text-food-brown placeholder-food-border focus:outline-none min-w-0" />
        <button v-if="search" @click="search = ''" aria-label="清除搜尋"
          class="text-food-muted hover:text-food-brown text-xs transition shrink-0 leading-none">✕</button>
      </div>
      <!-- 類型篩選（僅影響側欄） -->
      <div class="flex flex-wrap gap-1.5 mt-2">
        <button v-for="cat in SPOT_CATEGORIES" :key="cat.key" type="button"
          :disabled="isChipDisabled(cat.key)"
          :title="isLastActive(cat.key) ? '至少需保留一個分類' : undefined"
          @click="toggleSidebarCategory(cat.key)"
          :aria-pressed="activeChipKeys.includes(cat.key)"
          class="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition disabled:cursor-not-allowed disabled:opacity-80"
          :class="activeChipKeys.includes(cat.key)
            ? 'bg-food-caramel text-white border-food-caramel'
            : 'bg-food-beige text-food-muted border-food-border hover:border-food-caramel/50 hover:text-food-brown'">
          <span>{{ cat.icon }}</span>
          <span>{{ cat.label }}</span>
        </button>
      </div>
    </div>

    <!-- List / states -->
    <div class="flex-1 overflow-y-auto px-4 pb-4 space-y-2 min-h-0">

      <!-- Loading skeleton -->
      <template v-if="loading">
        <div v-for="i in 5" :key="i" class="bg-food-beige rounded-xl p-3 animate-pulse">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-food-border shrink-0" />
            <div class="flex-1 space-y-2">
              <div class="h-3 bg-food-border rounded w-2/3" />
              <div class="h-2.5 bg-food-border rounded w-1/2" />
            </div>
            <div class="h-2.5 bg-food-border rounded w-10 shrink-0" />
          </div>
        </div>
      </template>

      <!-- Spots -->
      <template v-else-if="filteredSpots.length">
        <div v-for="(spot, idx) in filteredSpots" :key="spot.id"
          class="bg-food-beige rounded-xl p-3 border border-transparent hover:border-food-caramel transition group">
          <!-- Main click area -->
          <div class="flex items-start gap-2.5 cursor-pointer" @click="emit('select', spot)">
            <!-- Emoji + rank badge -->
            <div class="relative shrink-0 mt-0.5">
              <span class="text-2xl leading-none select-none">{{ spot.emoji }}</span>
              <span class="absolute -top-1.5 -left-2 w-[18px] h-[18px] bg-food-caramel text-white rounded-full text-[9px] font-black flex items-center justify-center leading-none shadow">
                {{ idx + 1 }}
              </span>
            </div>
            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-baseline gap-1.5">
                <p class="font-bold text-food-brown text-sm truncate flex-1 group-hover:text-food-caramel transition">{{ spot.name }}</p>
                <span class="text-[10px] text-food-muted shrink-0 font-mono tabular-nums">{{ formatDist(spot.distance) }}</span>
              </div>
              <p v-if="spot.notes" class="text-food-muted text-xs mt-0.5 line-clamp-1 leading-relaxed">{{ spot.notes }}</p>
              <p v-if="spot.address" class="text-food-muted text-[10px] mt-0.5 truncate leading-relaxed">
                📍 {{ spot.address }}
              </p>
              <div v-if="spot.tags?.length" class="flex flex-wrap gap-1 mt-1.5">
                <span v-for="t in spot.tags.slice(0, 3)" :key="t"
                  class="px-1.5 py-0.5 bg-food-surface rounded-full text-[10px] text-food-muted border border-food-border">
                  {{ t }}
                </span>
                <span v-if="spot.tags.length > 3" class="text-[10px] text-food-muted self-center">
                  +{{ spot.tags.length - 3 }}
                </span>
              </div>
            </div>
          </div>

          <!-- 評論 + 查看評論 -->
          <div class="mt-2 flex gap-1.5">
            <button
              v-if="currentUserId && spot.user_id !== currentUserId"
              class="flex-1 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-600 font-bold hover:bg-indigo-100 transition"
              @click.stop="emit('write-comment', { id: spot.id, name: spot.name })"
            >✏️ 評論</button>
            <button
              :class="currentUserId && spot.user_id !== currentUserId ? 'flex-1' : 'w-full'"
              class="py-1.5 rounded-lg bg-food-surface border border-food-border text-[11px] text-food-muted font-bold hover:border-green-300 hover:text-green-700 hover:bg-green-50 transition"
              @click.stop="emit('view-comments', { id: spot.id, name: spot.name })"
            >💬 查看評論</button>
          </div>
        </div>
      </template>

      <!-- No spots in viewport -->
      <div v-else-if="!loading && !spots.length" class="py-10 text-center px-3">
        <div class="text-5xl mb-4 select-none">🏆</div>
        <p class="font-bold text-food-brown text-sm mb-1.5">您搜尋的地點</p>
        <p class="font-bold text-food-brown text-sm mb-3">還沒有其他美食家的標記</p>
        <p class="text-xs text-food-muted leading-relaxed">
          來當頭香吧！<br>點擊右下角
          <span class="inline-flex items-center gap-0.5 font-bold text-food-caramel">
            <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 inline" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.6" fill="white" fill-opacity="0.85"/></svg>
            圖釘
          </span>
          新增第一個標記
        </p>
      </div>

      <!-- Search / filter no match -->
      <div v-else-if="!loading && spots.length && !filteredSpots.length" class="py-8 text-center px-3">
        <div class="text-3xl mb-3 select-none">🔍</div>
        <p class="text-sm text-food-muted">
          <template v-if="search">找不到「{{ search }}」相關地點</template>
          <template v-else>此分類目前沒有標記</template>
        </p>
      </div>

    </div>
  </div>
</template>

<script lang="ts" setup>
import type { SidebarSpot } from '~/types'

const props = defineProps<{
  spots: SidebarSpot[]
  loading: boolean
  currentUserId?: string
}>()

const emit = defineEmits<{
  select:             [spot: SidebarSpot]
  'view-comments':    [payload: { id: string; name: string }]
  'write-comment':    [payload: { id: string; name: string }]
  'toggle-bot':       []
  'category-changed': [categories: string[]]
}>()

const search                = ref('')
const sidebarCategoryFilters = ref<string[]>(['food'])

function toggleSidebarCategory(key: string) {
  if (sidebarCategoryFilters.value.length === 1 && sidebarCategoryFilters.value[0] === key) return
  const idx = sidebarCategoryFilters.value.indexOf(key)
  if (idx === -1) sidebarCategoryFilters.value.push(key)
  else sidebarCategoryFilters.value.splice(idx, 1)
  emit('category-changed', [...sidebarCategoryFilters.value])
}

// 搜尋結果（跨所有分類）
const searchResults = computed(() => {
  if (!search.value.trim()) return null
  const q = search.value.toLowerCase()
  return props.spots.filter(s =>
    s.name.toLowerCase().includes(q) ||
    (s.notes ?? '').toLowerCase().includes(q) ||
    (s.tags ?? []).some(t => t.toLowerCase().includes(q))
  )
})

// 搜尋時：chips 自動反映結果裡有哪些分類；無搜尋時：依使用者選擇
const activeChipKeys = computed(() =>
  searchResults.value !== null
    ? [...new Set(searchResults.value.map(s => s.category ?? 'food'))]
    : sidebarCategoryFilters.value
)

const filteredSpots = computed(() =>
  searchResults.value !== null
    ? searchResults.value
    : sidebarCategoryFilters.value.length
      ? props.spots.filter(s => sidebarCategoryFilters.value.includes(s.category ?? 'food'))
      : props.spots
)

// 是否為唯一 active chip（不可關閉）
function isLastActive(key: string): boolean {
  return !search.value.trim()
    && sidebarCategoryFilters.value.length === 1
    && sidebarCategoryFilters.value[0] === key
}

// chip 是否應 disabled（搜尋中 或 最後一個 active）
function isChipDisabled(key: string): boolean {
  return !!search.value.trim() || isLastActive(key)
}

function formatDist(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}
</script>
