<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[10000] flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/40" @click="emit('close')" />

      <div class="relative bg-food-surface rounded-2xl shadow-2xl border border-food-border w-full max-w-sm p-6 flex flex-col gap-4">

        <!-- Header -->
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-food-brown text-base">回報評論</h3>
          <button
            class="w-7 h-7 rounded-full flex items-center justify-center text-food-muted hover:text-food-brown hover:bg-food-border/50 transition text-sm font-bold"
            @click="emit('close')"
          >✕</button>
        </div>

        <!-- Reason -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-bold text-food-brown">回報原因 <span class="text-food-red">*</span></label>
          <select
            v-model="reason"
            class="w-full px-3 py-2.5 rounded-xl border border-food-border bg-food-cream text-sm text-food-brown focus:outline-none focus:border-food-caramel appearance-none cursor-pointer"
          >
            <option value="" disabled>請選擇原因…</option>
            <option value="spam">垃圾訊息或廣告</option>
            <option value="inappropriate">不雅或侮辱性言語</option>
            <option value="harassment">騷擾或攻擊性內容</option>
            <option value="misinformation">錯誤或誤導資訊</option>
            <option value="other">其他</option>
          </select>
        </div>

        <!-- Note -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-bold text-food-brown">補充說明 <span class="text-food-muted font-normal">（選填）</span></label>
          <textarea
            v-model="note"
            rows="3"
            maxlength="300"
            placeholder="請描述問題內容…"
            class="w-full px-3 py-2.5 rounded-xl border border-food-border bg-food-cream text-sm text-food-brown placeholder-food-border focus:outline-none focus:border-food-caramel resize-none leading-relaxed"
          />
          <p class="text-right text-[10px] text-food-muted">{{ note.length }}/300</p>
        </div>

        <p v-if="errorMsg" class="text-xs text-food-red">{{ errorMsg }}</p>

        <!-- Success -->
        <div v-if="done" class="flex flex-col items-center gap-2 py-2">
          <span class="text-3xl">✅</span>
          <p class="text-sm font-bold text-food-brown">回報已送出，謝謝！</p>
          <p class="text-xs text-food-muted">我們會盡快審核這則評論。</p>
        </div>

        <!-- Actions -->
        <div v-if="!done" class="flex gap-3">
          <button
            class="flex-1 py-2.5 rounded-xl border border-food-border text-food-muted text-sm font-bold hover:bg-food-beige transition"
            @click="emit('close')"
          >取消</button>
          <button
            class="flex-1 py-2.5 rounded-xl bg-food-caramel text-white text-sm font-bold hover:bg-food-orange transition disabled:opacity-50"
            :disabled="!reason || loading"
            @click="submit"
          >{{ loading ? '送出中…' : '送出回報' }}</button>
        </div>

        <button v-if="done" class="w-full py-2.5 rounded-xl bg-food-caramel text-white text-sm font-bold" @click="emit('close')">
          關閉
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
const props = defineProps<{ commentId: string; token: string }>()
const emit  = defineEmits<{ close: [] }>()

const reason   = ref('')
const note     = ref('')
const loading  = ref(false)
const done     = ref(false)
const errorMsg = ref('')

async function submit(): Promise<void> {
  if (!reason.value || loading.value) return
  loading.value = true
  errorMsg.value = ''
  try {
    await $fetch('/api/comment-reports', {
      method:  'POST',
      headers: { Authorization: `Bearer ${props.token}` },
      body:    { commentId: props.commentId, reason: reason.value, note: note.value },
    })
    done.value = true
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    errorMsg.value = e.data?.statusMessage ?? '送出失敗，請稍後再試'
  } finally {
    loading.value = false
  }
}
</script>
