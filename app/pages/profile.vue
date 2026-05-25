<template>
  <div class="min-h-screen bg-food-cream">

    <!-- Header -->
    <header class="bg-food-surface border-b border-food-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
      <NuxtLink to="/map" class="text-food-muted hover:text-food-brown transition text-sm font-bold">← 返回地圖</NuxtLink>
      <span class="text-food-border">|</span>
      <h1 class="font-bold text-food-brown text-sm">個人資料</h1>
    </header>

    <div class="max-w-md mx-auto px-4 py-6 space-y-5">

      <!-- ── 頭像區塊 ── -->
      <div class="bg-food-surface rounded-2xl p-6 flex flex-col items-center gap-3 shadow-sm">

        <div class="relative group cursor-pointer" @click="triggerFileUpload">
          <!-- Avatar -->
          <div class="w-24 h-24 rounded-full overflow-hidden border-4 border-food-border bg-food-beige">
            <img v-if="avatarPreview || pendingPresetUrl || user?.avatar_url"
                 :src="avatarPreview ?? pendingPresetUrl ?? user!.avatar_url!"
                 alt="頭像"
                 class="w-full h-full object-cover" />
            <span v-else class="flex items-center justify-center w-full h-full text-4xl select-none">👤</span>
          </div>
          <!-- Hover overlay -->
          <div class="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 pointer-events-none">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span class="text-white text-xs font-bold">更換頭像</span>
          </div>
          <!-- Upload spinner overlay -->
          <div v-if="avatarUploading" class="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
            <svg class="animate-spin h-7 w-7 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          </div>
          <!-- Level badge -->
          <UserLevelBadge
            v-if="user?.user_level"
            :level="user.user_level"
            :size="26"
            class="absolute -bottom-1 -right-1 drop-shadow"
          />
        </div>

        <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="handleAvatarSelect" />

        <!-- Pending upload actions -->
        <div v-if="avatarFile && !avatarUploading" class="flex flex-col items-center gap-2">
          <p class="text-xs text-food-muted">{{ avatarFile.name }}</p>
          <div class="flex gap-2">
            <button @click="uploadAvatar"
              class="px-4 py-1.5 rounded-lg bg-food-caramel text-white text-xs font-bold hover:bg-food-orange transition active:scale-95">
              儲存頭像
            </button>
            <button @click="cancelAvatarUpload"
              class="px-4 py-1.5 rounded-lg bg-food-beige text-food-muted text-xs font-bold hover:text-food-brown transition active:scale-95">
              取消
            </button>
          </div>
        </div>

        <p v-if="avatarError"   class="text-food-red text-xs text-center">{{ avatarError }}</p>
        <p v-if="avatarSuccess" class="text-green-600 text-xs text-center">{{ avatarSuccess }}</p>
        <p class="text-xs text-food-muted text-center leading-relaxed">
          建議上傳正方形圖片，至少 200×200 px<br>格式：JPG / PNG / WebP，最大 2 MB
        </p>

        <!-- Preset avatars -->
        <div class="w-full pt-3.5 border-t border-food-border">

          <!-- Header: label + page navigation -->
          <div class="flex items-center justify-between mb-2.5">
            <p class="text-[11px] font-bold text-food-muted tracking-wider uppercase">或選擇預設頭像</p>
            <div class="flex items-center gap-1.5">
              <button
                class="w-6 h-6 rounded-full flex items-center justify-center text-food-muted hover:text-food-brown hover:bg-food-beige transition disabled:opacity-30 text-base font-bold"
                :disabled="presetPage === 0"
                @click="presetPage--; pendingPresetUrl = null"
              >‹</button>
              <div class="flex gap-1">
                <button
                  v-for="(page, i) in PRESET_PAGES"
                  :key="i"
                  class="w-1.5 h-1.5 rounded-full transition-colors"
                  :class="presetPage === i ? 'bg-food-caramel' : 'bg-food-border hover:bg-food-muted'"
                  @click="presetPage = i; pendingPresetUrl = null"
                />
              </div>
              <button
                class="w-6 h-6 rounded-full flex items-center justify-center text-food-muted hover:text-food-brown hover:bg-food-beige transition disabled:opacity-30 text-base font-bold"
                :disabled="presetPage === PRESET_PAGES.length - 1"
                @click="presetPage++; pendingPresetUrl = null"
              >›</button>
            </div>
          </div>

          <!-- Category label -->
          <p class="text-[10px] text-food-muted text-center mb-2.5">
            {{ PRESET_PAGES[presetPage].label }}（{{ presetPage + 1 }} / {{ PRESET_PAGES.length }}）
          </p>

          <!-- Avatar grid -->
          <div class="grid grid-cols-4 gap-3">
            <button
              v-for="preset in PRESET_PAGES[presetPage].presets"
              :key="preset.id"
              class="relative rounded-full overflow-hidden border-2 transition-all duration-200 active:scale-95 aspect-square"
              :class="pendingPresetUrl === preset.url
                ? 'border-food-caramel shadow-md ring-2 ring-food-caramel/30'
                : user?.avatar_url === preset.url && !pendingPresetUrl
                  ? 'border-food-caramel/60'
                  : 'border-food-border hover:border-food-caramel/60'"
              :title="preset.label"
              @click="selectPreset(preset.url)"
            >
              <img :src="preset.url" :alt="preset.label" class="w-full h-full object-cover bg-food-beige" loading="lazy" />
              <!-- Currently saved checkmark (when no pending) -->
              <div v-if="user?.avatar_url === preset.url && !pendingPresetUrl"
                class="absolute bottom-0.5 right-0.5 w-4 h-4 bg-food-caramel/80 rounded-full flex items-center justify-center shadow-sm">
                <svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
            </button>
          </div>

          <!-- Confirm / Cancel (shown only when pending preset ≠ current saved) -->
          <div
            v-if="pendingPresetUrl && pendingPresetUrl !== user?.avatar_url"
            class="flex gap-2 mt-3"
          >
            <button
              class="flex-1 py-2 rounded-xl bg-food-beige text-food-muted text-xs font-bold hover:text-food-brown transition active:scale-95"
              @click="cancelPreset"
            >取消</button>
            <button
              class="flex-1 py-2 rounded-xl bg-food-caramel text-white text-xs font-bold hover:bg-food-orange transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-60"
              :disabled="presetSaving"
              @click="savePreset"
            >
              <svg v-if="presetSaving" class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              {{ presetSaving ? '儲存中…' : '儲存頭像' }}
            </button>
          </div>
        </div>

        <!-- Name + level -->
        <div class="text-center w-full">
          <p class="font-bold text-food-brown text-lg">{{ user?.username ?? '—' }}</p>
          <div v-if="user?.user_level" class="flex items-center justify-center gap-1.5 mt-1">
            <UserLevelBadge :level="user.user_level" :size="18" />
            <span class="text-xs text-food-muted">Lv. {{ user.user_level }}</span>
          </div>

          <!-- XP progress bar -->
          <div v-if="user" class="mt-3 w-full px-2">
            <div class="flex items-center justify-between text-[11px] mb-1.5">
              <span class="text-food-muted font-bold">Lv.{{ user.user_level }}</span>
              <span class="font-mono font-bold text-food-caramel">
                {{ currentLevelXp.toLocaleString() }} / {{ nextLevelXp.toLocaleString() }} XP
              </span>
              <span class="text-food-muted font-bold">Lv.{{ user.user_level + 1 }}</span>
            </div>
            <div class="h-4 bg-food-beige rounded-full overflow-hidden border border-food-border relative">
              <div
                class="h-full rounded-full bg-gradient-to-r from-food-caramel to-food-orange transition-all duration-1000 ease-out"
                :style="{ width: `${xpProgress}%` }"
              />
              <span class="absolute inset-0 flex items-center justify-center text-[10px] font-bold"
                :class="xpProgress > 40 ? 'text-white' : 'text-food-caramel'">
                {{ xpProgress }}%
              </span>
            </div>
            <p class="text-[10px] text-food-muted text-center mt-1.5">
              累積 {{ user.xp.toLocaleString() }} XP
            </p>
          </div>
        </div>
      </div>

      <!-- ── 帳號資訊 ── -->
      <div class="bg-food-surface rounded-2xl overflow-hidden shadow-sm">
        <div class="px-5 py-3 border-b border-food-border">
          <h2 class="text-xs font-bold text-food-muted tracking-wider uppercase">帳號資訊</h2>
        </div>

        <!-- Email（唯讀）-->
        <div class="px-5 py-4 flex items-center gap-3 border-b border-food-border">
          <span class="text-xl shrink-0">📧</span>
          <div class="flex-1 min-w-0">
            <p class="text-xs text-food-muted mb-0.5">信箱</p>
            <p class="text-sm text-food-brown truncate">{{ user?.email ?? '—' }}</p>
          </div>
          <span class="text-food-border text-lg shrink-0 select-none" title="信箱無法修改">🔒</span>
        </div>

        <!-- 暱稱（可編輯）-->
        <div class="px-5 py-4">
          <div v-if="!editingUsername" class="flex items-center gap-3">
            <span class="text-xl shrink-0">👤</span>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-food-muted mb-0.5">暱稱</p>
              <p class="text-sm text-food-brown">{{ user?.username ?? '—' }}</p>
            </div>
            <button @click="startEditUsername"
              class="p-2 rounded-lg text-food-muted hover:text-food-caramel hover:bg-food-beige transition"
              title="編輯暱稱">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
              </svg>
            </button>
          </div>

          <div v-else class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="text-xl shrink-0">👤</span>
              <input v-model="newUsername" type="text" maxlength="20" placeholder="輸入新暱稱"
                class="flex-1 px-3 py-2 rounded-xl bg-food-input border border-food-border text-food-brown text-sm focus:outline-none focus:border-food-caramel transition" />
            </div>
            <p v-if="usernameError"   class="text-food-red text-xs pl-9">{{ usernameError }}</p>
            <p v-if="usernameSuccess" class="text-green-600 text-xs pl-9">{{ usernameSuccess }}</p>
            <div class="flex gap-2 pl-9">
              <button @click="saveUsername" :disabled="usernameLoading"
                class="px-4 py-1.5 rounded-lg bg-food-caramel text-white text-xs font-bold hover:bg-food-orange disabled:opacity-50 transition active:scale-95 flex items-center gap-1.5">
                <svg v-if="usernameLoading" class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                儲存
              </button>
              <button @click="cancelEditUsername"
                class="px-4 py-1.5 rounded-lg bg-food-beige text-food-muted text-xs font-bold hover:text-food-brown transition active:scale-95">
                取消
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── 安全設定 ── -->
      <div class="bg-food-surface rounded-2xl overflow-hidden shadow-sm">
        <div class="px-5 py-3 border-b border-food-border">
          <h2 class="text-xs font-bold text-food-muted tracking-wider uppercase">安全設定</h2>
        </div>

        <div class="px-5 py-4">
          <div v-if="!editingPassword" class="flex items-center gap-3">
            <span class="text-xl shrink-0">🔐</span>
            <div class="flex-1">
              <p class="text-xs text-food-muted mb-0.5">密碼</p>
              <p class="text-sm text-food-brown tracking-widest">••••••••</p>
            </div>
            <button @click="editingPassword = true"
              class="p-2 rounded-lg text-food-muted hover:text-food-caramel hover:bg-food-beige transition"
              title="變更密碼">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
              </svg>
            </button>
          </div>

          <div v-else class="space-y-3">
            <div class="flex items-center gap-2">
              <span class="text-xl shrink-0">🔐</span>
              <p class="text-sm font-bold text-food-brown">變更密碼</p>
            </div>
            <div class="space-y-2 pl-9">
              <input v-model="oldPwd" type="password" placeholder="舊密碼" autocomplete="current-password"
                class="w-full px-3 py-2.5 rounded-xl bg-food-input border border-food-border text-food-brown text-sm focus:outline-none focus:border-food-caramel transition" />
              <input v-model="newPwd" type="password" placeholder="新密碼（至少 6 字元）" autocomplete="new-password"
                class="w-full px-3 py-2.5 rounded-xl bg-food-input border border-food-border text-food-brown text-sm focus:outline-none focus:border-food-caramel transition" />
              <input v-model="confirmPwd" type="password" placeholder="確認新密碼" autocomplete="new-password"
                class="w-full px-3 py-2.5 rounded-xl bg-food-input border border-food-border text-food-brown text-sm focus:outline-none focus:border-food-caramel transition" />
            </div>
            <p v-if="passwordError"   class="text-food-red text-xs pl-9">{{ passwordError }}</p>
            <p v-if="passwordSuccess" class="text-green-600 text-xs pl-9">{{ passwordSuccess }}</p>
            <div class="flex gap-2 pl-9">
              <button @click="savePassword" :disabled="passwordLoading"
                class="px-4 py-1.5 rounded-lg bg-food-caramel text-white text-xs font-bold hover:bg-food-orange disabled:opacity-50 transition active:scale-95 flex items-center gap-1.5">
                <svg v-if="passwordLoading" class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                儲存
              </button>
              <button @click="cancelEditPassword"
                class="px-4 py-1.5 rounded-lg bg-food-beige text-food-muted text-xs font-bold hover:text-food-brown transition active:scale-95">
                取消
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── 聯絡作者 ── -->
      <div class="bg-food-surface rounded-2xl overflow-hidden shadow-sm">
        <div class="px-5 py-3 border-b border-food-border">
          <h2 class="text-xs font-bold text-food-muted tracking-wider uppercase">聯絡作者</h2>
        </div>
        <div class="px-5 py-5 space-y-3.5">
          <p class="text-xs text-food-muted leading-relaxed">
            有新功能建議、發現問題，或看到濫用標記？歡迎直接寄信給作者！
          </p>

          <div class="flex items-center gap-2 bg-food-beige rounded-xl px-3.5 py-2.5">
            <span class="text-base shrink-0 select-none">📧</span>
            <span class="text-sm font-mono text-food-brown flex-1 truncate">{{ AUTHOR_EMAIL }}</span>
            <button @click="copyAuthorEmail"
              class="text-xs font-bold shrink-0 transition"
              :class="emailCopied ? 'text-green-600' : 'text-food-caramel hover:text-food-orange'">
              {{ emailCopied ? '✅ 已複製' : '複製' }}
            </button>
          </div>

          <a :href="feedbackMailto"
            class="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-food-caramel text-white font-bold text-sm hover:bg-food-orange transition active:scale-95">
            ✉️ 傳送意見給作者
          </a>

          <p class="text-[10px] text-food-muted text-center leading-relaxed">
            請在信中說明問題類型（建議 ／ 問題 ／ 濫用舉報）及詳細描述，作者將盡快回覆。
          </p>
        </div>
      </div>

      <!-- ── 後台管理 (admin only) ── -->
      <div v-if="user?.role === 'admin'" class="bg-gray-800 rounded-2xl overflow-hidden shadow-sm">
        <div class="px-5 py-3 border-b border-gray-700">
          <h2 class="text-xs font-bold text-gray-400 tracking-wider uppercase">管理員</h2>
        </div>
        <div class="px-5 py-4">
          <NuxtLink to="/admin"
                    class="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gray-700 text-white font-bold text-sm hover:bg-gray-600 transition active:scale-95">
            ⚙️ 後台管理系統
          </NuxtLink>
        </div>
      </div>

    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: 'auth' })
useHead({ title: '個人資料 — 波吉的美食地圖' })

interface UserProfile {
  id: string
  email: string
  username: string
  avatar_url: string | null
  user_level: number
  xp: number
  role?: string
}

// XP to reach level N (same formula as server/utils/xp.ts)
function xpForLevel(level: number): number {
  if (level <= 1) return 0
  let total = 0, increment = 100
  for (let l = 1; l < level; l++) { total += increment; increment += 50 }
  return total
}

const token = useCookie('auth_token')

const { data: meData } = await useFetch('/api/auth/me', {
  headers: { Authorization: `Bearer ${token.value ?? ''}` },
})
const user = ref<UserProfile | null>((meData.value?.user as UserProfile) ?? null)

// XP progress within current level
const currentLevelXp = computed(() => {
  if (!user.value) return 0
  return user.value.xp - xpForLevel(user.value.user_level)
})
const nextLevelXp = computed(() => {
  if (!user.value) return 100
  return xpForLevel(user.value.user_level + 1) - xpForLevel(user.value.user_level)
})
const xpProgress = computed(() =>
  Math.min(100, Math.round((currentLevelXp.value / nextLevelXp.value) * 100))
)

// ── 預設頭像 ───────────────────────────────────────────────────
const PRESET_PAGES = [
  {
    label: '趣味表情',
    presets: [
      { id: 'e1', label: '開心',     url: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Loki' },
      { id: 'e2', label: '酷酷',     url: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Salem' },
      { id: 'e3', label: '呆萌',     url: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Pepper' },
      { id: 'e4', label: '俏皮',     url: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Snuggles' },
      { id: 'e5', label: '搞怪',     url: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Whiskers' },
      { id: 'e6', label: '微笑',     url: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Cleo' },
      { id: 'e7', label: '淡定',     url: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Mochi' },
      { id: 'e8', label: '驚訝',     url: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Bubbles' },
    ],
  },
  {
    label: '機器人',
    presets: [
      { id: 'b1', label: '鐵甲A',    url: 'https://api.dicebear.com/9.x/bottts/svg?seed=R2D2' },
      { id: 'b2', label: '鐵甲B',    url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Zeta' },
      { id: 'b3', label: '鐵甲C',    url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Nova' },
      { id: 'b4', label: '鐵甲D',    url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Orion' },
      { id: 'b5', label: '鐵甲E',    url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Titan' },
      { id: 'b6', label: '鐵甲F',    url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Cosmo' },
      { id: 'b7', label: '鐵甲G',    url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Atlas' },
      { id: 'b8', label: '鐵甲H',    url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Nexus' },
    ],
  },
  {
    label: '像素風格',
    presets: [
      { id: 'p1', label: '勇者',     url: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Hero' },
      { id: 'p2', label: '騎士',     url: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Knight' },
      { id: 'p3', label: '法師',     url: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Wizard' },
      { id: 'p4', label: '遊俠',     url: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Ranger' },
      { id: 'p5', label: '魔法師',   url: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Mage' },
      { id: 'p6', label: '盜賊',     url: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Rogue' },
      { id: 'p7', label: '聖騎士',   url: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Paladin' },
      { id: 'p8', label: '吟遊詩人', url: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Bard' },
    ],
  },
] as const

const presetPage       = ref(0)
const pendingPresetUrl = ref<string | null>(null)
const presetSaving     = ref(false)

function selectPreset(url: string): void {
  pendingPresetUrl.value = pendingPresetUrl.value === url ? null : url
  if (pendingPresetUrl.value && avatarFile.value) cancelAvatarUpload()
}

function cancelPreset(): void {
  pendingPresetUrl.value = null
}

async function savePreset(): Promise<void> {
  if (!pendingPresetUrl.value || presetSaving.value) return
  presetSaving.value = true
  avatarError.value = ''; avatarSuccess.value = ''
  try {
    const res = await $fetch<{ avatar_url: string }>('/api/profile/avatar-preset', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token.value ?? ''}` },
      body: { avatar_url: pendingPresetUrl.value },
    })
    if (user.value) user.value.avatar_url = res.avatar_url
    pendingPresetUrl.value = null
    avatarSuccess.value = '✅ 頭像已更新！'
    setTimeout(() => { avatarSuccess.value = '' }, 2000)
  } catch (err: any) {
    avatarError.value = err.data?.statusMessage ?? '套用失敗，請稍後再試'
  } finally {
    presetSaving.value = false
  }
}

// ── 頭像 ──────────────────────────────────────────────────────
const fileInput      = ref<HTMLInputElement | null>(null)
const avatarPreview  = ref<string | null>(null)
const avatarFile     = ref<File | null>(null)
const avatarUploading = ref(false)
const avatarError    = ref('')
const avatarSuccess  = ref('')

onUnmounted(() => { if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value) })

function triggerFileUpload() {
  if (avatarUploading.value) return
  fileInput.value?.click()
}

function handleAvatarSelect(e: Event) {
  avatarError.value = ''; avatarSuccess.value = ''
  const input = e.target as HTMLInputElement
  const file  = input.files?.[0]
  if (!file) return

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    avatarError.value = '只接受 JPG、PNG、WebP 格式'
    input.value = ''
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    avatarError.value = '圖片大小不能超過 2 MB'
    input.value = ''
    return
  }
  if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value)
  avatarFile.value    = file
  avatarPreview.value = URL.createObjectURL(file)
  pendingPresetUrl.value = null
}

function cancelAvatarUpload() {
  if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value)
  avatarFile.value = null; avatarPreview.value = null; avatarError.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

async function uploadAvatar() {
  if (!avatarFile.value || avatarUploading.value) return
  avatarUploading.value = true; avatarError.value = ''; avatarSuccess.value = ''

  try {
    const form = new FormData()
    form.append('avatar', avatarFile.value)

    const res = await $fetch<{ avatar_url: string }>('/api/profile/avatar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value ?? ''}` },
      body: form,
    })
    if (user.value) user.value.avatar_url = res.avatar_url
    avatarPreview.value = null
    avatarFile.value    = null
    if (fileInput.value) fileInput.value.value = ''
    avatarSuccess.value = '✅ 頭像已更新！'
  } catch (err: any) {
    avatarError.value = err.data?.statusMessage ?? '上傳失敗，請稍後再試'
  } finally {
    avatarUploading.value = false
  }
}

// ── 暱稱 ──────────────────────────────────────────────────────
const editingUsername = ref(false)
const newUsername     = ref('')
const usernameLoading = ref(false)
const usernameError   = ref('')
const usernameSuccess = ref('')

function startEditUsername() {
  newUsername.value     = user.value?.username ?? ''
  editingUsername.value = true
  usernameError.value   = ''; usernameSuccess.value = ''
}

function cancelEditUsername() {
  editingUsername.value = false
  usernameError.value   = ''; usernameSuccess.value = ''
}

async function saveUsername() {
  if (usernameLoading.value) return
  usernameError.value = ''; usernameSuccess.value = ''

  const trimmed = newUsername.value.trim()
  if (!trimmed)             { usernameError.value = '暱稱不能為空'; return }
  if (trimmed.length > 20)  { usernameError.value = '暱稱不能超過 20 個字元'; return }
  if (trimmed === user.value?.username) { cancelEditUsername(); return }

  usernameLoading.value = true
  try {
    const res = await $fetch<{ username: string }>('/api/profile/update', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token.value ?? ''}` },
      body: { username: trimmed },
    })
    if (user.value) user.value.username = res.username
    usernameSuccess.value = '✅ 暱稱已更新！'
    setTimeout(() => { editingUsername.value = false; usernameSuccess.value = '' }, 1500)
  } catch (err: any) {
    usernameError.value = err.data?.statusMessage ?? '更新失敗，請稍後再試'
  } finally {
    usernameLoading.value = false
  }
}

// ── 聯絡作者 ─────────────────────────────────────────────────
const AUTHOR_EMAIL = 'z0925955648@gmail.com'
const emailCopied  = ref(false)

const feedbackMailto = computed(() => {
  const subject = encodeURIComponent('波吉的美食地圖 - 意見反饋')
  const body = encodeURIComponent(
    [
      '您好，',
      '',
      '【問題類型】（請填：新增建議 / 問題回報 / 濫用舉報 / 其他）：',
      '',
      '【詳細描述】：',
      '',
      `【我的電子郵件】：${user.value?.email ?? ''}`,
      '',
      '謝謝！',
    ].join('\n')
  )
  return `mailto:${AUTHOR_EMAIL}?subject=${subject}&body=${body}`
})

async function copyAuthorEmail() {
  try {
    await navigator.clipboard.writeText(AUTHOR_EMAIL)
    emailCopied.value = true
    setTimeout(() => { emailCopied.value = false }, 2000)
  } catch {}
}

// ── 密碼 ──────────────────────────────────────────────────────
const editingPassword = ref(false)
const oldPwd          = ref('')
const newPwd          = ref('')
const confirmPwd      = ref('')
const passwordLoading = ref(false)
const passwordError   = ref('')
const passwordSuccess = ref('')

function cancelEditPassword() {
  editingPassword.value = false
  oldPwd.value = ''; newPwd.value = ''; confirmPwd.value = ''
  passwordError.value = ''; passwordSuccess.value = ''
}

async function savePassword() {
  if (passwordLoading.value) return
  passwordError.value = ''; passwordSuccess.value = ''

  if (!oldPwd.value)            { passwordError.value = '請輸入舊密碼'; return }
  if (!newPwd.value)            { passwordError.value = '請輸入新密碼'; return }
  if (newPwd.value.length < 6)  { passwordError.value = '新密碼至少需要 6 個字元'; return }
  if (newPwd.value !== confirmPwd.value) { passwordError.value = '兩次輸入的密碼不一致'; return }

  passwordLoading.value = true
  try {
    await $fetch('/api/profile/change-password', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value ?? ''}` },
      body: { oldPassword: oldPwd.value, newPassword: newPwd.value },
    })
    passwordSuccess.value = '✅ 密碼已更新！'
    setTimeout(() => cancelEditPassword(), 1500)
  } catch (err: any) {
    passwordError.value = err.data?.statusMessage ?? '更新失敗，請稍後再試'
  } finally {
    passwordLoading.value = false
  }
}
</script>
