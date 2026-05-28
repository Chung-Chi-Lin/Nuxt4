<template>
  <Teleport to="body">
    <Transition
      enter-from-class="opacity-0 scale-95"
      leave-to-class="opacity-0 scale-95"
      enter-active-class="transition duration-200"
      leave-active-class="transition duration-150"
    >
      <div v-if="isExpired"
        class="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div class="bg-food-surface rounded-2xl shadow-2xl w-full max-w-sm px-6 py-8 text-center">

          <!-- Icon -->
          <div class="text-5xl mb-4 select-none">🔐</div>

          <!-- Title -->
          <h2 class="text-lg font-bold text-food-brown mb-1">登入已逾期</h2>
          <p class="text-xs text-food-muted mb-6 leading-relaxed">
            您的登入狀態已失效，請重新登入繼續使用。
          </p>

          <!-- Countdown ring -->
          <div class="flex items-center justify-center mb-3">
            <div class="relative w-20 h-20">
              <svg class="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9"
                  fill="none" stroke="#E8D9C0" stroke-width="2.5" />
                <circle cx="18" cy="18" r="15.9"
                  fill="none" stroke="#C8860A" stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-dasharray="100"
                  :stroke-dashoffset="100 - (countdown / 5) * 100"
                  style="transition: stroke-dashoffset 1s linear" />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-2xl font-bold text-food-caramel tabular-nums">{{ countdown }}</span>
              </div>
            </div>
          </div>

          <p class="text-[11px] text-food-muted mb-5">{{ countdown }} 秒後自動跳轉至登入頁</p>

          <!-- CTA -->
          <button @click="skipCountdown"
            class="w-full py-3 bg-food-caramel text-white font-bold rounded-xl hover:bg-food-orange transition active:scale-95 text-sm">
            立即前往登入
          </button>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
const { isExpired, countdown, skipCountdown } = useTokenExpiry()
</script>
