<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/40" @click="emit('close')" />

      <div class="relative bg-food-surface rounded-2xl shadow-2xl border border-food-border w-full max-w-sm flex flex-col overflow-hidden">

        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-food-border shrink-0">
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-food-brown text-base leading-tight">💬 評論</h3>
            <p class="text-xs text-food-muted mt-0.5 truncate">{{ spotName }}</p>
          </div>
          <button
            class="ml-3 w-7 h-7 rounded-full flex items-center justify-center text-food-muted hover:text-food-brown hover:bg-food-border/50 transition text-sm font-bold shrink-0"
            @click="emit('close')"
          >✕</button>
        </div>

        <!-- Scrollable body -->
        <div class="overflow-y-auto px-5 py-4 flex flex-col gap-3" style="max-height: 60vh">

          <!-- Loading -->
          <template v-if="loading">
            <div v-for="i in 3" :key="i" class="flex gap-3 animate-pulse">
              <div class="w-8 h-8 rounded-full bg-food-border shrink-0 mt-0.5" />
              <div class="flex-1 space-y-2 py-1">
                <div class="h-2.5 bg-food-border rounded w-1/3" />
                <div class="h-2 bg-food-border rounded w-full" />
                <div class="h-2 bg-food-border rounded w-3/4" />
              </div>
            </div>
          </template>

          <!-- Empty -->
          <div v-else-if="!comments.length" class="py-8 text-center">
            <div class="text-4xl mb-3 select-none">💬</div>
            <p class="text-sm font-bold text-food-brown mb-1">還沒有評論</p>
            <p class="text-xs text-food-muted">成為第一個留下評論的人吧！</p>
          </div>

          <!-- Comment list -->
          <template v-else>
            <div
              v-for="c in comments"
              :key="c.id"
              class="flex gap-3"
            >
              <!-- Avatar -->
              <div class="w-8 h-8 rounded-full bg-food-beige border border-food-border overflow-hidden shrink-0 mt-0.5 flex items-center justify-center">
                <img v-if="c.avatar_url" :src="c.avatar_url" :alt="c.username" class="w-full h-full object-cover" />
                <span v-else class="text-base select-none">👤</span>
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-baseline gap-1.5 flex-wrap">
                  <span class="text-xs font-bold text-food-brown truncate">{{ c.username }}</span>
                  <span class="text-[10px] text-food-muted">{{ relativeTime(c.created_at) }}</span>
                  <button
                    v-if="c.is_mine"
                    class="ml-auto text-[10px] text-food-red hover:underline transition shrink-0"
                    :disabled="deletingId === c.id"
                    @click="deleteComment(c.id)"
                  >{{ deletingId === c.id ? '刪除中…' : '刪除' }}</button>
                  <button
                    v-else
                    class="ml-auto text-[10px] text-food-muted hover:text-food-red hover:underline transition shrink-0"
                    @click="reportingCommentId = c.id"
                  >⚠️ 回報</button>
                </div>
                <p class="text-sm text-food-brown mt-1 leading-relaxed break-words">{{ c.content }}</p>
              </div>
            </div>
          </template>
        </div>

        <!-- Footer: error -->
        <div v-if="fetchError" class="px-5 pb-3 shrink-0">
          <p class="text-xs text-food-red text-center">{{ fetchError }}</p>
        </div>

      </div>
    </div>

    <!-- 回報評論 Modal（疊在最上層）-->
    <CommentReportModal
      v-if="reportingCommentId"
      :comment-id="reportingCommentId"
      :token="token"
      @close="reportingCommentId = null"
    />
  </Teleport>
</template>

<script lang="ts" setup>
import type { SpotComment } from '~/types'

const props = defineProps<{
  spotId:    string
  spotName:  string
  token:     string
}>()

const emit = defineEmits<{ close: [] }>()

const comments          = ref<SpotComment[]>([])
const loading           = ref(false)
const fetchError        = ref('')
const deletingId        = ref<string | null>(null)
const reportingCommentId = ref<string | null>(null)

onMounted(fetchComments)

async function fetchComments(): Promise<void> {
  loading.value = true
  fetchError.value = ''
  try {
    const { comments: data } = await $fetch<{ comments: SpotComment[] }>(
      `/api/spots/${props.spotId}/comments`,
      { headers: { Authorization: `Bearer ${props.token}` } }
    )
    comments.value = data
  } catch {
    fetchError.value = '載入評論失敗，請稍後再試'
  } finally {
    loading.value = false
  }
}

async function deleteComment(id: string): Promise<void> {
  if (deletingId.value) return
  deletingId.value = id
  try {
    const spotId = props.spotId
    const cid    = id
    await $fetch(`/api/spots/${spotId}/comments/${cid}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${props.token}` },
    })
    comments.value = comments.value.filter(c => c.id !== id)
  } catch {
    // silently fail — user sees no change
  } finally {
    deletingId.value = null
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60_000)
  if (min < 1)  return '剛剛'
  if (min < 60) return `${min} 分鐘前`
  const hr = Math.floor(min / 60)
  if (hr < 24)  return `${hr} 小時前`
  const d  = Math.floor(hr / 24)
  if (d < 7)    return `${d} 天前`
  const dt = new Date(iso)
  return `${dt.getMonth() + 1}月${dt.getDate()}日`
}
</script>
