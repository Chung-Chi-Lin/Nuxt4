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

      <AdminNav :pending-spot="spotPendingCount" :pending-comment="commentPendingCount" />

      <!--
        el-tabs：v-model 綁定 activeTab，點擊 tab 自動更新並觸發 @tab-change
        @tab-change 在 v-model 更新後觸發，所以 fetchData() 能讀到新的 activeTab
      -->
      <el-tabs v-model="activeTab" @tab-change="fetchData">

        <!-- 📍 標記回報 -->
        <el-tab-pane name="spot-reports">
          <template #label>
            📍 標記回報
            <!--
              el-badge：:value 顯示數字，超過 max 會顯示 max+
              type="danger" → 紅色
            -->
            <el-badge v-if="spotPendingCount > 0" :value="spotPendingCount" type="danger" class="ml-2" />
          </template>

          <div v-if="activeTab === 'spot-reports'" class="space-y-4 pt-4">
            <!-- el-radio-group + el-radio-button：按鈕樣式的單選群組，@change 在值變更時觸發 -->
            <el-radio-group v-model="statusFilter" size="small" @change="fetchData">
              <el-radio-button value="pending">待審核</el-radio-button>
              <el-radio-button value="resolved">已解決</el-radio-button>
              <el-radio-button value="dismissed">已駁回</el-radio-button>
              <el-radio-button value="all">全部</el-radio-button>
            </el-radio-group>

            <!-- Loading：el-skeleton 顯示骨架屏，:rows 控制行數，animated 開啟動畫 -->
            <div v-if="loading" class="space-y-3">
              <el-skeleton v-for="i in 3" :key="i" :rows="3" animated />
            </div>

            <!-- Empty：el-empty 內建空狀態元件 -->
            <el-empty v-else-if="!reports.length" description="目前沒有回報" />

            <!-- 標記回報卡片列表 -->
            <template v-else>
              <div v-for="r in reports as SpotReport[]" :key="r.id"
                class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div class="px-4 pt-4 pb-3">
                  <div class="flex items-start gap-3">
                    <span class="text-2xl shrink-0 mt-0.5">{{ r.spot.emoji }}</span>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-bold text-sm text-gray-800 truncate">{{ r.spot.name }}</span>
                        <!--
                          el-tag：type 控制顏色語意
                            success → 綠（已解決）
                            info    → 灰（已駁回）
                            warning → 橘（待審核）
                        -->
                        <el-tag
                          :type="r.status === 'resolved' ? 'success' : r.status === 'dismissed' ? 'info' : 'warning'"
                          size="small"
                        >
                          {{ r.status === 'resolved' ? '已解決' : r.status === 'dismissed' ? '已駁回' : '待審核' }}
                        </el-tag>
                      </div>
                      <p class="text-xs text-gray-500 mt-0.5">
                        <span class="font-medium text-orange-600">{{ reasonLabel(r.reason, 'spot') }}</span>
                        　•　回報者：{{ r.reporter.username }}
                        　•　{{ relativeTime(r.created_at) }}
                      </p>
                      <p v-if="r.note" class="text-xs text-gray-500 mt-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 leading-relaxed">
                        💬 {{ r.note }}
                      </p>
                    </div>
                  </div>
                </div>

                <div v-if="r.status === 'pending'" class="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex flex-wrap items-center gap-2">
                  <a v-if="r.spot.lat && r.spot.lng"
                    :href="`/map?lat=${r.spot.lat}&lng=${r.spot.lng}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-xs text-blue-500 hover:text-blue-700 font-bold mr-auto"
                  >📍 查看位置</a>
                  <span v-else class="mr-auto" />

                  <el-button size="small" :disabled="processingId === r.id" @click="updateSpotReport(r.id, 'dismissed', false, r.spot.id)">
                    ✕ 駁回
                  </el-button>
                  <!--
                    el-button type="danger"：紅色危險按鈕，搭配 ElMessageBox.confirm 做二次確認
                  -->
                  <el-button
                    size="small"
                    type="danger"
                    :disabled="processingId === r.id"
                    :loading="processingId === r.id"
                    @click="updateSpotReport(r.id, 'resolved', true, r.spot.id)"
                  >🗑 刪除標記並解決</el-button>
                  <el-button
                    size="small"
                    type="success"
                    :disabled="processingId === r.id"
                    @click="updateSpotReport(r.id, 'resolved', false, r.spot.id)"
                  >✓ 標記已解決</el-button>
                </div>
              </div>
            </template>
          </div>
        </el-tab-pane>

        <!-- 💬 評論回報 -->
        <el-tab-pane name="comment-reports">
          <template #label>
            💬 評論回報
            <el-badge v-if="commentPendingCount > 0" :value="commentPendingCount" type="danger" class="ml-2" />
          </template>

          <div v-if="activeTab === 'comment-reports'" class="space-y-4 pt-4">
            <el-radio-group v-model="statusFilter" size="small" @change="fetchData">
              <el-radio-button value="pending">待審核</el-radio-button>
              <el-radio-button value="resolved">已解決</el-radio-button>
              <el-radio-button value="dismissed">已駁回</el-radio-button>
              <el-radio-button value="all">全部</el-radio-button>
            </el-radio-group>

            <div v-if="loading" class="space-y-3">
              <el-skeleton v-for="i in 3" :key="i" :rows="3" animated />
            </div>

            <el-empty v-else-if="!reports.length" description="目前沒有回報" />

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
                        <el-tag
                          :type="r.status === 'resolved' ? 'success' : r.status === 'dismissed' ? 'info' : 'warning'"
                          size="small"
                        >
                          {{ r.status === 'resolved' ? '已解決' : r.status === 'dismissed' ? '已駁回' : '待審核' }}
                        </el-tag>
                      </div>
                      <p class="text-xs text-gray-500 mt-0.5">
                        <span class="font-medium text-orange-600">{{ reasonLabel(r.reason, 'comment') }}</span>
                        　•　回報者：{{ r.reporter.username }}
                        　•　{{ relativeTime(r.created_at) }}
                      </p>
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

                <div v-if="r.status === 'pending'" class="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex flex-wrap justify-end gap-2">
                  <el-button size="small" :disabled="processingId === r.id" @click="updateCommentReport(r.id, 'dismissed', false, r.comment_id)">
                    ✕ 駁回
                  </el-button>
                  <el-button
                    v-if="r.comment"
                    size="small"
                    type="danger"
                    :disabled="processingId === r.id"
                    :loading="processingId === r.id"
                    @click="updateCommentReport(r.id, 'resolved', true, r.comment_id)"
                  >🗑 解決並刪除評論</el-button>
                  <el-button
                    size="small"
                    type="success"
                    :disabled="processingId === r.id"
                    @click="updateCommentReport(r.id, 'resolved', false, r.comment_id)"
                  >✓ 標記已解決</el-button>
                </div>
              </div>
            </template>
          </div>
        </el-tab-pane>

      </el-tabs>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: 'admin' })
useHead({ title: '後台管理 — 波吉的美食地圖' })

import type { SpotReport, CommentReport } from '~/types'

const token          = useCookie('auth_token')
const { authFetch }  = useAuthFetch(token)
const activeTab      = ref<string>('spot-reports')
const statusFilter   = ref('pending')
const loading        = ref(false)
const reports        = ref<SpotReport[] | CommentReport[]>([])
const processingId   = ref<string | null>(null)
const spotPendingCount    = ref(0)
const commentPendingCount = ref(0)


async function fetchData(): Promise<void> {
  loading.value = true
  try {
    const path = activeTab.value === 'spot-reports'
      ? '/api/admin/spot-reports'
      : '/api/admin/comment-reports'
    const { reports: data } = await authFetch<{ reports: any[] }>(path, {
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
    authFetch<{ reports: any[] }>('/api/admin/spot-reports',    { params: { status: 'pending' } }),
    authFetch<{ reports: any[] }>('/api/admin/comment-reports', { params: { status: 'pending' } }),
  ])
  if (sr.status === 'fulfilled') spotPendingCount.value    = sr.value.reports.length
  if (cr.status === 'fulfilled') commentPendingCount.value = cr.value.reports.length
}

onMounted(() => { fetchData(); fetchPendingCounts() })

async function updateSpotReport(id: string, status: string, deleteSpot = false, spotId?: string): Promise<void> {
  if (deleteSpot) {
    // ElMessageBox.confirm：程式觸發的確認對話框，比 alert/confirm 更符合 Element Plus 風格
    try {
      await ElMessageBox.confirm('確定要刪除此標記並解決回報嗎？此操作無法復原。', '確認刪除', {
        type: 'warning',
        confirmButtonText: '刪除',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger',
      })
    } catch {
      return
    }
  }
  processingId.value = id
  try {
    await authFetch(`/api/admin/spot-reports/${id}`, {
      method: 'PATCH',
      body: { status, deleteSpot, spotId },
    })
    reports.value = (reports.value as SpotReport[]).filter(r => r.id !== id)
    if (status === 'resolved' || status === 'dismissed') spotPendingCount.value = Math.max(0, spotPendingCount.value - 1)
  } catch {/* silent */} finally {
    processingId.value = null
  }
}

async function updateCommentReport(id: string, status: string, deleteComment: boolean, commentId: string): Promise<void> {
  if (deleteComment) {
    try {
      await ElMessageBox.confirm('確定要刪除此評論並解決回報嗎？此操作無法復原。', '確認刪除', {
        type: 'warning',
        confirmButtonText: '刪除',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger',
      })
    } catch {
      return
    }
  }
  processingId.value = id
  try {
    await authFetch(`/api/admin/comment-reports/${id}`, {
      method: 'PATCH',
      body: { status, deleteComment, commentId },
    })
    reports.value = (reports.value as CommentReport[]).filter(r => r.id !== id)
    if (status === 'resolved' || status === 'dismissed') commentPendingCount.value = Math.max(0, commentPendingCount.value - 1)
  } catch {/* silent */} finally {
    processingId.value = null
  }
}

const SPOT_REASONS: Record<string, string> = {
  closed: '店家停業', wrong_info: '資訊錯誤', spam: '垃圾標記',
  duplicate: '重複標記', inappropriate: '不當內容', other: '其他',
}
const COMMENT_REASONS: Record<string, string> = {
  spam: '垃圾訊息', inappropriate: '不雅言語', harassment: '騷擾內容',
  misinformation: '錯誤資訊', other: '其他',
}

function reasonLabel(reason: string, type: 'spot' | 'comment'): string {
  return type === 'spot' ? (SPOT_REASONS[reason] ?? reason) : (COMMENT_REASONS[reason] ?? reason)
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
