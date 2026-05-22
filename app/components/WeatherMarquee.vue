<template>
  <div
    v-if="data"
    class="overflow-hidden flex w-full"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
  >
    <div class="marquee-item" :class="{ paused }">
      <span>{{ data.zh }}</span>
      <span class="sep">·</span>
      <span class="en">{{ data.en }}</span>
    </div>
    <div class="marquee-item" :class="{ paused }" aria-hidden="true">
      <span>{{ data.zh }}</span>
      <span class="sep">·</span>
      <span class="en">{{ data.en }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
const paused = ref(false)
const { data, load } = useWeatherForecast()
onMounted(load)
</script>

<style scoped>
.marquee-item {
  min-width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  font-size: 0.75rem;
  color: var(--color-food-muted, #9ca3af);
  flex-shrink: 0;
  animation: marquee-infinite 30s linear infinite;
}

.marquee-item.paused {
  animation-play-state: paused;
}

.marquee-item .sep {
  color: var(--color-food-border, #d1d5db);
  padding: 0 0.25rem;
}

.marquee-item .en {
  opacity: 0.75;
  color: #b45309;
}

@keyframes marquee-infinite {
  from { transform: translateX(0); }
  to   { transform: translateX(-100%); }
}
</style>
