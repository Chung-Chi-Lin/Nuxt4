<template>
  <div class="flex flex-col h-full relative">

    <!-- Trip selector + actions -->
    <div class="px-4 pt-3 pb-2 shrink-0 space-y-2 border-b border-food-border">
      <div class="flex items-center gap-2">
        <select v-if="trips.length" v-model="selectedTripId" @change="onTripChange"
          class="flex-1 text-sm font-bold text-food-brown bg-food-input border border-food-border rounded-xl px-3 py-2 focus:outline-none focus:border-food-caramel min-w-0 truncate">
          <option v-for="t in trips" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
        <p v-else class="flex-1 text-xs text-food-muted">尚無旅程，建立第一個吧！</p>
        <button @click="showCreateTrip = true"
          class="shrink-0 px-3 py-2 bg-food-caramel text-white text-xs font-bold rounded-xl hover:bg-food-orange transition active:scale-95 whitespace-nowrap">
          + 新旅程
        </button>
      </div>

      <div v-if="activeTrip" class="flex gap-1.5">
        <button @click="showInviteMenu = !showInviteMenu"
          :class="showInviteMenu ? 'border-food-caramel text-food-caramel bg-food-beige' : 'border-food-border text-food-muted hover:border-food-caramel hover:text-food-caramel'"
          class="flex-1 py-1.5 text-[11px] font-bold rounded-lg border transition">
          🔗 分享
        </button>
        <button @click="showMembers = true"
          class="flex-1 py-1.5 text-[11px] font-bold rounded-lg border border-food-border text-food-muted hover:border-food-caramel hover:text-food-caramel transition">
          👥 成員
        </button>
        <button v-if="activeTrip.trip.my_role === 'owner'" aria-label="刪除旅程" @click="confirmDeleteTrip"
          class="px-3 py-1.5 text-[11px] font-bold rounded-lg border border-red-200 text-red-400 hover:bg-red-50 transition">
          🗑
        </button>
      </div>

      <!-- Invite role picker -->
      <div v-if="showInviteMenu && activeTrip" class="flex items-center gap-1.5 pb-1">
        <span class="text-[10px] text-food-muted shrink-0">邀請為：</span>
        <button @click="copyInviteLink('viewer')" :disabled="copyLoading"
          class="flex-1 py-1.5 text-[11px] font-bold rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 disabled:opacity-50 transition">
          👁 觀看者
        </button>
        <button @click="copyInviteLink('editor')" :disabled="copyLoading"
          class="flex-1 py-1.5 text-[11px] font-bold rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition">
          ✏️ 可編輯
        </button>
        <button aria-label="關閉分享選單" @click="showInviteMenu = false" class="text-food-muted hover:text-food-brown text-xs transition shrink-0">✕</button>
      </div>
    </div>

    <!-- Day tabs -->
    <div v-if="activeTrip" class="px-4 pt-2.5 pb-2 shrink-0">
      <div class="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
        <button v-for="(day, i) in activeTrip.days" :key="day.id"
          @click="activeDayIndex = i"
          :class="activeDayIndex === i
            ? 'bg-food-caramel text-white border-food-caramel'
            : 'bg-food-input text-food-muted border-food-border hover:border-food-caramel/60'"
          class="shrink-0 px-3 py-1 text-xs font-bold rounded-lg border transition whitespace-nowrap">
          {{ day.label ?? `Day ${i + 1}` }}
        </button>
        <button v-if="canEdit" aria-label="新增天" @click="addDay" :disabled="dayLoading"
          class="shrink-0 w-7 h-7 rounded-lg bg-food-input border border-food-border text-food-muted hover:text-food-caramel hover:border-food-caramel transition text-sm font-bold flex items-center justify-center disabled:opacity-40">
          +
        </button>
        <button v-if="canEdit && activeTrip.days.length > 1" aria-label="刪除此天" @click="deleteCurrentDay" :disabled="dayLoading"
          class="shrink-0 w-7 h-7 rounded-lg bg-food-input border border-red-200 text-red-400 hover:bg-red-50 transition text-xs font-bold flex items-center justify-center disabled:opacity-40">
          −
        </button>
      </div>
    </div>

    <!-- Waypoints + Route -->
    <div v-if="activeTrip" class="flex-1 overflow-y-auto px-4 pb-4 min-h-0">

      <!-- Transport mode + Calculate -->
      <div class="flex items-center gap-2 mb-2 sticky top-0 bg-food-surface pt-1 pb-1.5 z-10">
        <div class="flex gap-1">
          <button v-for="m in MODES" :key="m.key"
            @click="transportMode = m.key"
            :title="m.label" :aria-label="m.label"
            :class="transportMode === m.key
              ? 'bg-food-caramel text-white border-food-caramel'
              : 'bg-food-input text-food-muted border-food-border hover:border-food-caramel/60'"
            class="px-2 py-1 text-sm rounded-lg border transition">
            {{ m.icon }}
          </button>
        </div>
        <button @click="calculateRoute"
          :disabled="localWaypoints.length < 2 || routeLoading"
          class="ml-auto text-[11px] font-bold px-3 py-1.5 rounded-lg transition active:scale-95 whitespace-nowrap disabled:opacity-40
                 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
          {{ routeLoading ? '計算中…' : '🗺️ 規劃路線' }}
        </button>
      </div>

      <!-- 提示條：有景點但尚未規劃路線 -->
      <div v-if="localWaypoints.length >= 2 && !routeInfo && !routeLoading"
        class="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2 mb-2 text-amber-700">
        <span class="text-base shrink-0">💡</span>
        <p class="text-[11px] leading-snug flex-1">景點排好順序後，點右上角「🗺️ 規劃路線」即可查看路線與預估時間</p>
      </div>

      <!-- Route info bar -->
      <div v-if="routeInfo"
        class="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-3 mb-2">
        <span class="text-xs font-bold text-emerald-700">📏 {{ formatDist(routeInfo.distance) }}</span>
        <span class="text-xs font-bold text-emerald-700">⏱ {{ formatDur(routeInfo.duration) }}</span>
        <button aria-label="清除路線" @click="clearRoute" class="ml-auto text-food-muted hover:text-red-400 text-xs transition">✕</button>
      </div>

      <!-- Empty state -->
      <div v-if="!localWaypoints.length" class="py-8 text-center">
        <div class="text-4xl mb-3 select-none">🗺️</div>
        <p class="text-xs text-food-muted leading-relaxed">
          點擊地圖標記<br>選擇「加入路線」加入行程
        </p>
      </div>

      <!-- Draggable list -->
      <VueDraggable v-else v-model="localWaypoints" :animation="150" handle=".drag-handle" @end="onDragEnd"
        class="space-y-1.5">
        <div v-for="(wp, i) in localWaypoints" :key="wp.tempId ?? wp.id"
          class="bg-food-beige border border-food-border rounded-xl px-3 py-2.5 flex items-center gap-2.5">
          <div class="drag-handle cursor-grab active:cursor-grabbing text-food-border hover:text-food-muted shrink-0 select-none leading-none text-lg">
            ⠿
          </div>
          <span class="w-6 h-6 rounded-full bg-food-caramel text-white text-[11px] font-black flex items-center justify-center shrink-0 leading-none select-none">
            {{ i + 1 }}
          </span>
          <span class="text-lg leading-none select-none shrink-0">{{ wp.emoji }}</span>
          <span class="flex-1 text-xs font-bold text-food-brown truncate min-w-0">{{ wp.custom_name }}</span>
          <button v-if="canEdit" :aria-label="`移除 ${wp.custom_name}`" @click="removeWaypoint(i)"
            class="text-food-muted hover:text-red-400 transition text-xs shrink-0 leading-none">✕</button>
        </div>
      </VueDraggable>

      <!-- Save button -->
      <button v-if="isDirty && canEdit" @click="saveWaypoints" :disabled="saving"
        class="w-full mt-3 py-2.5 rounded-xl bg-food-caramel text-white text-xs font-bold hover:bg-food-orange disabled:opacity-50 transition active:scale-95">
        {{ saving ? '儲存中…' : '儲存行程 ✓' }}
      </button>
    </div>

    <!-- Loading state -->
    <div v-else-if="loading" class="flex-1 flex items-center justify-center">
      <p class="text-xs text-food-muted">載入中…</p>
    </div>

    <!-- No trip -->
    <div v-else class="flex-1 flex items-center justify-center px-4">
      <div class="text-center">
        <div class="text-5xl mb-3 select-none">✈️</div>
        <p class="text-sm font-bold text-food-brown mb-1">規劃你的旅程</p>
        <p class="text-xs text-food-muted mb-4">建立旅程，把美食地標加入行程</p>
        <button @click="showCreateTrip = true"
          class="px-4 py-2 bg-food-caramel text-white text-xs font-bold rounded-xl hover:bg-food-orange transition">
          + 建立第一個旅程
        </button>
      </div>
    </div>

    <!-- Create trip overlay -->
    <div v-if="showCreateTrip"
      class="absolute inset-0 bg-food-surface/95 z-20 flex items-center justify-center p-4">
      <div class="w-full max-w-xs bg-white rounded-2xl shadow-xl p-5 border border-food-border">
        <h3 class="font-bold text-food-brown text-sm mb-3">✈️ 新增旅程</h3>
        <input v-model="newTripName" type="text" placeholder="旅程名稱…"
          class="w-full px-3 py-2 rounded-xl border border-food-border text-sm text-food-brown focus:outline-none focus:border-food-caramel mb-3"
          @keyup.enter="createTrip" />
        <div class="flex gap-2">
          <button @click="showCreateTrip = false; newTripName = ''"
            class="flex-1 py-2 rounded-xl border border-food-border text-xs text-food-muted hover:bg-food-beige transition">取消</button>
          <button @click="createTrip" :disabled="!newTripName.trim() || creating"
            class="flex-1 py-2 rounded-xl bg-food-caramel text-white text-xs font-bold disabled:opacity-40 hover:bg-food-orange transition">
            {{ creating ? '建立中…' : '建立' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Members modal -->
    <Teleport to="body">
      <TripMembersModal v-if="showMembers && activeTrip"
        :trip-id="activeTrip.trip.id"
        :my-role="activeTrip.trip.my_role"
        :token="token"
        @close="showMembers = false"
      />
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import { VueDraggable } from 'vue-draggable-plus'
import type { Trip, TripDay, TripWaypoint, TripDetail, PendingSpot } from '~/types'

const props = defineProps<{
  token: string
  pendingSpot: PendingSpot | null
}>()

const emit = defineEmits<{
  'waypoints-updated': [waypoints: TripWaypoint[]]
  'route-ready':       [geometry: any]
  'route-cleared':     []
}>()

// ── State ──────────────────────────────────────────────────────
const msg            = useMessage()
const { authFetch }  = useAuthFetch(computed(() => props.token))
const trips          = ref<Trip[]>([])
const selectedTripId = ref<string | null>(null)
const activeTrip     = ref<TripDetail | null>(null)
const activeDayIndex = ref(0)
const loading        = ref(false)
const dayLoading     = ref(false)
const creating       = ref(false)
const saving         = ref(false)
const copyLoading    = ref(false)
const showCreateTrip = ref(false)
const showMembers    = ref(false)
const showInviteMenu = ref(false)
const newTripName    = ref('')
const isDirty        = ref(false)
const transportMode  = ref<'car' | 'walk' | 'bike' | 'bus'>('car')
const queuedSpot     = ref<PendingSpot | null>(null)
const routeInfo      = ref<{ distance: number; duration: number } | null>(null)
const routeLoading   = ref(false)

const MODES = [
  { key: 'car'  as const, icon: '🚗', label: '開車' },
  { key: 'walk' as const, icon: '🚶', label: '步行' },
  { key: 'bike' as const, icon: '🚴', label: '騎車' },
  { key: 'bus'  as const, icon: '🚌', label: '搭車' },
]

interface LocalWaypoint extends Omit<TripWaypoint, 'id'> {
  id?: string
  tempId?: string
}

const localWaypoints = ref<LocalWaypoint[]>([])

const activeDay = computed(() => activeTrip.value?.days[activeDayIndex.value] ?? null)

const canEdit = computed(() =>
  activeTrip.value?.trip.my_role === 'owner' || activeTrip.value?.trip.my_role === 'editor'
)


function handleErr(err: any, fallback: string) {
  if (isAuthExpiredError(err)) return
  msg.error(err?.data?.statusMessage ?? fallback)
}

// ── Load trips ────────────────────────────────────────────────
async function fetchTrips() {
  if (!props.token) return
  loading.value = true
  try {
    const { trips: data } = await authFetch<{ trips: Trip[] }>('/api/trips')
    trips.value = data
    if (data.length && !selectedTripId.value) {
      await loadTrip(data[0]!.id)
    }
  } catch (err: any) {
    if (isAuthExpiredError(err)) return
  } finally {
    loading.value = false
  }
}

async function loadTrip(id: string) {
  selectedTripId.value = id
  try {
    const data = await authFetch<TripDetail>(`/api/trips/${id}`)
    activeTrip.value = data
    activeDayIndex.value = 0
    syncLocalWaypoints()
  } catch (err: any) {
    handleErr(err, '載入旅程失敗')
  }
}

function syncLocalWaypoints() {
  if (!activeDay.value || !activeTrip.value) { localWaypoints.value = []; emitWaypoints(); return }
  localWaypoints.value = activeTrip.value.waypoints
    .filter(w => w.day_id === activeDay.value!.id)
    .sort((a, b) => a.order_index - b.order_index)
    .map(w => ({ ...w }))
  isDirty.value = false
  clearRoute()
  emitWaypoints()
}

watch(activeDayIndex, syncLocalWaypoints)

async function onTripChange() {
  if (selectedTripId.value) await loadTrip(selectedTripId.value)
}

// ── Create / Delete trip ──────────────────────────────────────
async function createTrip() {
  if (!newTripName.value.trim() || creating.value) return
  creating.value = true
  try {
    const data = await authFetch<{ trip: Trip; days: TripDay[] }>('/api/trips', {
      method: 'POST',
      body: { name: newTripName.value.trim() },
    })
    trips.value.unshift({ ...data.trip })
    activeTrip.value = { trip: data.trip, days: data.days, waypoints: [] }
    selectedTripId.value = data.trip.id
    activeDayIndex.value = 0
    syncLocalWaypoints()
    showCreateTrip.value = false
    newTripName.value = ''

    // Add any spot that was queued before the trip existed
    if (queuedSpot.value) {
      await nextTick()
      addWaypoint(queuedSpot.value)
      queuedSpot.value = null
    }
  } catch (err: any) {
    handleErr(err, '建立失敗')
  } finally {
    creating.value = false
  }
}

async function confirmDeleteTrip() {
  if (!activeTrip.value || !confirm(`確定刪除「${activeTrip.value.trip.name}」？此操作無法復原。`)) return
  const id = activeTrip.value.trip.id
  try {
    await authFetch(`/api/trips/${id}`, { method: 'DELETE' })
    trips.value = trips.value.filter(t => t.id !== id)
    activeTrip.value = null
    selectedTripId.value = null
    localWaypoints.value = []
    clearRoute()
    if (trips.value.length) await loadTrip(trips.value[0]!.id)
  } catch (err: any) {
    handleErr(err, '刪除旅程失敗')
  }
}

// ── Day management ────────────────────────────────────────────
async function addDay() {
  if (!activeTrip.value || dayLoading.value) return
  dayLoading.value = true
  try {
    const { day } = await authFetch<{ day: TripDay }>(`/api/trips/${activeTrip.value.trip.id}/days`, {
      method: 'POST',
    })
    activeTrip.value.days.push(day)
    activeDayIndex.value = activeTrip.value.days.length - 1
  } catch (err: any) {
    handleErr(err, '新增天數失敗')
  } finally {
    dayLoading.value = false
  }
}

async function deleteCurrentDay() {
  if (!activeTrip.value || !activeDay.value || dayLoading.value) return
  if (!confirm(`確定刪除「${activeDay.value.label}」？`)) return
  dayLoading.value = true
  try {
    await authFetch(`/api/trips/${activeTrip.value.trip.id}/days/${activeDay.value.id}`, {
      method: 'DELETE',
    })
    await loadTrip(activeTrip.value.trip.id)
  } catch (err: any) {
    handleErr(err, '刪除失敗')
  } finally {
    dayLoading.value = false
  }
}

// ── Waypoint management ───────────────────────────────────────
function addWaypoint(spot: PendingSpot) {
  if (!activeDay.value) return
  localWaypoints.value.push({
    tempId:         crypto.randomUUID(),
    day_id:         activeDay.value.id,
    spot_id:        spot.spot_id,
    order_index:    localWaypoints.value.length,
    custom_name:    spot.name,
    emoji:          spot.emoji,
    lat:            spot.lat,
    lng:            spot.lng,
    transport_mode: transportMode.value,
    notes:          null,
  })
  isDirty.value = true
  emitWaypoints()
}

function removeWaypoint(index: number) {
  localWaypoints.value.splice(index, 1)
  isDirty.value = true
  clearRoute()
  emitWaypoints()
}

function onDragEnd() {
  isDirty.value = true
  clearRoute()
  emitWaypoints()
}

function emitWaypoints() {
  emit('waypoints-updated', localWaypoints.value as TripWaypoint[])
}

async function saveWaypoints() {
  if (!activeTrip.value || !activeDay.value || saving.value) return
  saving.value = true
  try {
    const { waypoints: saved } = await authFetch<{ waypoints: TripWaypoint[] }>(
      `/api/trips/${activeTrip.value.trip.id}/days/${activeDay.value.id}/waypoints`,
      { method: 'PUT', body: { waypoints: localWaypoints.value } }
    )
    // Merge saved IDs back
    const otherWps = (activeTrip.value.waypoints ?? []).filter(w => w.day_id !== activeDay.value!.id)
    activeTrip.value.waypoints = [...otherWps, ...saved]
    localWaypoints.value = saved.map(w => ({ ...w }))
    isDirty.value = false
  } catch (err: any) {
    handleErr(err, '儲存失敗')
  } finally {
    saving.value = false
  }
}

// ── Route calculation ─────────────────────────────────────────
async function calculateRoute() {
  if (localWaypoints.value.length < 2 || routeLoading.value) return
  routeLoading.value = true
  try {
    const coords = localWaypoints.value.map(wp => `${wp.lng},${wp.lat}`).join(';')
    const data = await $fetch<{ distance: number; duration: number; geometry: any }>('/api/route/plan', {
      params: { coords, mode: transportMode.value },
    })
    routeInfo.value = { distance: data.distance, duration: data.duration }
    emit('route-ready', data.geometry)
  } catch {
    // silently skip — OSRM demo may be temporarily unavailable
    clearRoute()
  } finally {
    routeLoading.value = false
  }
}

function clearRoute() {
  routeInfo.value = null
  emit('route-cleared')
}

// ── Invite link ──────────────────────────────────────────────
async function copyInviteLink(role: 'viewer' | 'editor' = 'viewer') {
  if (!activeTrip.value || copyLoading.value) return
  copyLoading.value = true
  try {
    const { token: inviteToken } = await authFetch<{ token: string }>('/api/trips/invite', {
      method: 'POST',
      body: { tripId: activeTrip.value.trip.id, role },
    })
    const url = `${window.location.origin}/map?trip_invite=${inviteToken}`
    await navigator.clipboard.writeText(url)
    const roleLabel = role === 'editor' ? '可編輯' : '觀看者'
    msg.success(`已複製「${roleLabel}」邀請連結！有效期 7 天。`)
    showInviteMenu.value = false
  } catch (err: any) {
    handleErr(err, '產生連結失敗')
  } finally {
    copyLoading.value = false
  }
}

// ── Format helpers ────────────────────────────────────────────
function formatDist(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

function formatDur(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.round((sec % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m} 分`
}

// ── Watch pending spot from map ───────────────────────────────
watch(() => props.pendingSpot, (spot) => {
  if (!spot) return
  if (activeTrip.value) {
    addWaypoint(spot)
  } else {
    // No active trip — queue the spot and open the create dialog
    queuedSpot.value = spot
    showCreateTrip.value = true
  }
})

// ── Init ─────────────────────────────────────────────────────
onMounted(fetchTrips)

// ── Public: process join tokens after login ───────────────────
defineExpose({ fetchTrips })
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
