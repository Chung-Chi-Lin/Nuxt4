<template>
  <div class="h-[100dvh] flex flex-col overflow-hidden bg-food-cream">

    <!-- Header -->
    <header class="bg-food-surface border-b border-food-border px-4 sm:px-5 py-2.5 sm:py-3 flex items-center gap-2 shrink-0 z-10">
      <!-- Left: Logo -->
      <div class="shrink-0 flex items-center gap-2 sm:gap-3">
        <span class="text-xl sm:text-2xl">🗺️</span>
        <div>
          <h1 class="font-bold text-food-brown text-sm sm:text-base leading-tight">波吉的美食地圖</h1>
          <p class="hidden sm:block font-caveat text-food-caramel text-xs leading-tight">Bojji's Tasty Trails</p>
        </div>
      </div>

      <!-- Center: Weather marquee -->
      <div class="hidden md:flex flex-1 justify-center items-center min-w-0 px-4">
        <div class="w-full max-w-xs lg:max-w-xl overflow-hidden">
          <WeatherMarquee />
        </div>
      </div>


      <!-- Right: User -->
      <div class="shrink-0 flex items-center gap-2 sm:gap-3 ml-auto">
        <NuxtLink to="/profile" class="flex items-center gap-2 group">
          <div class="relative shrink-0">
            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-food-beige border-2 border-food-border overflow-hidden group-hover:border-food-caramel transition">
              <img v-if="user?.avatar_url" :src="user.avatar_url" :alt="user?.username" class="w-full h-full object-cover" />
              <span v-else class="flex items-center justify-center w-full h-full text-base sm:text-lg select-none">👤</span>
            </div>
            <UserLevelBadge v-if="user?.user_level" :level="user.user_level" :size="26"
              class="absolute -bottom-1.5 -right-1.5 drop-shadow" />
          </div>
          <span v-if="user?.username"
            class="hidden sm:block text-xs font-bold text-food-brown group-hover:text-food-caramel transition max-w-[72px] truncate">
            {{ user.username }}
          </span>
        </NuxtLink>
        <button
          class="text-xs text-food-muted hover:text-food-brown transition px-2.5 sm:px-3 py-1.5 rounded-lg border border-food-border hover:border-food-caramel"
          @click="handleLogout"
        >
          登出
        </button>
      </div>
    </header>

    <!-- Body -->
    <div class="flex flex-1 overflow-hidden relative">

      <!-- Map -->
      <div class="flex-1 relative">
        <ClientOnly>
          <MapView class="absolute inset-0"
            :spots="spots"
            :selected-spot="selectedSpot"
            :token="token ?? ''"
            :user-id="user?.id ?? ''"
            :fly-to="effectiveFlyTo"
            :bottom-inset="mobileBottomInset"
            :category-filters="sidebarCategories"
            :trip-waypoints="sidebarTabIsTrip ? activeTripWaypoints : []"
            :trip-route-geometry="sidebarTabIsTrip ? tripRouteGeometry : null"
            :trip-tab-active="sidebarTabIsTrip"
            :reload-trigger="mapReloadTrigger"
            :fly-to-trip-trigger="flyToTripTrigger"
            @spots-updated="onSpotsUpdated"
            @center-changed="onCenterChanged"
            @xp-gained="onXpGained"
            @add-to-trip="onAddToTrip"
          />
        </ClientOnly>
        <ClientOnly>
          <WeatherWidget
            :lat="mapCenter.lat"
            :lng="mapCenter.lng"
            class="absolute top-3 right-3 z-[9998]"
          />
        </ClientOnly>
      </div>

      <!-- ── Desktop: right sidebar ── -->
      <aside
        class="hidden md:flex flex-col bg-food-surface border-l border-food-border overflow-hidden shrink-0 transition-all duration-300 z-10"
        :style="{ width: sidebarOpen ? '320px' : '0px' }"
      >
        <div class="w-80 flex flex-col h-full overflow-y-auto">
          <SidebarContent
            :spots="sidebarSpots"
            :loading="spotsLoading"
            :current-user-id="user?.id ?? ''"
            :token="token ?? ''"
            :pending-spot="!isMobile ? pendingSpot : null"
            @select="handleSpotSelect"
            @view-comments="onSidebarViewComments"
            @write-comment="onSidebarWriteComment"
            @toggle-bot="toggleHelpBot"
            @category-changed="sidebarCategories = $event"
            @waypoints-updated="onWaypointsUpdated"
            @route-ready="onRouteReady"
            @route-cleared="onRouteCleared"
            @tab-changed="sidebarTabIsTrip = ($event === 'trip')"
            @trip-switched="onTripSwitched"
          />
        </div>
      </aside>

      <!-- Desktop toggle button (right edge) -->
      <button
        class="hidden md:flex absolute top-1/2 -translate-y-1/2 z-20 bg-food-surface border border-food-border rounded-l-xl px-2 py-4 shadow-md hover:bg-food-beige transition-all duration-300 flex-col items-center"
        :style="{ right: sidebarOpen ? '320px' : '0' }"
        @click="sidebarOpen = !sidebarOpen"
      >
        <span class="text-food-caramel font-bold text-sm">{{ sidebarOpen ? '›' : '‹' }}</span>
      </button>

      <!-- ── Mobile: overlay ── -->
      <div
        class="md:hidden fixed inset-0 z-[29] bg-black/30 transition-opacity duration-300"
        :class="sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'"
        @click="sidebarOpen = false"
      />

      <!-- ── Mobile: bottom sheet with persistent tab ── -->
      <div
        class="md:hidden fixed bottom-0 inset-x-0 z-[9990] transition-transform duration-300"
        :style="sidebarOpen ? {} : { transform: 'translateY(calc(100% - 3rem))' }"
      >
        <div class="bg-food-surface rounded-t-2xl border-t border-food-border shadow-2xl flex flex-col" style="max-height: 65dvh">

          <!-- 頁簽 handle（永遠可見） -->
          <div
            class="flex-shrink-0 h-12 flex items-center px-4 cursor-pointer relative select-none"
            @click="sidebarOpen = !sidebarOpen"
          >
            <div class="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-food-border" />
            <span class="text-sm mt-1">🍜</span>
            <span class="text-xs font-bold text-food-brown ml-1.5 mt-1">美食清單</span>
            <span v-if="!sidebarOpen && sidebarSpots.length" class="ml-1.5 mt-1 text-[10px] text-food-muted tabular-nums">{{ sidebarSpots.length }} 個</span>
            <span class="ml-auto text-[10px] text-food-muted mt-1">{{ sidebarOpen ? '▼' : '▲' }}</span>
          </div>

          <!-- 展開後的內容 -->
          <div v-show="sidebarOpen" class="flex-1 overflow-y-auto min-h-0">
            <SidebarContent
              :spots="sidebarSpots"
              :loading="spotsLoading"
              :current-user-id="user?.id ?? ''"
              :token="token ?? ''"
              :pending-spot="isMobile ? pendingSpot : null"
              @select="handleSpotSelect"
              @view-comments="onSidebarViewComments"
              @write-comment="onSidebarWriteComment"
              @toggle-bot="toggleHelpBot"
              @category-changed="sidebarCategories = $event"
              @waypoints-updated="onWaypointsUpdated"
              @route-ready="onRouteReady"
              @route-cleared="onRouteCleared"
              @tab-changed="sidebarTabIsTrip = ($event === 'trip')"
              @trip-switched="onTripSwitched"
            />
          </div>

        </div>
      </div>
    </div>

    <LocationPermissionModal :open="show" @allow="allow" @deny="deny" />
    <HelpBot ref="helpBotRef" :spots="sidebarSpots" :map-center="mapCenter" />

    <!-- 查看評論 Modal（由右側小卡觸發）-->
    <SpotCommentsModal
      v-if="sidebarViewingSpot"
      :spot-id="sidebarViewingSpot.id"
      :spot-name="sidebarViewingSpot.name"
      :token="token ?? ''"
      @close="sidebarViewingSpot = null"
    />

    <!-- 撰寫評論 Modal（由右側小卡觸發）-->
    <WriteCommentModal
      v-if="sidebarWritingSpot"
      :spot-id="sidebarWritingSpot.id"
      :spot-name="sidebarWritingSpot.name"
      :token="token ?? ''"
      @close="sidebarWritingSpot = null"
      @saved="sidebarWritingSpot = null"
    />

  </div>
</template>

<script lang="ts" setup>
import type { Spot, DbSpot, GeoLocation, AuthUser, SidebarSpot, TripWaypoint, PendingSpot } from '~/types'
import { useGeoModal } from '~/composables/useGeoModal'

definePageMeta({ middleware: 'auth' })
useHead({ title: '地圖 — 波吉的美食地圖' })

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const msg    = useMessage()
const router = useRouter()
const route  = useRoute()
const token  = useCookie('auth_token')
const { authFetch } = useAuthFetch(token)

const sidebarOpen         = ref(false)
const selectedSpot        = ref<GeoLocation | null>(null)
const dbSpots             = ref<DbSpot[]>([])
const spotsLoading        = ref(false)
const mapCenter           = ref<GeoLocation>({ lat: 25.0380, lng: 121.5420 })
const spots: Spot[]       = []
const sidebarViewingSpot  = ref<{ id: string; name: string } | null>(null)
const sidebarWritingSpot  = ref<{ id: string; name: string } | null>(null)
const sidebarCategories   = ref<string[]>(['food'])
const activeTripWaypoints = ref<TripWaypoint[]>([])
const tripRouteGeometry   = ref<any | null>(null)
const pendingSpot         = ref<PendingSpot | null>(null)
const sidebarTabIsTrip    = ref(false)
const mapReloadTrigger    = ref(0)
const flyToTripTrigger    = ref(0)

const { show, userLocation, requestIfNeeded, allow, deny } = useGeoModal()

const helpBotRef = ref<{ toggle: () => void } | null>(null)
function toggleHelpBot() { helpBotRef.value?.toggle() }

useSessionGuard()

const queryCenter = computed<GeoLocation | null>(() => {
  const lat = parseFloat(route.query.lat as string)
  const lng = parseFloat(route.query.lng as string)
  return !isNaN(lat) && !isNaN(lng) ? { lat, lng } : null
})

const effectiveFlyTo = computed(() => queryCenter.value ?? userLocation.value)

const isMobile = ref(false)

const mobileBottomInset = computed<string | undefined>(() =>
  isMobile.value ? '3rem' : undefined
)

onMounted(async () => {
  isMobile.value = window.innerWidth < 768
  if (window.innerWidth >= 768) sidebarOpen.value = true
  if (!queryCenter.value) requestIfNeeded()

  const onResize = () => { isMobile.value = window.innerWidth < 768 }
  window.addEventListener('resize', onResize, { passive: true })
  onUnmounted(() => window.removeEventListener('resize', onResize))

  // Handle trip invite token from URL
  const inviteToken = route.query.trip_invite as string | undefined
  if (inviteToken) {
    const existing: string[] = JSON.parse(localStorage.getItem('pending_trip_invites') ?? '[]')
    if (!existing.includes(inviteToken)) existing.push(inviteToken)
    localStorage.setItem('pending_trip_invites', JSON.stringify(existing))
    // Remove token from URL without page reload
    const q = { ...route.query }
    delete q.trip_invite
    router.replace({ query: q })
  }

  // Process any pending invites if user is logged in
  if (token.value) {
    await processPendingInvites()
  }
})

const { data, error } = await useFetch<{ user: AuthUser }>('/api/auth/me', {
  headers: { Authorization: `Bearer ${token.value ?? ''}` },
})
if (error.value) {
  token.value = null
  await navigateTo('/login')
}
const user = computed(() => data.value?.user)

function onSpotsUpdated({ spots: newSpots, loading }: { spots: DbSpot[]; loading: boolean }): void {
  spotsLoading.value = loading
  if (!loading) dbSpots.value = newSpots
}

function onCenterChanged(lat: number, lng: number): void {
  mapCenter.value = { lat, lng }
}

const sidebarSpots = computed(() =>
  [...dbSpots.value]
    .map(s => ({ ...s, distance: distanceKm(mapCenter.value.lat, mapCenter.value.lng, s.lat, s.lng) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10)
)

function handleSpotSelect(spot: SidebarSpot): void {
  selectedSpot.value = spot
  if (window.innerWidth < 768) sidebarOpen.value = false
}

function handleLogout(): void {
  token.value = null
  router.push('/login')
}

function onSidebarViewComments(payload: { id: string; name: string }): void {
  sidebarViewingSpot.value = payload
}

function onSidebarWriteComment(payload: { id: string; name: string }): void {
  sidebarWritingSpot.value = payload
}

function onXpGained(payload: { newXp: number; newLevel: number; leveledUp: boolean }): void {
  if (data.value?.user) {
    data.value.user.user_level = payload.newLevel
  }
}

async function processPendingInvites(): Promise<void> {
  const pending: string[] = JSON.parse(localStorage.getItem('pending_trip_invites') ?? '[]')
  if (!pending.length) return

  const joined: string[] = []
  for (const inviteToken of pending) {
    try {
      const res = await authFetch<{ trip: { name: string }; already_member: boolean }>('/api/trips/join', {
        method: 'POST',
        body: { token: inviteToken },
      })
      if (!res.already_member) joined.push(res.trip.name)
    } catch {
      // Invalid / expired token — ignore silently
    }
  }
  localStorage.removeItem('pending_trip_invites')
  if (joined.length) {
    msg.success(`已加入旅程：${joined.join('、')}`)
  }
}

function onAddToTrip(spot: PendingSpot): void {
  sidebarTabIsTrip.value = true  // ensure button shows next time popup opens
  sidebarOpen.value = true
  pendingSpot.value = spot
  nextTick(() => { pendingSpot.value = null })
}

function onWaypointsUpdated(waypoints: TripWaypoint[]): void {
  activeTripWaypoints.value = waypoints
}

function onRouteReady(geometry: any): void {
  tripRouteGeometry.value = geometry
}

function onRouteCleared(): void {
  tripRouteGeometry.value = null
}

function reloadMap(): void {
  activeTripWaypoints.value = []
  tripRouteGeometry.value = null
  mapReloadTrigger.value++
}

const tripTabJustOpened = ref(false)

watch(sidebarTabIsTrip, (isTrip) => {
  if (isTrip) {
    if (activeTripWaypoints.value.length > 0) {
      flyToTripTrigger.value++
    } else {
      tripTabJustOpened.value = true
    }
  } else {
    tripTabJustOpened.value = false
  }
})

watch(activeTripWaypoints, (wps) => {
  if (tripTabJustOpened.value && wps.length > 0) {
    flyToTripTrigger.value++
    tripTabJustOpened.value = false
  }
}, { deep: true })

function onTripSwitched() {
  if (activeTripWaypoints.value.length > 0) {
    flyToTripTrigger.value++
  }
}
</script>
