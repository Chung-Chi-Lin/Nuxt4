<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/40" @click="emit('close')" />

      <div class="relative bg-food-surface rounded-2xl shadow-2xl border border-food-border w-full max-w-sm p-6 flex flex-col gap-4">

        <!-- Header -->
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-food-brown text-base">✏️ 評論</h3>
          <button
            class="w-7 h-7 rounded-full flex items-center justify-center text-food-muted hover:text-food-brown hover:bg-food-border/50 transition text-sm font-bold"
            aria-label="關閉"
            @click="emit('close')"
          >✕</button>
        </div>
        <p class="text-xs text-food-muted -mt-2 truncate">{{ spotName }}</p>

        <!-- Success -->
        <div v-if="done" class="flex flex-col items-center gap-2 py-4">
          <span class="text-4xl">✅</span>
          <p class="text-sm font-bold text-food-brown">評論已送出！</p>
          <button class="mt-1 w-full py-2.5 rounded-xl bg-food-caramel text-white text-sm font-bold" @click="emit('close')">
            關閉
          </button>
        </div>

        <template v-else>
          <!-- Textarea -->
          <div class="flex flex-col gap-1.5">
            <textarea
              v-model="content"
              rows="4"
              maxlength="300"
              placeholder="分享你對這個地點的看法…"
              class="w-full px-3 py-2.5 rounded-xl border border-food-border bg-food-cream text-sm text-food-brown placeholder-food-border focus:outline-none focus:border-food-caramel resize-none leading-relaxed"
            />
            <p class="text-right text-[10px] text-food-muted">{{ content.length }}/300</p>
          </div>

          <p v-if="errorMsg" class="text-xs text-food-red">{{ errorMsg }}</p>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              class="flex-1 py-2.5 rounded-xl border border-food-border text-food-muted text-sm font-bold hover:bg-food-beige transition"
              @click="emit('close')"
            >取消</button>
            <button
              class="flex-1 py-2.5 rounded-xl bg-food-caramel text-white text-sm font-bold hover:bg-food-orange transition disabled:opacity-50"
              :disabled="!content.trim() || loading"
              @click="submit"
            >{{ loading ? '送出中…' : '送出評論' }}</button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import type { SpotComment } from '~/types'

const props = defineProps<{ spotId: string; spotName: string; token: string }>()
const emit  = defineEmits<{ close: []; saved: [comment: SpotComment] }>()

const content  = ref('')
const loading  = ref(false)
const done     = ref(false)
const errorMsg = ref('')

async function submit(): Promise<void> {
  if (!content.value.trim() || loading.value) return
  loading.value = true
  errorMsg.value = ''
  try {
    const { comment } = await $fetch<{ comment: SpotComment }>(
      `/api/spots/${props.spotId}/comments`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${props.token}` },
        body: { content: content.value },
      }
    )
    done.value = true
    emit('saved', comment)
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    errorMsg.value = e.data?.statusMessage ?? '送出失敗，請稍後再試'
  } finally {
    loading.value = false
  }
}
</script>
