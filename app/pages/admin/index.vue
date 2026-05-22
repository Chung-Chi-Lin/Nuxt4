<template>
  <div class="min-h-screen bg-gray-50">

    <!-- Header -->
    <header class="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
      <NuxtLink to="/profile" class="text-gray-400 hover:text-gray-700 transition text-sm font-medium">← 個人資料</NuxtLink>
      <span class="text-gray-200">|</span>
      <h1 class="font-bold text-gray-800 text-sm">⚙️ 後台管理系統</h1>
      <span class="ml-auto text-xs text-gray-400 hidden sm:block">管理員模式</span>
    </header>

    <div class="max-w-3xl mx-auto px-4 py-6 space-y-4">

      <!-- Tabs -->
      <div class="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
        <button
          v-for="tab in tabs" :key="tab.key"
          @click="switchTab(tab.key)"
          :class="activeTab === tab.key
            ? 'bg-gray-800 text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'"
          class="flex-1 py-2 px-3 rounded-lg text-sm font-bold transition text-center"
        >
          {{ tab.label }}
          <span v-if="tab.pendingCount > 0"
            class="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-black"
            :class="activeTab === tab.key ? 'bg-white text-gray-800' : 'bg-orange-100 text-orange-600'"
          >{{ tab.pendingCount }}</span>
        </button>
      </div>

      <!-- Status filter -->
      <div class="flex gap-1.5 flex-wrap">
        <button
          v-for="f in filters" :key="f.value"
          @click="statusFilter = f.value; fetchData()"
          :class="statusFilter === f.value
            ? 'bg-gray-800 text-white border-gray-800'
            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'"
          class="px-3 py-1.5 rounded-lg text-xs font-bold border transition"
        >{{ f.label }}</button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 3" :key="i" class="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
          <div class="flex gap-3">
            <div class="w-10 h-10 rounded-lg bg-gray-100 shrink-0" />
            <div class="flex-1 space-y-2">
              <div class="h-3 bg-gray-100 rounded w-1/3" />
              <div class="h-2.5 bg-gray-100 rounded w-2/3" />
              <div class="h-2 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="!reports.length" class="bg-white rounded-xl border border-gray-200 py-12 text-center">
        <div class="text-4xl mb-3">✅</div>
        <p class="text-sm font-bold text-gray-700 mb-1">目前沒有回報</p>
        <p class="text-xs text-gray-400">{{ statusFilter === 'pending' ? '沒有待審核項目' : '沒有符合篩選的項目' }}</p>
      </div>

      <!-- ── 標記回報列表 ── -->
      <template v-else-if="activeTab === 'spot-reports'">
        <div v-for="r in reports as SpotReport[]" :key="r.id"
          class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="px-4 pt-4 pb-3">
            <!-- Status badge + spot -->
            <div class="flex items-start gap-3">
              <span class="text-2xl shrink-0 mt-0.5">{{ r.spot.emoji }}</span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-bold text-sm text-gray-800 truncate">{{ r.spot.name }}</span>
                  <StatusBadge :status="r.status" />
                </div>
                <p class="text-xs text-gray-500 mt-0.5">
                  <span class="font-medium text-orange-600">{{ reasonLabel(r.reason, 'spot') }}</span>
                  　•　 回報者：{{ r.reporter.username }}
                  　•　 {{ relativeTime(r.created_at) }}
                </p>
                <p v-if="r.note" class="text-xs text-gray-500 mt-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 leading-relaxed">
                  💬 {{ r.note }}
                </p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div v-if="r.status === 'pending'" class="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex flex-wrap items-center gap-2">
            <!-- 查看位置 -->
            <a v-if="r.spot.lat && r.spot.lng"
              :href="`/map?lat=${r.spot.lat}&lng=${r.spot.lng}`"
              target="_blank"
              class="text-xs text-blue-500 hover:text-blue-700 font-bold mr-auto"
            >📍 查看位置</a>
            <span v-else class="mr-auto" />
            <button
              class="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition disabled:opacity-50"
              :disabled="processingId === r.id"
              @click="updateSpotReport(r.id, 'dismissed', false, r.spot.id)"
            >✕ 駁回</button>
            <button
              class="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
              :disabled="processingId === r.id"
              @click="updateSpotReport(r.id, 'resolved', true, r.spot.id)"
            >{{ processingId === r.id ? '處理中…' : '🗑 刪除標記並解決' }}</button>
            <button
              class="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
              :disabled="processingId === r.id"
              @click="updateSpotReport(r.id, 'resolved', false, r.spot.id)"
            >✓ 標記已解決</button>
          </div>
        </div>
      </template>

      <!-- ── 評論回報列表 ── -->
      <template v-else>
        <div v-for="r in reports as CommentReport[]" :key="r.id"
          class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="px-4 pt-4 pb-3">
            <div class="flex items-start gap-3">
              <span class="text-2xl shrink-0 mt-0.5">💬</span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-bold text-sm text-gray-800">
                    {{ r.comment?.spot.emoji }} {{ r.comment?.spot.name ?? '（標記已刪除）' }}
                  </span>
                  <StatusBadge :status="r.status" />
                </div>
                <p class="text-xs text-gray-500 mt-0.5">
                  <span class="font-medium text-orange-600">{{ reasonLabel(r.reason, 'comment') }}</span>
                  　•　 回報者：{{ r.reporter.username }}
                  　•　 {{ relativeTime(r.created_at) }}
                </p>

                <!-- Comment content -->
                <div v-if="r.comment" class="mt-2 bg-gray-50 rounded-lg px-2.5 py-2 border border-gray-100">
                  <p class="text-[10px] text-gray-400 mb-0.5">評論者：{{ r.comment.author.username }}</p>
                  <p class="text-xs text-gray-700 leading-relaxed break-words">{{ r.comment.content }}</p>
                </div>
                <p v-else class="text-xs text-gray-400 mt-1 italic">（評論已被刪除）</p>

                <p v-if="r.note" class="text-xs text-gray-500 mt-1.5 bg-yellow-50 rounded-lg px-2.5 py-1.5 leading-relaxed border border-yellow-100">
                  💬 補充：{{ r.note }}
                </p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div v-if="r.status === 'pending'" class="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex flex-wrap justify-end gap-2">
            <button
              class="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition disabled:opacity-50"
              :disabled="processingId === r.id"
              @click="updateCommentReport(r.id, 'dismissed', false, r.comment_id)"
            >✕ 駁回</button>
            <button
              v-if="r.comment"
              class="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
              :disabled="processingId === r.id"
              @click="updateCommentReport(r.id, 'resolved', true, r.comment_id)"
            >{{ processingId === r.id ? '處理中…' : '🗑 解決並刪除評論' }}</button>
            <button
              class="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
              :disabled="processingId === r.id"
              @click="updateCommentReport(r.id, 'resolved', false, r.comment_id)"
            >✓ 標記已解決</button>
          </div>
        </div>
      </template>

    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: 'admin' })
useHead({ title: '後台管理 — 波吉的美食地圖' })

// ── Types ─────────────────────────────────────────────────────
interface SpotReport {
  id: string
  reason: string
  note: string | null
  status: string
  created_at: string
  spot:     { id: string; name: string; emoji: string; lat?: number; lng?: number }
  reporter: { username: string }
}

interface CommentReport {
  id: string
  reason: string
  note: string | null
  status: string
  created_at: string
  comment_id: string
  reporter:  { username: string }
  comment: {
    id: string
    content: string
    author:  { username: string }
    spot:    { name: string; emoji: string }
  } | null
}

// ── State ─────────────────────────────────────────────────────
const token       = useCookie('auth_token')
const activeTab   = ref<'spot-reports' | 'comment-reports'>('spot-reports')
const statusFilter = ref('pending')
const loading     = ref(false)
const reports     = ref<SpotReport[] | CommentReport[]>([])
const processingId = ref<string | null>(null)

const spotPendingCount   = ref(0)
const commentPendingCount = ref(0)

const tabs = computed(() => [
  { key: 'spot-reports' as const,    label: '📍 標記回報',  pendingCount: spotPendingCount.value },
  { key: 'comment-reports' as const, label: '💬 評論回報',  pendingCount: commentPendingCount.value },
])

const filters = [
  { value: 'pending',   label: '待審核' },
  { value: 'resolved',  label: '已解決' },
  { value: 'dismissed', label: '已駁回' },
  { value: 'all',       label: '全部' },
]

// ── Data fetching ──────────────────────────────────────────────
const headers = computed(() => ({ Authorization: `Bearer ${token.value ?? ''}` }))

async function fetchData(): Promise<void> {
  loading.value = true
  try {
    const path = activeTab.value === 'spot-reports'
      ? '/api/admin/spot-reports'
      : '/api/admin/comment-reports'
    const { reports: data } = await $fetch<{ reports: any[] }>(path, {
      headers: headers.value,
      params:  { status: statusFilter.value },
    })
    reports.value = data
  } catch {
    reports.value = []
  } finally {
    loading.value = false
  }
}

async function fetchPendingCounts(): Promise<void> {
  const [sr, cr] = await Promise.allSettled([
    $fetch<{ reports: any[] }>('/api/admin/spot-reports',    { headers: headers.value, params: { status: 'pending' } }),
    $fetch<{ reports: any[] }>('/api/admin/comment-reports', { headers: headers.value, params: { status: 'pending' } }),
  ])
  if (sr.status === 'fulfilled') spotPendingCount.value    = sr.value.reports.length
  if (cr.status === 'fulfilled') commentPendingCount.value = cr.value.reports.length
}

function switchTab(tab: 'spot-reports' | 'comment-reports') {
  activeTab.value = tab
  fetchData()
}

onMounted(() => {
  fetchData()
  fetchPendingCounts()
})

// ── Actions ───────────────────────────────────────────────────
async function updateSpotReport(id: string, status: string, deleteSpot = false, spotId?: string): Promise<void> {
  processingId.value = id
  try {
    await $fetch(`/api/admin/spot-reports/${id}`, {
      method: 'PATCH', headers: headers.value,
      body: { status, deleteSpot, spotId },
    })
    reports.value = (reports.value as SpotReport[]).filter(r => r.id !== id)
    if (status === 'resolved' || status === 'dismissed') spotPendingCount.value = Math.max(0, spotPendingCount.value - 1)
  } catch {/* silent */} finally {
    processingId.value = null
  }
}

async function updateCommentReport(id: string, status: string, deleteComment: boolean, commentId: string): Promise<void> {
  processingId.value = id
  try {
    await $fetch(`/api/admin/comment-reports/${id}`, {
      method: 'PATCH', headers: headers.value,
      body: { status, deleteComment, commentId },
    })
    reports.value = (reports.value as CommentReport[]).filter(r => r.id !== id)
    if (status === 'resolved' || status === 'dismissed') commentPendingCount.value = Math.max(0, commentPendingCount.value - 1)
  } catch {/* silent */} finally {
    processingId.value = null
  }
}

// ── Helpers ───────────────────────────────────────────────────
const SPOT_REASONS: Record<string, string> = {
  closed:       '店家停業',
  wrong_info:   '資訊錯誤',
  spam:         '垃圾標記',
  duplicate:    '重複標記',
  inappropriate:'不當內容',
  other:        '其他',
}
const COMMENT_REASONS: Record<string, string> = {
  spam:          '垃圾訊息',
  inappropriate: '不雅言語',
  harassment:    '騷擾內容',
  misinformation:'錯誤資訊',
  other:         '其他',
}

function reasonLabel(reason: string, type: 'spot' | 'comment'): string {
  return type === 'spot'
    ? (SPOT_REASONS[reason] ?? reason)
    : (COMMENT_REASONS[reason] ?? reason)
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60_000)
  if (min < 1)  return '剛剛'
  if (min < 60) return `${min} 分鐘前`
  const hr = Math.floor(min / 60)
  if (hr < 24)  return `${hr} 小時前`
  const d = Math.floor(hr / 24)
  if (d < 7)    return `${d} 天前`
  const dt = new Date(iso)
  return `${dt.getMonth() + 1}月${dt.getDate()}日`
}
</script>
