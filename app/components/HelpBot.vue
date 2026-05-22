<template>
  <Teleport to="body">
    <!-- Chat dialog -->
    <Transition name="chat-panel">
      <div
        v-if="open"
        class="fixed bottom-24 right-5 z-[9997] w-80 bg-food-surface rounded-2xl shadow-2xl border border-food-border flex flex-col overflow-hidden"
        style="max-height: min(480px, 70vh);"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-food-border bg-food-beige shrink-0">
          <div class="flex items-center gap-2">
            <span class="text-xl leading-none">🐶</span>
            <div>
              <p class="font-bold text-food-brown text-sm leading-tight">波吉小助手</p>
              <p class="text-food-muted text-[10px] leading-tight">點選問題快速取得解答</p>
            </div>
          </div>
          <button
            class="w-7 h-7 rounded-full flex items-center justify-center text-food-muted hover:text-food-brown hover:bg-food-border/60 transition text-sm font-bold"
            @click="open = false"
          >
            ✕
          </button>
        </div>

        <!-- Messages -->
        <div ref="scrollEl" class="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
          <!-- Greeting -->
          <div class="flex gap-2 items-end">
            <span class="text-2xl shrink-0 leading-none mb-0.5">🐶</span>
            <div class="bg-food-beige border border-food-border rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-food-brown leading-relaxed">
              汪！我是波吉，有什麼可以幫你的嗎？🐾
            </div>
          </div>

          <!-- Quick questions -->
          <div v-if="!selected" class="flex flex-col gap-2 pl-10">
            <button
              v-for="q in questions"
              :key="q.id"
              class="text-left text-xs border border-food-border rounded-xl px-3 py-2.5 text-food-brown bg-food-cream hover:border-food-caramel hover:bg-food-beige transition"
              @click="selectQuestion(q)"
            >
              {{ q.question }}
            </button>
          </div>

          <!-- Selected Q&A -->
          <template v-if="selected">
            <!-- User bubble -->
            <div class="flex justify-end">
              <div class="bg-food-caramel text-white rounded-2xl rounded-br-sm px-3 py-2 text-sm max-w-[85%] leading-relaxed">
                {{ selected.question }}
              </div>
            </div>
            <!-- Bot answer -->
            <div class="flex gap-2 items-end">
              <span class="text-2xl shrink-0 leading-none mb-0.5">🐶</span>
              <div class="bg-food-beige border border-food-border rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-food-brown max-w-[85%] leading-relaxed">
                {{ selected.answer }}
              </div>
            </div>
            <!-- Back -->
            <button
              class="text-xs text-food-caramel pl-10 text-left hover:underline"
              @click="selected = null"
            >
              ← 還有其他問題
            </button>
          </template>
        </div>
      </div>
    </Transition>

    <!-- Dog button -->
    <button
      class="fixed bottom-5 right-5 z-[9997] w-14 h-14 rounded-full bg-food-caramel shadow-lg flex items-center justify-center text-3xl transition-all duration-200 hover:scale-110 active:scale-95 select-none"
      :class="open ? 'rotate-12 shadow-xl' : ''"
      :aria-label="open ? '關閉小助手' : '開啟小助手'"
      @click="toggle"
    >
      🐶
    </button>
  </Teleport>
</template>

<script lang="ts" setup>
interface QA {
  id: number
  question: string
  answer: string
}

const open = ref(false)
const selected = ref<QA | null>(null)
const scrollEl = ref<HTMLElement | null>(null)

const questions: QA[] = [
  {
    id: 1,
    question: '如何新增美食地點？',
    answer: '在地圖上點擊任意位置，就會跳出新增表單。填寫名稱、評分、備註後按儲存，標記就會出現在地圖上囉！🍜',
  },
  {
    id: 2,
    question: '如何編輯或刪除地點？',
    answer: '點擊地圖上已有的標記，在彈出的卡片中選擇「編輯」即可修改資訊，或點「刪除」移除該地點。只能操作自己新增的地點喔。',
  },
  {
    id: 3,
    question: 'XP 和等級怎麼計算？',
    answer: '每次新增美食地點都會獲得 XP，累積到一定數量就會自動升級！等級越高，頭像旁的徽章越特別。✨',
  },
  {
    id: 4,
    question: '天氣資訊是什麼？',
    answer: '右上角顯示的是地圖中心點的即時天氣。移動地圖停止 2 秒後自動更新，移動時會顯示橘色跳動圓點表示取得中。',
  },
  {
    id: 5,
    question: '如何讓地圖跳到我的位置？',
    answer: '第一次進入地圖時，會詢問是否允許定位。點選「允許」再同意瀏覽器的定位請求，地圖就會自動飛到你所在的位置！📍',
  },
  {
    id: 6,
    question: '頭像怎麼上傳？',
    answer: '點擊右上角的頭像或使用者名稱，進入個人頁面後即可上傳大頭照。支援 JPG、PNG 等常見格式。',
  },
]

function selectQuestion(q: QA): void {
  selected.value = q
  nextTick(() => {
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  })
}

function toggle(): void {
  open.value = !open.value
  if (!open.value) selected.value = null
}
</script>

<style scoped>
.chat-panel-enter-from,
.chat-panel-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
  transform-origin: bottom right;
}

.chat-panel-enter-active,
.chat-panel-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
</style>
