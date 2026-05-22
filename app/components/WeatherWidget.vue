<template>
  <div
    v-if="loading || weather"
    class="bg-food-surface/90 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2 shadow-md border border-food-border pointer-events-none select-none min-h-[42px]"
  >
    <div v-if="loading" class="dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
    <template v-else-if="weather">
      <span class="text-2xl leading-none">{{ weather.emoji }}</span>
      <div class="leading-tight">
        <div class="font-bold text-food-brown text-sm">{{ weather.temp }}°C</div>
        <div class="flex items-center gap-1.5 text-xs text-food-muted">
          <span>{{ weather.desc }}</span>
          <span class="text-food-border">·</span>
          <span>💧{{ weather.precipProb }}%</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
interface WeatherData {
  temp: number
  emoji: string
  desc: string
  precip: number
  windSpeed: number
  precipProb: number
}

const props = defineProps<{ lat: number; lng: number }>()

const weather = ref<WeatherData | null>(null)
const loading = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

async function fetchWeather(): Promise<void> {
  try {
    weather.value = await $fetch<WeatherData>('/api/weather/current', {
      query: { lat: props.lat, lng: props.lng },
    })
  } catch { /* 靜默失敗，不影響地圖使用 */ }
  finally {
    loading.value = false
  }
}

watch(() => [props.lat, props.lng], () => {
  loading.value = true
  if (timer) clearTimeout(timer)
  timer = setTimeout(fetchWeather, 2000)
}, { immediate: true })

onUnmounted(() => { if (timer) clearTimeout(timer) })
</script>

<style scoped>
.dots {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 2px;
}

.dots span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--color-food-caramel, #b45309);
  animation: dot-bounce 0.6s infinite alternate ease-in-out;
}

.dots span:nth-child(1) { animation-delay: 0s; }
.dots span:nth-child(2) { animation-delay: 0.2s; }
.dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-bounce {
  from { transform: scale(1);   opacity: 1; }
  to   { transform: scale(1.6); opacity: 0.4; }
}
</style>
