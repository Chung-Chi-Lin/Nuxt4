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

      <!-- 頁面導航 -->
      <AdminNav />

      <!-- 統計卡 -->
      <div class="grid grid-cols-3 gap-3">
        <div v-for="card in statCards" :key="card.label"
          class="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm text-center">
          <p class="text-xl font-black text-gray-800">{{ stats ? card.value : '—' }}</p>
          <p class="text-[11px] text-gray-400 mt-0.5">{{ card.label }}</p>
        </div>
      </div>

      <!-- 篩選控制列 -->
      <div class="flex flex-wrap gap-2">
        <!-- 搜尋 -->
        <div class="flex items-center gap-1.5 flex-1 min-w-40 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
          <span class="text-gray-300 text-sm shrink-0">🔍</span>
          <input
            v-model="search"
            type="text"
            placeholder="搜尋 email 或暱稱…"
            class="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-300 focus:outline-none min-w-0"
            @input="onSearch"
          />
          <button v-if="search" @click="search = ''; fetchUsers()" class="text-gray-300 hover:text-gray-500 text-xs">✕</button>
        </div>

        <!-- 排序 -->
        <select
          v-model="sort"
          class="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:border-gray-400 cursor-pointer"
          @change="fetchUsers()"
        >
          <option value="week">本週用量 ↓</option>
          <option value="today">今日用量 ↓</option>
          <option value="email">Email A→Z</option>
          <option value="name">暱稱 A→Z</option>
        </select>

        <!-- 顯示全部 toggle -->
        <button
          @click="showAll = !showAll; fetchUsers()"
          class="px-3 py-2 rounded-xl text-sm border shadow-sm transition font-medium"
          :class="showAll
            ? 'bg-gray-800 text-white border-gray-800'
            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'"
        >{{ showAll ? '✓ 顯示全部' : '顯示全部用戶' }}</button>
      </div>

      <!-- Loading skeleton -->
      <template v-if="loading">
        <div v-for="i in 4" :key="i" class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm animate-pulse">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-gray-100 shrink-0" />
            <div class="flex-1 space-y-2">
              <div class="h-3 bg-gray-100 rounded w-1/2" />
              <div class="h-2.5 bg-gray-100 rounded w-1/3" />
            </div>
            <div class="w-14 h-7 bg-gray-100 rounded-lg shrink-0" />
          </div>
        </div>
      </template>

      <!-- 空狀態 -->
      <div v-else-if="!users.length" class="bg-white rounded-xl border border-gray-200 py-12 text-center shadow-sm">
        <div class="text-4xl mb-3">🤖</div>
        <p class="text-sm font-bold text-gray-700 mb-1">
          {{ search ? `找不到「${search}」的用戶` : '尚無問答紀錄' }}
        </p>
        <p class="text-xs text-gray-400">{{ showAll ? '' : '切換「顯示全部用戶」可看到所有帳號' }}</p>
      </div>

      <!-- 用戶列表 -->
      <div v-else class="space-y-2">
        <div v-for="u in users" :key="u.id"
          class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="px-4 py-3">
            <div class="flex items-center gap-3">

              <!-- 頭像 placeholder -->
              <div class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-base font-bold text-gray-400 border border-gray-200">
                {{ (u.username || u.email)[0]?.toUpperCase() ?? '?' }}
              </div>

              <!-- 用戶資訊 -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-bold text-sm text-gray-800 truncate">{{ u.username || '（無暱稱）' }}</span>
                  <TierBadge :tier="u.plan?.tier ?? 'free'" :expires="u.plan?.trial_expires_at ?? undefined" />
                </div>
                <p class="text-xs text-gray-400 truncate mt-0.5">{{ u.email }}</p>
              </div>

              <!-- 調整按鈕 -->
              <button
                @click="openEdit(u)"
                class="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800 transition"
              >✏️ 調整</button>
            </div>

            <!-- 用量 bar -->
            <div class="mt-3 flex items-center gap-3">
              <!-- 今日 -->
              <div class="flex-1">
                <div class="flex justify-between text-[10px] text-gray-400 mb-1">
                  <span>今日</span>
                  <span>
                    {{ u.plan?.tier === 'unlimited' ? `${u.today_count} 次（無上限）` : `${u.today_count} / ${u.plan?.daily_limit ?? 15} 次` }}
                  </span>
                </div>
                <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all"
                    :class="todayPercent(u) >= 100 ? 'bg-red-400' : todayPercent(u) >= 70 ? 'bg-amber-400' : 'bg-green-400'"
                    :style="{ width: `${Math.min(100, todayPercent(u))}%` }"
                  />
                </div>
              </div>
              <!-- 本週 -->
              <div class="shrink-0 text-right">
                <p class="text-[10px] text-gray-400">本週</p>
                <p class="text-sm font-bold text-gray-700">{{ u.week_count }} 次</p>
              </div>
              <!-- bonus -->
              <div v-if="(u.plan?.bonus_credits ?? 0) > 0" class="shrink-0 text-right">
                <p class="text-[10px] text-gray-400">贈送</p>
                <p class="text-sm font-bold text-indigo-500">+{{ u.plan?.bonus_credits }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- ── Edit Modal ──────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="editing" class="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0 bg-black/50 backdrop-blur-sm">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

            <!-- Modal header -->
            <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 class="font-bold text-gray-800">✏️ 調整配額</h3>
                <p class="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">{{ editing.email }}</p>
              </div>
              <button @click="editing = null" aria-label="關閉"
                class="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition text-sm font-bold">✕</button>
            </div>

            <div class="px-5 py-4 space-y-4">

              <!-- 方案等級 -->
              <div>
                <p class="text-xs font-bold text-gray-500 mb-2">方案等級</p>
                <div class="grid grid-cols-2 gap-2">
                  <button v-for="t in TIERS" :key="t.value"
                    @click="form.tier = t.value"
                    class="py-2 px-3 rounded-xl border text-sm font-bold transition text-left flex items-center gap-2"
                    :class="form.tier === t.value
                      ? 'border-gray-800 bg-gray-800 text-white'
                      : 'border-gray-200 text-gray-500 hover:border-gray-400'"
                  >
                    <span>{{ t.icon }}</span>
                    <div>
                      <p class="leading-tight">{{ t.label }}</p>
                      <p class="text-[10px] font-normal opacity-70 leading-tight">{{ t.desc }}</p>
                    </div>
                  </button>
                </div>
              </div>

              <!-- 每日上限（unlimited 時 disabled） -->
              <div>
                <label class="text-xs font-bold text-gray-500 block mb-1.5">每日問答上限</label>
                <div class="flex items-center gap-2">
                  <input
                    v-model.number="form.daily_limit"
                    type="number" min="1" max="9999"
                    :disabled="form.tier === 'unlimited'"
                    class="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-300"
                  />
                  <span class="text-sm text-gray-400">次 / 天</span>
                  <span v-if="form.tier === 'unlimited'" class="text-xs text-emerald-600 font-bold">（無上限）</span>
                </div>
              </div>

              <!-- 額外贈送次數 -->
              <div>
                <label class="text-xs font-bold text-gray-500 block mb-1.5">
                  額外贈送次數
                  <span class="ml-1 font-normal text-gray-400">（跨日不歸零，預留付費用）</span>
                </label>
                <div class="flex items-center gap-2">
                  <input
                    v-model.number="form.bonus_credits"
                    type="number" min="0" max="99999"
                    class="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400"
                  />
                  <span class="text-sm text-gray-400">次</span>
                </div>
              </div>

              <!-- 試用到期日（trial 方案才顯示） -->
              <div v-if="form.tier === 'trial'">
                <label class="text-xs font-bold text-gray-500 block mb-1.5">
                  試用到期日
                  <span class="ml-1 font-normal text-gray-400">（到期後自動回復免費方案限制）</span>
                </label>
                <input
                  v-model="form.trial_expires_at"
                  type="date"
                  class="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400 w-full"
                />
              </div>

              <!-- 備註 -->
              <div>
                <label class="text-xs font-bold text-gray-500 block mb-1.5">備註（付款單號等）</label>
                <input
                  v-model="form.credits_note"
                  type="text"
                  placeholder="選填…"
                  maxlength="200"
                  class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400"
                />
              </div>

            </div>

            <!-- Actions -->
            <div class="px-5 pb-5 flex gap-3">
              <button @click="editing = null"
                class="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-bold hover:bg-gray-50 transition">
                取消
              </button>
              <button @click="saveEdit" :disabled="saving"
                class="flex-1 py-2.5 rounded-xl bg-gray-800 text-white text-sm font-bold hover:bg-gray-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
                <svg v-if="saving" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4z"/>
                </svg>
                {{ saving ? '儲存中…' : '儲存變更' }}
              </button>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: 'admin' })
useHead({ title: 'AI 問答管理 — 波吉後台' })

// ── Types ────────────────────────────────────────────────────────
interface BotPlan {
  tier:              string
  daily_limit:       number
  bonus_credits:     number
  trial_expires_at?: string | null
  credits_note?:     string | null
  updated_at?:       string
}

interface BotUser {
  id:          string
  email:       string
  username:    string
  created_at:  string
  today_count: number
  week_count:  number
  plan:        BotPlan | null
}

interface Stats {
  totalToday:  number
  totalWeek:   number
  activeToday: number
  totalUsers:  number
}

// ── Constants ─────────────────────────────────────────────────────
const TIERS = [
  { value: 'free',      icon: '🆓', label: '免費',   desc: '預設 15 次/天' },
  { value: 'trial',     icon: '🧪', label: '試用',   desc: '限時自訂上限' },
  { value: 'pro',       icon: '⭐', label: 'Pro',    desc: '高頻自訂上限' },
  { value: 'unlimited', icon: '♾️', label: '無上限', desc: '管理員/特殊' },
]

// ── State ─────────────────────────────────────────────────────────
const token   = useCookie('auth_token')
const loading = ref(true)
const saving  = ref(false)
const users   = ref<BotUser[]>([])
const stats   = ref<Stats | null>(null)
const search  = ref('')
const sort    = ref('week')
const showAll = ref(false)

const editing = ref<BotUser | null>(null)
const form    = reactive({
  tier:             'free',
  daily_limit:      15,
  bonus_credits:    0,
  trial_expires_at: '',
  credits_note:     '',
})

// ── Computed ──────────────────────────────────────────────────────
const statCards = computed(() => [
  { label: '今日總問答',   value: stats.value?.totalToday  ?? 0 },
  { label: '今日活躍用戶', value: stats.value?.activeToday ?? 0 },
  { label: '本週總問答',   value: stats.value?.totalWeek   ?? 0 },
])

const headers = computed(() => ({ Authorization: `Bearer ${token.value ?? ''}` }))

// ── Utils ─────────────────────────────────────────────────────────
function todayPercent(u: BotUser): number {
  if (u.plan?.tier === 'unlimited') return 0
  const limit = u.plan?.daily_limit ?? 15
  return limit > 0 ? Math.round((u.today_count / limit) * 100) : 0
}

// ── Fetch ─────────────────────────────────────────────────────────
let searchTimer: ReturnType<typeof setTimeout> | null = null

function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(fetchUsers, 350)
}

async function fetchUsers() {
  loading.value = true
  try {
    const res = await $fetch<{ users: BotUser[]; stats: Stats }>('/api/admin/bot-users', {
      headers: headers.value,
      params: {
        search:  search.value || undefined,
        sort:    sort.value,
        showAll: showAll.value ? 'true' : undefined,
      },
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

// ── Edit ──────────────────────────────────────────────────────────
function openEdit(u: BotUser) {
  editing.value = u
  const p = u.plan
  form.tier             = p?.tier             ?? 'free'
  form.daily_limit      = p?.daily_limit      ?? 15
  form.bonus_credits    = p?.bonus_credits     ?? 0
  form.trial_expires_at = p?.trial_expires_at ?? ''
  form.credits_note     = p?.credits_note     ?? ''
}

async function saveEdit() {
  if (!editing.value || saving.value) return
  saving.value = true
  try {
    await $fetch(`/api/admin/bot-users/${editing.value.id}`, {
      method:  'PATCH',
      headers: headers.value,
      body: {
        tier:             form.tier,
        daily_limit:      form.daily_limit,
        bonus_credits:    form.bonus_credits,
        trial_expires_at: form.tier === 'trial' ? (form.trial_expires_at || null) : null,
        credits_note:     form.credits_note || null,
      },
    })
    // 更新本地狀態
    const idx = users.value.findIndex(u => u.id === editing.value!.id)
    if (idx !== -1) {
      users.value[idx]!.plan = {
        tier:             form.tier,
        daily_limit:      form.daily_limit,
        bonus_credits:    form.bonus_credits,
        trial_expires_at: form.tier === 'trial' ? (form.trial_expires_at || null) : null,
        credits_note:     form.credits_note || null,
      }
    }
    editing.value = null
  } catch {
    alert('儲存失敗，請稍後再試')
  } finally {
    saving.value = false
  }
}
</script>

<!-- TierBadge 子元件（內嵌避免多一個檔案）-->
<script lang="ts">
import { defineComponent, h, computed } from 'vue'

export const TierBadge = defineComponent({
  props: {
    tier:    { type: String, required: true },
    expires: { type: String, default: null },
  },
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
    return () => h('span', {
      class: `px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${config.value.cls}`,
    }, config.value.label)
  },
})
</script>

<style scoped>
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-from .bg-white,
.modal-fade-leave-to .bg-white {
  transform: translateY(16px) scale(0.97);
}
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-active .bg-white,
.modal-fade-leave-active .bg-white {
  transition: transform 0.2s ease;
}
</style>
