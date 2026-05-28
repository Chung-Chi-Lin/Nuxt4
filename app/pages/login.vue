<template>
  <div class="min-h-screen relative flex items-center justify-center px-4 py-8">
    <div class="absolute inset-0 bg-[url('/images/login-bg-small.png')] sm:bg-[url('/images/login-bg.png')] bg-cover bg-center"></div>
    <div class="absolute inset-0 bg-black/45"></div>

    <div class="relative z-10 w-full max-w-sm sm:max-w-md mb-50">

      <!-- Logo -->
      <div class="text-center mb-6 sm:mb-8">
        <div class="text-4xl sm:text-5xl mb-2 sm:mb-3">🗺️</div>
        <h1 class="text-2xl sm:text-3xl font-bold text-white mb-1" style="text-shadow: 0 2px 8px rgba(0,0,0,0.6)">波吉的美食地圖</h1>
        <p class="font-caveat text-white/90 text-base sm:text-lg" style="text-shadow: 0 1px 6px rgba(0,0,0,0.7)">Bojji's Tasty Trails</p>
      </div>

      <div class="bg-food-surface rounded-2xl sm:rounded-3xl shadow-2xl border border-food-border overflow-hidden">

        <!-- Tab toggle（忘記密碼時隱藏） -->
        <div v-if="mode !== 'forgot'" class="flex border-b border-food-border">
          <button
            :class="mode === 'login' ? 'bg-food-caramel text-white' : 'text-food-muted hover:text-food-brown'"
            class="flex-1 py-3.5 sm:py-4 text-sm font-bold transition"
            @click="mode = 'login'"
          >登入</button>
          <button
            :class="mode === 'register' ? 'bg-food-caramel text-white' : 'text-food-muted hover:text-food-brown'"
            class="flex-1 py-3.5 sm:py-4 text-sm font-bold transition"
            @click="mode = 'register'"
          >註冊</button>
        </div>

        <!-- 忘記密碼 header -->
        <div v-else class="flex items-center gap-2 px-4 py-3.5 border-b border-food-border">
          <button class="text-food-muted hover:text-food-brown transition text-sm" @click="mode = 'login'">←</button>
          <span class="text-sm font-bold text-food-brown">忘記密碼</span>
        </div>

        <div class="p-6 sm:p-8">

          <!-- Login form -->
          <form v-if="mode === 'login'" class="space-y-4" @submit.prevent="handleLogin">
            <div>
              <label class="block text-xs font-bold text-food-muted mb-1.5 tracking-wider uppercase">Email</label>
              <input v-model="form.email" type="email" inputmode="email" placeholder="your@email.com" autocomplete="email"
                class="w-full px-4 py-3 rounded-xl bg-food-input border border-food-border text-food-brown placeholder-food-border focus:outline-none focus:border-food-caramel transition text-base" />
            </div>
            <div>
              <label class="block text-xs font-bold text-food-muted mb-1.5 tracking-wider uppercase">密碼</label>
              <AppPasswordInput v-model="form.password" placeholder="••••••••" autocomplete="current-password" />
              <div class="flex items-center justify-between my-3">
                <label class="flex items-center gap-1.5 text-xs text-food-muted cursor-pointer select-none">
                  <input v-model="rememberEmail" type="checkbox" class="rounded" />
                  記住帳號
                </label>
                <button type="button" class="text-xs text-food-muted hover:text-food-caramel transition" @click="mode = 'forgot'">
                  忘記密碼？
                </button>
              </div>
            </div>
            <p v-if="errorMsg" class="text-food-red text-sm">{{ errorMsg }}</p>
            <button type="submit" :disabled="loading"
              class="w-full py-3.5 rounded-xl bg-food-caramel hover:bg-food-orange active:scale-95 disabled:opacity-50 text-white font-bold transition text-base flex items-center justify-center gap-2">
              <svg v-if="loading" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <span>{{ loading ? '登入中…' : '登入 🍜' }}</span>
            </button>
          </form>

          <!-- Register form -->
          <form v-else-if="mode === 'register'" class="space-y-4" @submit.prevent="handleRegister">
            <div>
              <label class="block text-xs font-bold text-food-muted mb-1.5 tracking-wider uppercase">暱稱</label>
              <input v-model="form.username" type="text" placeholder="你的食客名稱" autocomplete="nickname"
                class="w-full px-4 py-3 rounded-xl bg-food-input border border-food-border text-food-brown placeholder-food-border focus:outline-none focus:border-food-caramel transition text-base" />
            </div>
            <div>
              <label class="block text-xs font-bold text-food-muted mb-1.5 tracking-wider uppercase">Email</label>
              <input v-model="form.email" type="email" inputmode="email" placeholder="your@email.com" autocomplete="email"
                class="w-full px-4 py-3 rounded-xl bg-food-input border border-food-border text-food-brown placeholder-food-border focus:outline-none focus:border-food-caramel transition text-base" />
            </div>
            <div>
              <label class="block text-xs font-bold text-food-muted mb-1.5 tracking-wider uppercase">密碼（至少 6 字元）</label>
              <AppPasswordInput v-model="form.password" placeholder="••••••••" autocomplete="new-password" />
            </div>
            <p v-if="errorMsg" class="text-food-red text-sm">{{ errorMsg }}</p>
            <p v-if="successMsg" class="text-green-600 text-sm">{{ successMsg }}</p>
            <button type="submit" :disabled="loading"
              class="w-full py-3.5 rounded-xl bg-food-caramel hover:bg-food-orange active:scale-95 disabled:opacity-50 text-white font-bold transition text-base flex items-center justify-center gap-2">
              <svg v-if="loading" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <span>{{ loading ? '註冊中…' : '建立帳號 ✨' }}</span>
            </button>
          </form>

          <!-- Forgot password form -->
          <form v-else class="space-y-4" @submit.prevent="handleForgotPassword">
            <p class="text-xs text-food-muted">輸入你的 Email，我們會寄出重設密碼連結。</p>
            <div>
              <label class="block text-xs font-bold text-food-muted mb-1.5 tracking-wider uppercase">Email</label>
              <input v-model="forgotEmail" type="email" inputmode="email" placeholder="your@email.com" autocomplete="email"
                class="w-full px-4 py-3 rounded-xl bg-food-input border border-food-border text-food-brown placeholder-food-border focus:outline-none focus:border-food-caramel transition text-base" />
            </div>
            <p v-if="errorMsg"   class="text-food-red text-sm">{{ errorMsg }}</p>
            <p v-if="successMsg" class="text-green-600 text-sm">{{ successMsg }}</p>
            <button type="submit" :disabled="loading || forgotCooldown > 0"
              class="w-full py-3.5 rounded-xl bg-food-caramel hover:bg-food-orange active:scale-95 disabled:opacity-50 text-white font-bold transition text-base flex items-center justify-center gap-2">
              <svg v-if="loading" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <span>{{ loading ? '寄送中…' : forgotCooldown > 0 ? `${forgotCooldown}s 後可重新寄送` : '寄出重設連結 📬' }}</span>
            </button>
          </form>

        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { LoginResponse, RegisterResponse } from '~/types'

definePageMeta({ middleware: 'guest' })
useHead({ title: '波吉的美食地圖' })

type Mode = 'login' | 'register' | 'forgot'

const router    = useRouter()
const token     = useCookie('auth_token', { maxAge: 3600 })
const sessionId = useCookie('session_id', { maxAge: 3600 })

const mode           = ref<Mode>('login')
const loading        = ref(false)
const errorMsg       = ref('')
const successMsg     = ref('')
const form           = reactive({ email: '', password: '', username: '' })
const forgotEmail    = ref('')
const forgotCooldown = ref(0)
const rememberEmail  = ref(false)
let cooldownTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  const saved = localStorage.getItem('remember_email')
  if (saved) {
    form.email = saved
    rememberEmail.value = true
  }
})

watch(mode, () => { errorMsg.value = ''; successMsg.value = '' })

onUnmounted(() => { if (cooldownTimer) clearInterval(cooldownTimer) })

function startCooldown(seconds = 60): void {
  forgotCooldown.value = seconds
  cooldownTimer = setInterval(() => {
    forgotCooldown.value--
    if (forgotCooldown.value <= 0) {
      clearInterval(cooldownTimer!)
      cooldownTimer = null
    }
  }, 1000)
}

async function handleLogin(): Promise<void> {
  if (loading.value) return
  errorMsg.value = ''

  if (!form.email.trim())    { errorMsg.value = '請輸入 Email'; return }
  if (!form.password.trim()) { errorMsg.value = '請輸入密碼'; return }

  loading.value = true
  try {
    const data = await $fetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: { email: form.email.trim(), password: form.password },
    })
    token.value     = data.token
    sessionId.value = data.sessionToken
    if (rememberEmail.value) {
      localStorage.setItem('remember_email', form.email.trim())
    } else {
      localStorage.removeItem('remember_email')
    }
    await router.push('/map')
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    errorMsg.value = e.data?.statusMessage ?? '登入失敗，請稍後再試'
    loading.value = false
  }
}

async function handleRegister(): Promise<void> {
  if (loading.value) return
  errorMsg.value = ''; successMsg.value = ''

  if (!form.email.trim())        { errorMsg.value = '請輸入 Email'; return }
  if (!form.password)            { errorMsg.value = '請輸入密碼'; return }
  if (form.password.length < 6)  { errorMsg.value = '密碼至少需要 6 個字元'; return }

  loading.value = true
  try {
    const data = await $fetch<RegisterResponse>('/api/auth/register', {
      method: 'POST',
      body: { email: form.email.trim(), password: form.password, username: form.username.trim() },
    })
    if (data.requiresConfirmation) {
      successMsg.value = '📬 驗證信已寄出，請到信箱點擊確認連結後再登入！'
    } else if (data.token) {
      token.value     = data.token
      sessionId.value = data.sessionToken ?? null
      await router.push('/map')
    }
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    errorMsg.value = e.data?.statusMessage ?? '註冊失敗，請稍後再試'
  } finally {
    loading.value = false
  }
}

async function handleForgotPassword(): Promise<void> {
  if (loading.value || forgotCooldown.value > 0) return
  errorMsg.value = ''; successMsg.value = ''

  if (!forgotEmail.value.trim()) { errorMsg.value = '請輸入 Email'; return }

  loading.value = true
  try {
    await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: forgotEmail.value.trim() },
    })
    successMsg.value = '📬 重設連結已寄出，請到信箱點擊連結！'
    startCooldown(60)
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    errorMsg.value = e.data?.statusMessage ?? '寄送失敗，請稍後再試'
  } finally {
    loading.value = false
  }
}
</script>
