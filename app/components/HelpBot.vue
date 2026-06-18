<template>
  <Teleport to="body">
    <!-- Chat dialog -->
    <Transition name="chat-panel">
      <div
        v-if="open"
        class="fixed bottom-24 right-5 z-[9997] w-80 bg-food-surface rounded-2xl shadow-2xl border border-food-border flex flex-col overflow-hidden"
        style="max-height: min(540px, 78vh);"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-food-border bg-food-beige shrink-0">
          <div class="flex items-center gap-2">
            <span class="text-xl leading-none">🐶</span>
            <div>
              <p class="font-bold text-food-brown text-sm leading-tight">波吉小助手</p>
              <p class="text-food-muted text-[10px] leading-tight">
                {{ remaining === -1 ? '✨ 無上限方案' : remaining !== null ? `今日 AI 問答剩餘 ${remaining} 次` : '點選問題或直接發問' }}
              </p>
            </div>
          </div>
          <button
            class="w-7 h-7 rounded-full flex items-center justify-center text-food-muted hover:text-food-brown hover:bg-food-border/60 transition text-sm font-bold"
            aria-label="關閉小助手"
            @click="open = false"
          >✕</button>
        </div>

        <!-- Messages -->
        <div ref="scrollEl" class="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">

          <!-- 問候語 -->
          <div class="flex gap-2 items-end">
            <span class="text-2xl shrink-0 leading-none mb-0.5">🐶</span>
            <div class="bg-food-beige border border-food-border rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-food-brown leading-relaxed">
              汪！我是波吉王子，有什麼可以幫你的嗎？🐾
            </div>
          </div>

          <!-- 快捷問題（無對話記錄時顯示） -->
          <div v-if="!messages.length" class="flex flex-col gap-2 pl-10">
            <button
              v-for="q in questions"
              :key="q.id"
              class="text-left text-xs border border-food-border rounded-xl px-3 py-2.5 text-food-brown bg-food-cream hover:border-food-caramel hover:bg-food-beige transition"
              @click="selectQuestion(q)"
            >{{ q.question }}</button>
          </div>

          <!-- 對話紀錄 -->
          <template v-for="(msg, i) in messages" :key="i">
            <!-- 使用者氣泡 -->
            <div v-if="msg.role === 'user'" class="flex justify-end">
              <div class="bg-food-caramel text-white rounded-2xl rounded-br-sm px-3 py-2 text-sm max-w-[85%] leading-relaxed break-words">
                {{ msg.text }}
              </div>
            </div>

            <!-- 波吉氣泡 -->
            <div v-else class="flex gap-2 items-end">
              <span class="text-2xl shrink-0 leading-none mb-0.5">🐶</span>
              <div
                class="rounded-2xl rounded-bl-sm px-3 py-2 text-sm max-w-[85%] leading-relaxed break-words border"
                :class="msg.isError
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-food-beige border-food-border text-food-brown'"
              >
                <!-- Loading 動畫 -->
                <span v-if="msg.loading" class="inline-flex gap-1 items-center h-4">
                  <span class="w-1.5 h-1.5 bg-food-muted rounded-full animate-bounce" style="animation-delay:0ms" />
                  <span class="w-1.5 h-1.5 bg-food-muted rounded-full animate-bounce" style="animation-delay:150ms" />
                  <span class="w-1.5 h-1.5 bg-food-muted rounded-full animate-bounce" style="animation-delay:300ms" />
                </span>
                <div v-else class="bot-body" v-html="renderBotText(msg.text)" />
              </div>
            </div>
          </template>

          <!-- 清除對話 -->
          <button
            v-if="messages.length && !sending"
            class="text-xs text-food-caramel pl-10 text-left hover:underline"
            @click="clearMessages"
          >← 清除對話</button>

        </div>

        <!-- 輸入區 -->
        <div class="px-3 pb-3 pt-2 border-t border-food-border shrink-0">
          <div class="flex gap-2">
            <input
              v-model="inputText"
              type="text"
              placeholder="問波吉任何問題…"
              maxlength="200"
              :disabled="sending"
              class="flex-1 bg-food-input border border-food-border rounded-xl px-3 py-2 text-sm text-food-brown placeholder-food-border focus:outline-none focus:border-food-caramel disabled:opacity-60 min-w-0 transition"
              @keydown.enter.prevent="sendMessage"
            />
            <button
              :disabled="!canSend"
              aria-label="送出"
              class="w-10 h-10 bg-food-caramel text-white rounded-xl flex items-center justify-center shrink-0 hover:bg-food-orange disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95"
              @click="sendMessage"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>

      </div>
    </Transition>

    <!-- 波吉按鈕（桌機固定右下，手機藏起來改由側欄觸發） -->
    <button
      class="hidden md:flex fixed bottom-5 right-5 z-[9997] w-14 h-14 rounded-full bg-food-caramel shadow-lg items-center justify-center text-3xl transition-all duration-200 hover:scale-110 active:scale-95 select-none"
      :class="open ? 'rotate-12 shadow-xl' : ''"
      :aria-label="open ? '關閉小助手' : '開啟小助手'"
      @click="toggle"
    >🐶</button>
  </Teleport>
</template>

<script lang="ts" setup>
interface QA {
  id: number
  question: string
  answer: string
}

interface Message {
  role: 'user' | 'bot'
  text: string
  loading?: boolean
  isError?: boolean
}

interface SpotContext {
  name: string
  category?: string
  notes?: string
  tags?: string[]
  address?: string
}

const props = defineProps<{
  spots?:     SpotContext[]
  mapCenter?: { lat: number; lng: number }
}>()

const open      = ref(false)
const messages  = ref<Message[]>([])
const inputText = ref('')
const sending   = ref(false)
const remaining = ref<number | null>(null)
const scrollEl  = ref<HTMLElement | null>(null)

const token = useCookie('auth_token')
const { authFetch } = useAuthFetch(token)

const canSend = computed(() => inputText.value.trim().length > 0 && !sending.value)

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

// ── Markdown-lite 渲染（無 library，安全轉 HTML）────────────────
function renderBotText(raw: string): string {
  // 先 escape HTML，避免 XSS
  const esc = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // **粗體**
  const withBold = esc.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // 按空行分段落
  const paragraphs = withBold.split(/\n{2,}/)

  return paragraphs.map(para => {
    const lines = para.split('\n').filter(l => l.trim())
    if (!lines.length) return ''

    // 是否為編號清單（1. / 2. 開頭）
    const isList = lines.some(l => /^\d+[.)]\s/.test(l.trim()))

    if (isList) {
      const items = lines
        .filter(l => /^\d+[.)]\s/.test(l.trim()))
        .map(l => `<div class="bot-item">${l.replace(/^\d+[.)]\s*/, '')}</div>`)
        .join('')
      return `<div class="bot-list">${items}</div>`
    }

    // 一般段落：換行 → <br>
    return `<p>${lines.join('<br>')}</p>`
  }).join('')
}

function selectQuestion(q: QA): void {
  messages.value.push({ role: 'user', text: q.question })
  messages.value.push({ role: 'bot',  text: q.answer })
  scrollToBottom()
}

async function sendMessage(): Promise<void> {
  const text = inputText.value.trim()
  if (!text || sending.value) return

  inputText.value = ''
  sending.value   = true

  messages.value.push({ role: 'user', text })
  const loadingIdx = messages.value.length
  messages.value.push({ role: 'bot', text: '', loading: true })
  scrollToBottom()

  try {
    const res = await authFetch<{ answer: string; remaining: number }>('/api/bot/chat', {
      method: 'POST',
      body: {
        message: text,
        spots:   props.spots?.slice(0, 30) ?? [],
        lat:     props.mapCenter?.lat,
        lng:     props.mapCenter?.lng,
      },
    })
    messages.value[loadingIdx] = { role: 'bot', text: res.answer }
    remaining.value = res.remaining
  } catch (err: any) {
    const status = err?.response?.status ?? err?.data?.statusCode

    let errorText: string
    if (status === 429) {
      errorText = err?.data?.statusMessage ?? '今日問答次數已達上限，明天再來找波吉吧！🐾'
    } else if (status === 401) {
      errorText = '登入已過期，請重新登入後再試 🐾'
      useTokenExpiry().triggerExpiry()
    } else {
      errorText = err?.data?.statusMessage ?? '波吉現在腦袋打結了，請稍後再試 🐾'
    }

    messages.value[loadingIdx] = { role: 'bot', text: errorText, isError: true }
  } finally {
    sending.value = false
    scrollToBottom()
  }
}

function clearMessages(): void {
  messages.value  = []
  remaining.value = null
}

function scrollToBottom(): void {
  nextTick(() => {
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  })
}

function toggle(): void {
  open.value = !open.value
  if (!open.value) {
    messages.value  = []
    inputText.value = ''
    remaining.value = null
  }
}

defineExpose({ toggle })
</script>

<style scoped>
/* ── Bot message 內容排版 ────────────────────── */
.bot-body :deep(p) {
  margin: 0;
  line-height: 1.6;
}
.bot-body :deep(p + p) {
  margin-top: 0.4rem;
}
.bot-body :deep(.bot-list) {
  display: flex;
  flex-direction: column;
}
.bot-body :deep(.bot-item) {
  padding: 0.35rem 0;
  border-top: 1px dashed rgba(0, 0, 0, 0.08);
  line-height: 1.55;
}
.bot-body :deep(.bot-item:first-child) {
  border-top: none;
  padding-top: 0;
}
.bot-body :deep(.bot-item:last-child) {
  padding-bottom: 0;
}
.bot-body :deep(strong) {
  font-weight: 700;
}
.bot-body :deep(.bot-list + p),
.bot-body :deep(p + .bot-list) {
  margin-top: 0.5rem;
}

/* ── Chat 開關動畫 ────────────────────────────── */
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
