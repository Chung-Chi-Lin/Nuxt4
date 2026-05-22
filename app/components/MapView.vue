<template>
  <div class="relative w-full h-full">

    <!-- 地圖容器 -->
    <div ref="mapEl" class="absolute inset-0" />

    <!-- 搜尋 + Google Maps 連結 overlay（左上）-->
    <div class="search-overlay absolute top-3 left-3 z-[1000] w-72 sm:w-80">
      <div class="bg-food-surface rounded-2xl shadow-lg border border-food-border overflow-hidden">

        <!-- 搜尋輸入 -->
        <div class="flex items-center px-3 py-2.5 gap-2">
          <svg class="w-4 h-4 text-food-muted shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="m21 21-4.35-4.35"/>
          </svg>
          <input
            v-model="searchQuery"
            @input="onSearchInput"
            @focus="showResults = searchResults.length > 0"
            type="text"
            placeholder="搜尋地點、店家…"
            class="flex-1 bg-transparent text-sm text-food-brown placeholder-food-border focus:outline-none min-w-0"
          />
          <svg v-if="searchLoading" class="animate-spin h-4 w-4 text-food-muted shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <button v-else-if="searchQuery" @click="clearSearch"
            class="w-5 h-5 flex items-center justify-center text-food-muted hover:text-food-brown transition shrink-0 text-xs">
            ✕
          </button>
        </div>

        <!-- 搜尋結果下拉 -->
        <div v-if="showResults && searchResults.length" class="border-t border-food-border max-h-52 overflow-y-auto">
          <button v-for="r in searchResults" :key="r.place_id"
            @click="selectSearchResult(r)"
            class="w-full px-3 py-2.5 text-left hover:bg-food-beige transition flex items-start gap-2">
            <span class="text-food-caramel shrink-0 mt-0.5 text-sm">📍</span>
            <span class="text-food-brown text-xs line-clamp-2">{{ r.display_name }}</span>
          </button>
        </div>

        <!-- Google Maps 連結 -->
        <div class="border-t border-food-border px-3 py-2.5">
          <button @click="showGmapsInput = !showGmapsInput"
            class="text-xs text-food-muted hover:text-food-caramel transition flex items-center gap-1.5 w-full">
            <span>🔗</span>
            <span>貼上 Google Maps 連結</span>
            <span class="ml-auto">{{ showGmapsInput ? '▲' : '▼' }}</span>
          </button>
          <div v-if="showGmapsInput" class="mt-2 space-y-1.5">
            <div class="flex gap-2">
              <input v-model="gmapsUrl" type="text" placeholder="https://maps.app.goo.gl/..."
                class="flex-1 px-2.5 py-1.5 rounded-lg bg-food-input border border-food-border text-xs text-food-brown focus:outline-none focus:border-food-caramel min-w-0" />
              <button @click="parseGmapsLink" :disabled="gmapsLoading"
                class="px-3 py-1.5 bg-food-caramel text-white text-xs font-bold rounded-lg hover:bg-food-orange disabled:opacity-50 transition shrink-0">
                {{ gmapsLoading ? '…' : '前往' }}
              </button>
            </div>
            <p v-if="gmapsError" class="text-food-red text-xs">{{ gmapsError }}</p>
          </div>
        </div>

      </div>
    </div>

    <!-- 新增模式提示 banner -->
    <Transition enter-from-class="opacity-0 -translate-y-2" leave-to-class="opacity-0 -translate-y-2" enter-active-class="transition duration-200" leave-active-class="transition duration-200">
      <div v-if="addMode"
        class="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-food-brown/90 text-white text-xs px-5 py-2.5 rounded-full shadow-lg whitespace-nowrap pointer-events-none">
        點擊地圖任意位置新增標記
      </div>
    </Transition>

    <!-- 新增標記 FAB（右下，在 Leaflet zoom 控制上方）-->
    <button @click="toggleAddMode"
      :class="addMode ? 'bg-food-red hover:bg-red-600' : 'bg-food-caramel hover:bg-food-orange'"
      class="absolute bottom-25 right-3 z-[1000] w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white text-2xl font-bold transition hover:scale-105 active:scale-95 select-none"
      :title="addMode ? '取消新增' : '新增標記'">
      {{ addMode ? '✕' : '＋' }}
    </button>

    <!-- 新增標記 Modal -->
    <AddSpotModal
      v-if="showAddModal"
      :lat="addLatLng.lat"
      :lng="addLatLng.lng"
      :source-name="addModalName"
      :token="token"
      :poi-info="addPoiInfo"
      :address="addAddress"
      @saved="onSpotSaved"
      @cancel="onModalCancel"
    />

    <!-- XP 結果 Modal -->
    <XpResultModal
      v-if="showXpModal && xpResult"
      v-bind="xpResult"
      @close="closeXpModal"
    />

    <!-- 編輯標記 Modal -->
    <EditSpotModal
      v-if="editingSpot"
      :spot="editingSpot"
      :token="token"
      @saved="onSpotEdited"
      @cancel="editingSpot = null"
    />

    <!-- 回報標記 Modal -->
    <ReportModal
      v-if="reportingSpotId"
      :spot-id="reportingSpotId"
      :token="token"
      @close="reportingSpotId = null"
    />

    <!-- 查看評論 Modal -->
    <SpotCommentsModal
      v-if="viewingCommentSpot"
      :spot-id="viewingCommentSpot.id"
      :spot-name="viewingCommentSpot.name"
      :token="token"
      @close="viewingCommentSpot = null"
    />

    <!-- 撰寫評論 Modal -->
    <WriteCommentModal
      v-if="writingCommentSpot"
      :spot-id="writingCommentSpot.id"
      :spot-name="writingCommentSpot.name"
      :token="token"
      @close="writingCommentSpot = null"
      @saved="writingCommentSpot = null"
    />

  </div>
</template>

<script lang="ts" setup>
import type { Spot, DbSpot, GeoLocation } from '~/types'

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

const props = defineProps<{
  spots: Spot[]
  selectedSpot: GeoLocation | null
  token: string
  userId: string
  flyTo?: GeoLocation | null
}>()

const emit = defineEmits<{
  'spots-updated': [data: { spots: DbSpot[]; loading: boolean }]
  'center-changed': [lat: number, lng: number]
}>()

// ── Leaflet ──────────────────────────────────────────────────
const mapEl = ref<HTMLElement | null>(null)
let L: any = null
let leafletMap: any = null
let demoSpotLayer: any = null
let dbSpotLayer: any = null
let tempMarker: any = null
let userMarker: any = null

// ── 搜尋 ──────────────────────────────────────────────────────
const searchQuery   = ref('')
const searchResults = ref<NominatimResult[]>([])
const searchLoading = ref(false)
const showResults   = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null

// ── Google Maps 連結 ────────────────────────────────────────
const showGmapsInput = ref(true)
const gmapsUrl       = ref('')
const gmapsError     = ref('')
const gmapsLoading   = ref(false)

// ── 新增模式 ────────────────────────────────────────────────
const addMode      = ref(false)
const showAddModal = ref(false)
const addLatLng    = ref({ lat: 0, lng: 0 })
const addModalName = ref('')
const addPoiInfo   = ref<{ name: string; type: string; found: boolean; loading: boolean } | null>(null)
const addAddress   = ref('')

// ── XP 結果 ─────────────────────────────────────────────────
const xpResult    = ref<any>(null)
const showXpModal = ref(false)

// ── 編輯標記 ─────────────────────────────────────────────────
const editingSpot        = ref<DbSpot | null>(null)
const reportingSpotId    = ref<string | null>(null)
const viewingCommentSpot = ref<{ id: string; name: string } | null>(null)
const writingCommentSpot = ref<{ id: string; name: string } | null>(null)

// ── 關閉搜尋結果（點外部）──────────────────────────────────
function onClickOutside(e: MouseEvent) {
  const el = document.querySelector('.search-overlay')
  if (el && !el.contains(e.target as Node)) {
    showResults.value = false
    showGmapsInput.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', onClickOutside)

  if (!mapEl.value) return
  L = (await import('leaflet')).default

  const initCenter: [number, number] = props.flyTo
    ? [props.flyTo.lat, props.flyTo.lng]
    : [25.0380, 121.5420]
  leafletMap = L.map(mapEl.value, { zoomControl: false }).setView(initCenter, props.flyTo ? 16 : 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(leafletMap)

  L.control.zoom({ position: 'bottomright' }).addTo(leafletMap)

  demoSpotLayer = L.layerGroup().addTo(leafletMap)
  dbSpotLayer   = L.layerGroup().addTo(leafletMap)

  // Demo spot markers
  for (const spot of props.spots) {
    addDemoMarker(spot)
  }

  // 地圖移動後更新 DB 標記
  let viewportTimer: ReturnType<typeof setTimeout> | null = null
  leafletMap.on('moveend', () => {
    if (viewportTimer) clearTimeout(viewportTimer)
    viewportTimer = setTimeout(fetchViewportSpots, 600)
  })

  // 新增模式點擊
  leafletMap.on('click', (e: any) => {
    if (!addMode.value) return
    addMode.value = false
    leafletMap.getContainer().style.cursor = ''
    placeTempMarker(e.latlng.lat, e.latlng.lng, '')
    addLatLng.value  = { lat: e.latlng.lat, lng: e.latlng.lng }
    addModalName.value = ''
    showAddModal.value = true
  })

  await fetchViewportSpots()
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  leafletMap?.remove()
})

// ── selectedSpot（側欄連動）────────────────────────────────
watch(() => props.selectedSpot, (spot) => {
  if (spot && leafletMap) leafletMap.setView([spot.lat, spot.lng], 16)
})

// ── 飛到使用者定位並顯示藍點 ──────────────────────────────
watch(() => props.flyTo, (loc) => {
  if (!loc || !leafletMap || !L) return
  leafletMap.flyTo([loc.lat, loc.lng], 15, { duration: 1.2 })
  if (userMarker) userMarker.remove()
  userMarker = L.circleMarker([loc.lat, loc.lng], {
    radius: 8, fillColor: '#3B82F6', color: '#ffffff', weight: 2.5, fillOpacity: 1,
  }).bindPopup('<div style="font-family:\'Noto Sans TC\',sans-serif;font-size:13px;font-weight:700;color:#1D4ED8">📍 您在這裡</div>')
    .addTo(leafletMap)
})

// ── Demo markers ────────────────────────────────────────────
function addDemoMarker(spot: Spot) {
  if (!L || !demoSpotLayer) return
  const icon = L.divIcon({
    html: `<span style="font-size:26px;line-height:1;">${spot.emoji}</span>`,
    className: 'food-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
  L.marker([spot.lat, spot.lng], { icon })
    .bindPopup(`
      <div style="font-family:'Noto Sans TC',sans-serif;min-width:120px">
        <div style="font-weight:700;font-size:14px;margin-bottom:4px">${spot.emoji} ${spot.name}</div>
        <div style="font-size:12px;color:#9C7B5C">${spot.desc}</div>
      </div>`)
    .addTo(demoSpotLayer)
}

// ── DB spots ────────────────────────────────────────────────
async function fetchViewportSpots() {
  if (!leafletMap || !props.token) return
  const b      = leafletMap.getBounds()
  const center = leafletMap.getCenter()

  emit('spots-updated', { spots: [], loading: true })

  try {
    const { spots } = await $fetch<{ spots: DbSpot[] }>('/api/spots', {
      headers: { Authorization: `Bearer ${props.token}` },
      params: { north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() },
    })
    if (!dbSpotLayer) return
    dbSpotLayer.clearLayers()
    for (const s of spots) addDbMarker(s)

    emit('spots-updated', { spots, loading: false })
    emit('center-changed', center.lat, center.lng)
  } catch {
    emit('spots-updated', { spots: [], loading: false })
  }
}

function addDbMarker(spot: DbSpot) {
  if (!L || !dbSpotLayer) return
  const icon = L.divIcon({
    html: `<span style="font-size:26px;line-height:1;">${spot.emoji}</span>`,
    className: 'food-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })

  const tagsHtml = spot.tags?.length
    ? `<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:5px">${spot.tags.map(t =>
        `<span style="background:#F5EDD7;color:#9C7B5C;padding:1px 7px;border-radius:10px;font-size:10px">${t}</span>`
      ).join('')}</div>`
    : ''

  const gmapsNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`
  const addressHtml = `<div style="margin-top:4px;display:flex;align-items:center;gap:4px">
    ${spot.address
      ? `<span style="flex:1;font-size:10px;color:#9C7B5C;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${spot.address}">📍 ${spot.address}</span>`
      : '<span style="flex:1"></span>'
    }
    <a href="${gmapsNavUrl}" target="_blank" rel="noopener noreferrer"
       style="flex-shrink:0;background:#4285F4;color:white;padding:2px 8px;border-radius:10px;font-size:10px;text-decoration:none;font-weight:700;white-space:nowrap;font-family:'Noto Sans TC',sans-serif">
      🗺️ 導航
    </a>
  </div>`

  const notesHtml = spot.notes
    ? `<div style="font-size:11px;color:#9C7B5C;margin-top:5px;border-top:1px solid #E8D9C0;padding-top:4px">${spot.notes}</div>`
    : ''

  const photosHtml = spot.photo_urls?.length
    ? `<div style="display:flex;gap:4px;margin-top:6px;border-top:1px solid #E8D9C0;padding-top:5px">${
        spot.photo_urls.slice(0, 3).map(url =>
          `<a href="${url}" target="_blank" rel="noopener" style="display:block;width:52px;height:52px;border-radius:6px;overflow:hidden;flex-shrink:0;border:1px solid #E8D9C0">
            <img src="${url}" style="width:100%;height:100%;object-fit:cover" loading="lazy" />
          </a>`
        ).join('')
      }</div>`
    : ''

  const isOwn = spot.user_id === props.userId
  const btnStyle = (bg: string, color: string, border: string) =>
    `background:${bg};color:${color};border:1px solid ${border};padding:4px 0;border-radius:6px;cursor:pointer;font-size:11px;font-family:'Noto Sans TC',sans-serif`

  const actionsHtml = isOwn
    ? `<div style="display:flex;flex-direction:column;gap:5px;margin-top:7px">
        <div style="display:flex;gap:5px">
          <button data-edit="${spot.id}" style="flex:1;${btnStyle('#FFF8EE','#C8860A','#E8C97A')}">✏️ 編輯</button>
          <button data-del="${spot.id}"  style="flex:1;${btnStyle('#fef2f2','#C0392B','#fca5a5')}">🗑 刪除</button>
        </div>
        <button data-comment-view="${spot.id}" style="width:100%;${btnStyle('#F0FDF4','#16A34A','#BBF7D0')}">💬 查看評論</button>
      </div>`
    : `<div style="display:flex;flex-direction:column;gap:5px;margin-top:7px">
        <div style="display:flex;gap:5px">
          <button data-comment-write="${spot.id}" style="flex:1;${btnStyle('#EEF2FF','#4F46E5','#C7D2FE')}">✏️ 評論</button>
          <button data-report="${spot.id}"        style="flex:1;${btnStyle('#fafafa','#9C7B5C','#E8D9C0')}">⚠️ 回報</button>
        </div>
        <button data-comment-view="${spot.id}" style="width:100%;${btnStyle('#F0FDF4','#16A34A','#BBF7D0')}">💬 查看評論</button>
      </div>`

  const visibilityHtml = `<div style="font-size:10px;color:#9C7B5C;margin-top:4px">${isOwn ? (spot.is_public ? '🌐 公開' : '🔒 僅自己') : '👤 其他用戶'}</div>`

  const marker = L.marker([spot.lat, spot.lng], { icon })
    .bindPopup(`
      <div style="font-family:'Noto Sans TC',sans-serif;min-width:140px;max-width:210px">
        <div style="font-weight:700;font-size:14px">${spot.emoji} ${spot.name}</div>
        ${visibilityHtml}
        ${addressHtml}
        ${tagsHtml}
        ${notesHtml}
        ${photosHtml}
        ${actionsHtml}
      </div>`, { maxWidth: 230 })
    .addTo(dbSpotLayer)

  marker.on('popupopen', () => {
    const viewBtn = document.querySelector(`[data-comment-view="${spot.id}"]`) as HTMLElement
    if (viewBtn) viewBtn.onclick = () => {
      leafletMap?.closePopup()
      viewingCommentSpot.value = { id: spot.id, name: spot.name }
    }

    if (isOwn) {
      const editBtn = document.querySelector(`[data-edit="${spot.id}"]`) as HTMLElement
      const delBtn  = document.querySelector(`[data-del="${spot.id}"]`) as HTMLElement
      if (editBtn) editBtn.onclick = () => openEditSpot(spot)
      if (delBtn)  delBtn.onclick  = () => confirmDeleteSpot(spot)
    } else {
      const reportBtn = document.querySelector(`[data-report="${spot.id}"]`) as HTMLElement
      const writeBtn  = document.querySelector(`[data-comment-write="${spot.id}"]`) as HTMLElement
      if (reportBtn) reportBtn.onclick = () => {
        leafletMap?.closePopup()
        reportingSpotId.value = spot.id
      }
      if (writeBtn) writeBtn.onclick = () => {
        leafletMap?.closePopup()
        writingCommentSpot.value = { id: spot.id, name: spot.name }
      }
    }
  })
}

function openEditSpot(spot: DbSpot) {
  leafletMap?.closePopup()
  editingSpot.value = spot
}

async function onSpotEdited(updatedSpot: any) {
  editingSpot.value = null
  leafletMap?.closePopup()
  await fetchViewportSpots()
}

async function confirmDeleteSpot(spot: DbSpot) {
  const xpWarn = spot.xp_earned > 0 ? `\n\n⚠️ 刪除後將扣除當初獲得的 ${spot.xp_earned} XP。` : ''
  if (!confirm(`確定要刪除「${spot.name}」嗎？${xpWarn}`)) return
  try {
    const result = await $fetch<{ ok: boolean; xpDeducted: number; newXp: number; newLevel: number }>(`/api/spots/${spot.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${props.token}` },
    })
    leafletMap?.closePopup()
    if (result.xpDeducted > 0) {
      alert(`標記已刪除，已扣除 ${result.xpDeducted} XP。目前 XP：${result.newXp}（Lv.${result.newLevel}）`)
    }
    await fetchViewportSpots()
  } catch {
    alert('刪除失敗，請稍後再試')
  }
}

// ── 暫時標記 ────────────────────────────────────────────────
function placeTempMarker(lat: number, lng: number, name: string) {
  if (!L || !leafletMap) return
  if (tempMarker) { tempMarker.remove(); tempMarker = null }

  const icon = L.divIcon({
    html: '<span style="font-size:30px;line-height:1;display:block;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))">📍</span>',
    className: '',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
  })

  tempMarker = L.marker([lat, lng], { icon })
    .bindPopup(`
      <div style="font-family:'Noto Sans TC',sans-serif;min-width:160px;text-align:center">
        <div style="font-size:12px;color:#9C7B5C;margin-bottom:8px;word-break:break-all">${name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`}</div>
        <button id="add-spot-btn" style="background:#C8860A;color:white;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;width:100%;font-family:'Noto Sans TC',sans-serif">
          ＋ 新增標記
        </button>
      </div>`)
    .addTo(leafletMap)

  tempMarker.on('popupopen', () => {
    const btn = document.getElementById('add-spot-btn')
    if (btn) {
      btn.onclick = () => {
        addLatLng.value = { lat, lng }
        addModalName.value = name
        showAddModal.value = true
        tempMarker?.closePopup()
      }
    }
  })

  tempMarker.openPopup()

  // Reverse geocode to verify if a known POI exists at this location
  reverseGeocode(lat, lng)
}

// ── 位置驗證 ─────────────────────────────────────────────────
const BUSINESS_CLASSES = new Set(['amenity', 'shop', 'tourism', 'leisure', 'craft', 'healthcare', 'office', 'building'])

function buildAddressFromNominatim(addr: Record<string, string> = {}): string {
  const road     = addr.road || addr.pedestrian || addr.footway || ''
  const district = addr.suburb || addr.neighbourhood || addr.county || ''
  const city     = addr.city || addr.town || addr.village || addr.municipality || ''
  return [road, district, city].filter(Boolean).join(', ')
}

async function reverseGeocode(lat: number, lng: number) {
  addPoiInfo.value = { name: '', type: '', found: false, loading: true }
  addAddress.value = ''
  try {
    const res = await $fetch<any>('https://nominatim.openstreetmap.org/reverse', {
      params: { format: 'json', lat, lon: lng, zoom: 18, addressdetails: 1 },
    })
    addPoiInfo.value = {
      name:    res.name  ?? '',
      type:    res.type  ?? '',
      found:   !!(res.name && BUSINESS_CLASSES.has(res.class ?? '')),
      loading: false,
    }
    addAddress.value = buildAddressFromNominatim(res.address ?? {})
  } catch {
    addPoiInfo.value = { name: '', type: '', found: false, loading: false }
  }
}

// ── 搜尋 ────────────────────────────────────────────────────
function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  if (!searchQuery.value.trim()) { searchResults.value = []; showResults.value = false; return }
  searchTimer = setTimeout(doSearch, 500)
}

async function doSearch() {
  if (!searchQuery.value.trim()) return
  searchLoading.value = true
  try {
    const results = await $fetch<NominatimResult[]>('https://nominatim.openstreetmap.org/search', {
      params: { q: searchQuery.value, format: 'json', limit: 5, 'accept-language': 'zh-TW,zh,en' },
      headers: { 'User-Agent': 'BojjiTastyTrails/1.0' },
    })
    searchResults.value = results
    showResults.value = results.length > 0
  } catch {
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

function selectSearchResult(r: NominatimResult) {
  const lat = parseFloat(r.lat)
  const lng = parseFloat(r.lon)
  leafletMap?.setView([lat, lng], 17)
  placeTempMarker(lat, lng, r.display_name.split(',')[0] ?? '')
  emit('center-changed', lat, lng)
  clearSearch()
}

function clearSearch() {
  searchQuery.value = ''; searchResults.value = []; showResults.value = false
}

// ── Google Maps 連結 ─────────────────────────────────────────
async function parseGmapsLink() {
  if (!gmapsUrl.value.trim() || gmapsLoading.value) return
  gmapsError.value = ''
  gmapsLoading.value = true
  try {
    const res = await $fetch<{ lat: number; lng: number; name: string }>('/api/utils/resolve-gmaps', {
      method: 'POST',
      body: { url: gmapsUrl.value.trim() },
    })
    leafletMap?.setView([res.lat, res.lng], 17)
    placeTempMarker(res.lat, res.lng, res.name)
    emit('center-changed', res.lat, res.lng)
    gmapsUrl.value = ''
    showGmapsInput.value = false
  } catch (err: any) {
    gmapsError.value = err.data?.statusMessage ?? '解析失敗'
  } finally {
    gmapsLoading.value = false
  }
}

// ── 新增模式 ────────────────────────────────────────────────
function toggleAddMode() {
  addMode.value = !addMode.value
  if (leafletMap) {
    leafletMap.getContainer().style.cursor = addMode.value ? 'crosshair' : ''
  }
}

function onSpotSaved(result: any) {
  showAddModal.value = false
  addMode.value = false
  if (tempMarker) { tempMarker.remove(); tempMarker = null }
  addDbMarker(result.spot)
  xpResult.value = result
  showXpModal.value = true
}

function closeXpModal() {
  showXpModal.value = false
  xpResult.value = null
}

function onModalCancel() {
  showAddModal.value = false
  addMode.value = false
  addPoiInfo.value = null
  addAddress.value = ''
  if (leafletMap) leafletMap.getContainer().style.cursor = ''
}
</script>
