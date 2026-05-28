<template>
  <nav class="flex gap-1 bg-gray-100 rounded-xl p-1">
    <NuxtLink
      v-for="item in NAV"
      :key="item.to"
      :to="item.to"
      class="flex-1 py-2 px-3 rounded-lg text-sm font-bold transition text-center"
      :class="isActive(item.to)
        ? 'bg-white text-gray-800 shadow-sm'
        : 'text-gray-500 hover:text-gray-800 hover:bg-white/60'"
    >
      {{ item.label }}
      <span v-if="item.badge" class="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-black"
        :class="isActive(item.to) ? 'bg-gray-800 text-white' : 'bg-orange-100 text-orange-600'">
        {{ item.badge }}
      </span>
    </NuxtLink>
  </nav>
</template>

<script lang="ts" setup>
const props = defineProps<{
  pendingSpot?:    number
  pendingComment?: number
}>()

const route = useRoute()

const NAV = computed(() => [
  {
    to:    '/admin',
    label: '📋 回報管理',
    badge: (props.pendingSpot ?? 0) + (props.pendingComment ?? 0) || 0,
  },
  {
    to:    '/admin/bot',
    label: '🤖 AI 問答',
    badge: 0,
  },
])

function isActive(to: string) {
  return route.path === to
}
</script>
