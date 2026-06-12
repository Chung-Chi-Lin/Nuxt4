<template>
  <div class="min-h-screen relative flex items-center justify-center px-4 py-8">
    <div class="absolute inset-0 bg-[url('/images/login-bg-small.png')] sm:bg-[url('/images/login-bg.png')] bg-cover bg-center" />
    <div class="absolute inset-0 bg-black/45" />

    <div class="relative z-10 w-full max-w-sm sm:max-w-md mb-50">

      <!-- Logo -->
      <div class="text-center mb-6 sm:mb-8">
        <div class="text-4xl sm:text-5xl mb-2 sm:mb-3">🗺️</div>
        <h1 class="text-2xl sm:text-3xl font-bold text-white mb-1" style="text-shadow: 0 2px 8px rgba(0,0,0,0.6)">波吉的美食地圖</h1>
        <p class="font-caveat text-white/90 text-base sm:text-lg" style="text-shadow: 0 1px 6px rgba(0,0,0,0.7)">Bojji's Tasty Trails</p>
      </div>

      <div class="bg-food-surface rounded-2xl sm:rounded-3xl shadow-2xl border border-food-border overflow-hidden">

        <!-- 忘記密碼模式 header -->
        <div v-if="mode === 'forgot'" class="flex items-center gap-2 px-4 py-3.5 border-b border-food-border">
          <button class="text-food-muted hover:text-food-brown transition text-sm" @click="mode = 'login'">←</button>
          <span class="text-sm font-bold text-food-brown">忘記密碼</span>
        </div>

        <!--
          el-tabs：v-model 綁定 mode，點擊 tab 自動更新 mode 值
          tab-pane 的 name 對應 v-model 的值
          內容放在 el-tab-pane 裡才是標準用法
        -->
        <el-tabs v-else v-model="mode" class="login-tabs">

          <!-- 登入 tab -->
          <el-tab-pane label="登入" name="login">
            <div class="p-6 sm:p-8">
              <!--
                el-form：
                  :model   → 綁定資料物件（驗證、resetFields 的依據）
                  :rules   → 驗證規則
                  ref      → 取得 formRef，用來呼叫 validate() / resetFields()
                  label-position="top" → label 在 input 上方
              -->
              <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" label-position="top" @submit.prevent="handleLogin">
                <el-form-item label="Email" prop="email">
                  <el-input
                    v-model="loginForm.email"
                    type="email"
                    inputmode="email"
                    placeholder="your@email.com"
                    autocomplete="email"
                    size="large"
                  />
                </el-form-item>

                <el-form-item label="密碼" prop="password">
                  <!-- show-password → 顯示密碼切換按鈕 -->
                  <el-input
                    v-model="loginForm.password"
                    type="password"
                    show-password
                    placeholder="••••••••"
                    autocomplete="current-password"
                    size="large"
                  />
                </el-form-item>

                <div class="flex items-center justify-between mb-5">
                  <el-checkbox v-model="rememberEmail">記住帳號</el-checkbox>
                  <!-- link 型按鈕：無邊框，像超連結 -->
                  <el-button link type="primary" @click="mode = 'forgot'">忘記密碼？</el-button>
                </div>

                <el-button type="primary" :loading="loading" size="large" style="width:100%" @click="handleLogin">
                  {{ loading ? '登入中…' : '登入 🍜' }}
                </el-button>
              </el-form>
            </div>
          </el-tab-pane>

          <!-- 註冊 tab -->
          <el-tab-pane label="註冊" name="register">
            <div class="p-6 sm:p-8">
              <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" label-position="top">
                <el-form-item label="暱稱" prop="username">
                  <el-input v-model="registerForm.username" placeholder="你的食客名稱" autocomplete="nickname" size="large" />
                </el-form-item>

                <el-form-item label="Email" prop="email">
                  <el-input v-model="registerForm.email" type="email" inputmode="email" placeholder="your@email.com" autocomplete="email" size="large" />
                </el-form-item>

                <el-form-item label="密碼（至少 6 字元）" prop="password">
                  <el-input v-model="registerForm.password" type="password" show-password placeholder="••••••••" autocomplete="new-password" size="large" />
                </el-form-item>

                <p v-if="successMsg" class="text-green-600 text-sm mb-4">{{ successMsg }}</p>

                <el-button type="primary" :loading="loading" size="large" style="width:100%" @click="handleRegister">
                  {{ loading ? '註冊中…' : '建立帳號 ✨' }}
                </el-button>
              </el-form>
            </div>
          </el-tab-pane>

        </el-tabs>

        <!-- 忘記密碼 form（mode === 'forgot'，tabs 被 v-else 隱藏） -->
        <div v-if="mode === 'forgot'" class="p-6 sm:p-8">
          <el-form ref="forgotFormRef" :model="forgotForm" :rules="forgotRules" label-position="top">
            <p class="text-xs text-food-muted mb-4">輸入你的 Email，我們會寄出重設密碼連結。</p>

            <el-form-item label="Email" prop="email">
              <el-input v-model="forgotForm.email" type="email" inputmode="email" placeholder="your@email.com" autocomplete="email" size="large" />
            </el-form-item>

            <p v-if="successMsg" class="text-green-600 text-sm mb-4">{{ successMsg }}</p>

            <el-button
              type="primary"
              :loading="loading"
              :disabled="forgotCooldown > 0"
              size="large"
              style="width:100%"
              @click="handleForgotPassword"
            >
              {{ loading ? '寄送中…' : forgotCooldown > 0 ? `${forgotCooldown}s 後可重新寄送` : '寄出重設連結 📬' }}
            </el-button>
          </el-form>
        </div>

      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import type { LoginResponse, RegisterResponse } from '~/types'

definePageMeta({ middleware: 'guest' })
useHead({ title: '波吉的美食地圖' })

type Mode = 'login' | 'register' | 'forgot'

const router    = useRouter()
const token     = useCookie('auth_token', { maxAge: 3600 })
const sessionId = useCookie('session_id', { maxAge: 3600 })

const mode        = ref<Mode>('login')
const loading     = ref(false)
const successMsg  = ref('')
const rememberEmail = ref(false)
let cooldownTimer: ReturnType<typeof setInterval> | null = null

// 各模式獨立的 form 物件 → 各自的 el-form ref 才能做 validate / resetFields
const loginForm    = reactive({ email: '', password: '' })
const registerForm = reactive({ email: '', password: '', username: '' })
const forgotForm   = reactive({ email: '' })

const loginFormRef    = ref<FormInstance>()
const registerFormRef = ref<FormInstance>()
const forgotFormRef   = ref<FormInstance>()

const forgotCooldown = ref(0)

// 驗證規則：type: 'email' 自動驗證 email 格式；min 驗證最小長度
const loginRules: FormRules = {
  email:    [{ required: true, type: 'email', message: '請輸入有效的 Email', trigger: 'blur' }],
  password: [{ required: true, message: '請輸入密碼', trigger: 'blur' }],
}
const registerRules: FormRules = {
  email:    [{ required: true, type: 'email', message: '請輸入有效的 Email', trigger: 'blur' }],
  password: [
    { required: true, message: '請輸入密碼', trigger: 'blur' },
    { min: 6, message: '密碼至少需要 6 個字元', trigger: 'blur' },
  ],
}
const forgotRules: FormRules = {
  email: [{ required: true, type: 'email', message: '請輸入有效的 Email', trigger: 'blur' }],
}

onMounted(() => {
  const saved = localStorage.getItem('remember_email')
  if (saved) { loginForm.email = saved; rememberEmail.value = true }
})

watch(mode, () => { successMsg.value = '' })
onUnmounted(() => { if (cooldownTimer) clearInterval(cooldownTimer) })

function startCooldown(seconds = 60): void {
  forgotCooldown.value = seconds
  cooldownTimer = setInterval(() => {
    forgotCooldown.value--
    if (forgotCooldown.value <= 0) { clearInterval(cooldownTimer!); cooldownTimer = null }
  }, 1000)
}

async function handleLogin(): Promise<void> {
  // validate() 回傳 Promise<boolean>，驗證失敗 reject → catch 回傳 false
  const valid = await loginFormRef.value?.validate().catch(() => false)
  if (!valid || loading.value) return
  loading.value = true
  try {
    const data = await $fetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: { email: loginForm.email.trim(), password: loginForm.password },
    })
    token.value     = data.token
    sessionId.value = data.sessionToken
    rememberEmail.value
      ? localStorage.setItem('remember_email', loginForm.email.trim())
      : localStorage.removeItem('remember_email')
    await router.push('/map')
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    ElMessage.error(e.data?.statusMessage ?? '登入失敗，請稍後再試')
    loading.value = false
  }
}

async function handleRegister(): Promise<void> {
  const valid = await registerFormRef.value?.validate().catch(() => false)
  if (!valid || loading.value) return
  loading.value = true
  successMsg.value = ''
  try {
    const data = await $fetch<RegisterResponse>('/api/auth/register', {
      method: 'POST',
      body: {
        email:    registerForm.email.trim(),
        password: registerForm.password,
        username: registerForm.username.trim(),
      },
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
    ElMessage.error(e.data?.statusMessage ?? '註冊失敗，請稍後再試')
  } finally {
    loading.value = false
  }
}

async function handleForgotPassword(): Promise<void> {
  const valid = await forgotFormRef.value?.validate().catch(() => false)
  if (!valid || loading.value || forgotCooldown.value > 0) return
  loading.value = true
  successMsg.value = ''
  try {
    await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: forgotForm.email.trim() },
    })
    successMsg.value = '📬 重設連結已寄出，請到信箱點擊連結！'
    startCooldown(60)
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    ElMessage.error(e.data?.statusMessage ?? '寄送失敗，請稍後再試')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 讓 el-tabs 標題列視覺與 food-caramel 設計對齊 */
:deep(.login-tabs .el-tabs__header) {
  margin-bottom: 0;
}
:deep(.login-tabs .el-tabs__nav-wrap::after) {
  @apply bg-food-border;
}
:deep(.login-tabs .el-tabs__nav) {
  width: 100%;
  display: flex;
  float: none;
  transform: none !important;
}
:deep(.login-tabs .el-tabs__item) {
  @apply text-food-muted font-bold text-sm;
  flex: 1;
  text-align: center;
  height: auto;
  line-height: 1;
  padding: 14px 0;
}
:deep(.login-tabs .el-tabs__item:hover) {
  @apply text-food-brown;
}
:deep(.login-tabs .el-tabs__item.is-active) {
  @apply bg-food-caramel text-white;
}
:deep(.login-tabs .el-tabs__active-bar) {
  display: none;
}
:deep(.login-tabs .el-tabs__content) {
  padding: 0;
}
</style>
