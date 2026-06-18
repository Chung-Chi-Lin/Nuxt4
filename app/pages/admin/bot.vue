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

      <AdminNav />

      <!-- 統計卡：el-statistic 顯示大數字 + 標題 -->
      <div class="grid grid-cols-3 gap-3">
        <div v-for="card in statCards" :key="card.label"
          class="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm text-center">
          <el-statistic :value="card.value" :title="card.label" />
        </div>
      </div>

      <!-- 篩選控制列 -->
      <div class="flex flex-wrap gap-2">
        <!-- el-input clearable：有 × 清除按鈕，@clear 在清除時觸發 -->
        <el-input
          v-model="search"
          placeholder="🔍 搜尋 email 或暱稱…"
          clearable
          class="flex-1 min-w-40"
          @input="onSearch"
          @clear="() => { search = ''; fetchUsers() }"
        />

        <!-- el-select + el-option：下拉排序 -->
        <el-select v-model="sort" class="w-[150px]" @change="fetchUsers">
          <el-option label="本週用量 ↓" value="week" />
          <el-option label="今日用量 ↓" value="today" />
          <el-option label="Email A→Z" value="email" />
          <el-option label="暱稱 A→Z"  value="name" />
        </el-select>

        <!-- el-switch：開關切換，active-text / inactive-text 設定兩側說明文字 -->
        <el-switch
          v-model="showAll"
          active-text="顯示全部"
          inactive-text="僅活躍"
          @change="fetchUsers"
        />
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="space-y-3">
        <el-skeleton v-for="i in 4" :key="i" :rows="2" animated />
      </div>

      <!-- 空狀態 -->
      <el-empty
        v-else-if="!users.length"
        :description="search ? `找不到「${search}」的用戶` : '尚無問答紀錄'"
      />

      <!-- 用戶列表 -->
      <div v-else class="space-y-2">
        <div v-for="u in users" :key="u.id"
          class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="px-4 py-3">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-base font-bold text-gray-400 border border-gray-200">
                {{ (u.username || u.email)[0]?.toUpperCase() ?? '?' }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-bold text-sm text-gray-800 truncate">{{ u.username || '（無暱稱）' }}</span>
                  <TierBadge :tier="u.plan?.tier ?? 'free'" :expires="u.plan?.trial_expires_at ?? undefined" />
                </div>
                <p class="text-xs text-gray-400 truncate mt-0.5">{{ u.email }}</p>
              </div>
              <el-button size="small" @click="openEdit(u)">✏️ 調整</el-button>
            </div>

            <!-- 用量 bar：el-progress 內建進度條，:color 可傳函式或字串 -->
            <div class="mt-3 flex items-center gap-3">
              <div class="flex-1">
                <div class="flex justify-between text-[10px] text-gray-400 mb-1">
                  <span>今日</span>
                  <span>
                    {{ u.plan?.tier === 'unlimited'
                      ? `${u.today_count} 次（無上限）`
                      : `${u.today_count} / ${u.plan?.daily_limit ?? 15} 次` }}
                  </span>
                </div>
                <el-progress
                  :percentage="Math.min(100, todayPercent(u))"
                  :stroke-width="6"
                  :show-text="false"
                  :color="todayPercent(u) >= 100 ? '#f87171' : todayPercent(u) >= 70 ? '#fbbf24' : '#4ade80'"
                />
              </div>
              <div class="shrink-0 text-right">
                <p class="text-[10px] text-gray-400">本週</p>
                <p class="text-sm font-bold text-gray-700">{{ u.week_count }} 次</p>
              </div>
              <div v-if="(u.plan?.bonus_credits ?? 0) > 0" class="shrink-0 text-right">
                <p class="text-[10px] text-gray-400">贈送</p>
                <p class="text-sm font-bold text-indigo-500">+{{ u.plan?.bonus_credits }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- ── 編輯配額 Dialog ───────────────────────────────────────── -->
    <!--
      el-dialog：
        v-model         → 控制顯示/隱藏
        @closed         → 動畫結束後觸發，這裡用來清除 editing（避免動畫中閃爍資料）
        destroy-on-close → 關閉時銷毀 form 內容，避免舊資料殘留
    -->
    <el-dialog
      v-model="showEditDialog"
      width="420px"
      :destroy-on-close="true"
      @closed="editing = null"
    >
      <template #header>
        <span class="font-bold">✏️ 調整配額</span>
        <p v-if="editing" class="text-xs text-[--el-text-color-secondary] mt-0.5 truncate max-w-[280px]">
          {{ editing.email }}
        </p>
      </template>

      <el-form :model="form" label-position="top">

        <!-- 方案等級：el-radio-group + el-radio-button -->
        <el-form-item label="方案等級">
          <el-radio-group v-model="form.tier" class="grid grid-cols-2 gap-2 w-full">
            <el-radio-button
              v-for="t in TIERS"
              :key="t.value"
              :value="t.value"
              class="!rounded-xl w-full"
            >
              {{ t.icon }} {{ t.label }}
              <span class="text-[10px] opacity-70 ml-1">{{ t.desc }}</span>
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- 每日上限：el-input-number，:disabled 在 unlimited 時停用 -->
        <el-form-item label="每日問答上限">
          <div class="flex items-center gap-2">
            <el-input-number
              v-model="form.daily_limit"
              :min="1"
              :max="9999"
              :disabled="form.tier === 'unlimited'"
            />
            <span class="text-sm text-gray-400">次 / 天</span>
            <el-tag v-if="form.tier === 'unlimited'" type="success" size="small">無上限</el-tag>
          </div>
        </el-form-item>

        <!-- 額外贈送次數 -->
        <el-form-item label="額外贈送次數">
          <div class="flex items-center gap-2">
            <el-input-number v-model="form.bonus_credits" :min="0" :max="99999" />
            <span class="text-sm text-gray-400">次</span>
          </div>
          <template #label>
            額外贈送次數
            <span class="text-xs text-gray-400 font-normal ml-1">（跨日不歸零）</span>
          </template>
        </el-form-item>

        <!-- 試用到期日：el-date-picker，value-format 確保輸出格式為 YYYY-MM-DD 字串 -->
        <el-form-item v-if="form.tier === 'trial'" label="試用到期日">
          <el-date-picker
            v-model="form.trial_expires_at"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="選擇到期日"
            class="w-full"
          />
        </el-form-item>

        <!-- 備註 -->
        <el-form-item label="備註（付款單號等）">
          <el-input v-model="form.credits_note" placeholder="選填…" maxlength="200" />
        </el-form-item>

      </el-form>

      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveEdit">儲存變更</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: 'admin' })
useHead({ title: 'AI 問答管理 — 波吉後台' })

import type { BotPlan, BotUser, BotStats } from '~/types'

const TIERS = [
  { value: 'free',      icon: '🆓', label: '免費',   desc: '15 次/天' },
  { value: 'trial',     icon: '🧪', label: '試用',   desc: '限時' },
  { value: 'pro',       icon: '⭐', label: 'Pro',    desc: '高頻' },
  { value: 'unlimited', icon: '♾️', label: '無上限', desc: '管理員' },
]

const msg     = useMessage()
const token   = useCookie('auth_token')
const { authFetch } = useAuthFetch(token)
const loading = ref(true)
const saving  = ref(false)
const users   = ref<BotUser[]>([])
const stats   = ref<BotStats | null>(null)
const search  = ref('')
const sort    = ref('week')
const showAll = ref(false)

const showEditDialog = ref(false)
const editing = ref<BotUser | null>(null)
const form = reactive({
  tier: 'free', daily_limit: 15, bonus_credits: 0,
  trial_expires_at: '', credits_note: '',
})

const statCards = computed(() => [
  { label: '今日總問答',   value: stats.value?.totalToday  ?? 0 },
  { label: '今日活躍用戶', value: stats.value?.activeToday ?? 0 },
  { label: '本週總問答',   value: stats.value?.totalWeek   ?? 0 },
])


function todayPercent(u: BotUser): number {
  if (u.plan?.tier === 'unlimited') return 0
  const limit = u.plan?.daily_limit ?? 15
  return limit > 0 ? Math.round((u.today_count / limit) * 100) : 0
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(fetchUsers, 350)
}

async function fetchUsers() {
  loading.value = true
  try {
    const res = await $fetch<{ users: BotUser[]; stats: BotStats }>('/api/admin/bot-users', {
      params: { search: search.value || undefined, sort: sort.value, showAll: showAll.value ? 'true' : undefined },
    })
    users.value = res.users
    stats.value = res.stats
  } catch {
    users.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchUsers)

function openEdit(u: BotUser) {
  editing.value = u
  const p = u.plan
  form.tier             = p?.tier             ?? 'free'
  form.daily_limit      = p?.daily_limit      ?? 15
  form.bonus_credits    = p?.bonus_credits    ?? 0
  form.trial_expires_at = p?.trial_expires_at ?? ''
  form.credits_note     = p?.credits_note     ?? ''
  showEditDialog.value  = true
}

async function saveEdit() {
  if (!editing.value || saving.value) return
  saving.value = true
  try {
    await authFetch(`/api/admin/bot-users/${editing.value.id}`, {
      method: 'PATCH',
      body: {
        tier:             form.tier,
        daily_limit:      form.daily_limit,
        bonus_credits:    form.bonus_credits,
        trial_expires_at: form.tier === 'trial' ? (form.trial_expires_at || null) : null,
        credits_note:     form.credits_note || null,
      },
    })
    const idx = users.value.findIndex(u => u.id === editing.value!.id)
    if (idx !== -1) {
      users.value[idx]!.plan = {
        tier: form.tier, daily_limit: form.daily_limit, bonus_credits: form.bonus_credits,
        trial_expires_at: form.tier === 'trial' ? (form.trial_expires_at || null) : null,
        credits_note: form.credits_note || null,
      }
    }
    msg.success('儲存成功')
    showEditDialog.value = false
  } catch {
    msg.error('儲存失敗，請稍後再試')
  } finally {
    saving.value = false
  }
}
</script>

<!-- TierBadge 子元件 -->
<script lang="ts">
import { defineComponent, h, computed } from 'vue'
export const TierBadge = defineComponent({
  props: { tier: { type: String, required: true }, expires: { type: String, default: null } },
  setup(props) {
    const isExpired = computed(() =>
      props.tier === 'trial' && props.expires && new Date(props.expires) < new Date()
    )
    const config = computed(() => {
      if (props.tier === 'unlimited') return { label: '♾️ 無上限', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
      if (props.tier === 'pro')       return { label: '⭐ Pro',    cls: 'bg-amber-100  text-amber-700  border-amber-200'  }
      if (props.tier === 'trial')     return isExpired.value
        ? { label: '🧪 試用已到期', cls: 'bg-gray-100 text-gray-500 border-gray-200' }
        : { label: `🧪 試用中${props.expires ? ` (至 ${props.expires})` : ''}`, cls: 'bg-blue-100 text-blue-700 border-blue-200' }
      return { label: '免費', cls: 'bg-gray-100 text-gray-500 border-gray-200' }
    })
    return () => h('span', { class: `px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${config.value.cls}` }, config.value.label)
  },
})
</script>
