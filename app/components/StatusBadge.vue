<template>
  <span
    class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide"
    :class="classes"
  >{{ label }}</span>
</template>

<script lang="ts" setup>
const props = defineProps<{ status: string }>()

const MAP: Record<string, { label: string; classes: string }> = {
  pending:   { label: '待審核', classes: 'bg-orange-100 text-orange-600' },
  resolved:  { label: '已解決', classes: 'bg-green-100 text-green-700' },
  dismissed: { label: '已駁回', classes: 'bg-gray-100 text-gray-500' },
}

const { label, classes } = MAP[props.status] ?? { label: props.status, classes: 'bg-gray-100 text-gray-500' }
</script>
