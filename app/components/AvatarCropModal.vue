<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0 bg-black/70 backdrop-blur-sm">
      <div class="relative bg-food-surface rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">

        <!-- Header -->
        <div class="px-5 py-4 border-b border-food-border flex items-center justify-between shrink-0">
          <div>
            <h3 class="font-bold text-food-brown">✂️ 裁切頭像</h3>
            <p class="text-[11px] text-food-muted mt-0.5">拖曳移動圖片，滾輪或滑桿縮放</p>
          </div>
          <button @click="emit('cancel')" aria-label="關閉"
            class="w-7 h-7 rounded-full flex items-center justify-center text-food-muted hover:bg-food-beige hover:text-food-brown transition text-sm font-bold shrink-0">✕</button>
        </div>

        <!-- Crop viewport -->
        <div class="bg-gray-950 shrink-0 relative overflow-hidden" style="height: 300px;">
          <img ref="imgEl" :src="imageSrc" alt="" class="block max-w-full" />
        </div>

        <!-- Zoom slider -->
        <div class="flex items-center gap-3 px-5 py-3 border-t border-food-border">
          <span class="text-xs text-food-muted shrink-0">縮放</span>
          <button @click="doZoom(-0.1)" aria-label="縮小"
            class="w-7 h-7 shrink-0 rounded-full border border-food-border flex items-center justify-center text-food-brown hover:bg-food-beige transition font-bold text-base leading-none">−</button>
          <input
            type="range"
            v-model.number="sliderVal"
            :min="minZoom"
            :max="maxZoom"
            :step="0.005"
            @input="applySlider"
            class="flex-1 cursor-pointer accent-amber-600"
          />
          <button @click="doZoom(0.1)" aria-label="放大"
            class="w-7 h-7 shrink-0 rounded-full border border-food-border flex items-center justify-center text-food-brown hover:bg-food-beige transition font-bold text-base leading-none">+</button>
        </div>

        <!-- Actions -->
        <div class="px-5 pb-5 flex gap-3">
          <button @click="emit('cancel')"
            class="flex-1 py-2.5 rounded-xl border border-food-border text-food-muted text-sm font-bold hover:bg-food-beige transition active:scale-95">
            取消
          </button>
          <button @click="confirmCrop" :disabled="!isReady"
            class="flex-1 py-2.5 rounded-xl bg-food-caramel text-white text-sm font-bold hover:bg-food-orange disabled:opacity-50 transition active:scale-95 flex items-center justify-center gap-2">
            <svg v-if="!isReady" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            {{ isReady ? '確認裁切' : '載入中…' }}
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
const props = defineProps<{ imageSrc: string }>()
const emit  = defineEmits<{ confirm: [file: File]; cancel: [] }>()

const imgEl    = ref<HTMLImageElement | null>(null)
const isReady  = ref(false)
const minZoom  = ref(0.01)
const maxZoom  = ref(3)
const sliderVal = ref(0.5)

let cropper: any = null

// v1 正確取得當前 zoom ratio 的方式
function getCurrentRatio(): number {
  if (!cropper) return sliderVal.value
  const canvas = cropper.getCanvasData()
  return canvas.width / canvas.naturalWidth
}

onMounted(async () => {
  if (!imgEl.value) return
  const { default: Cropper } = await import('cropperjs')

  cropper = new Cropper(imgEl.value, {
    aspectRatio: 1,
    viewMode: 1,       // 圖片不能小於 crop box
    dragMode: 'move',  // 拖曳移動圖片
    cropBoxMovable: false,
    cropBoxResizable: false,
    toggleDragModeOnDblclick: false,
    autoCropArea: 0.85,
    background: false,
    ready() {
      isReady.value = true
      // 用 getCanvasData() 計算初始 ratio，v1 沒有直接的 ratio 欄位
      const initRatio = getCurrentRatio()
      minZoom.value   = initRatio * 0.8
      maxZoom.value   = initRatio * 5
      sliderVal.value = initRatio
    },
    // zoom event 的 e.detail.ratio 才是即將套用的新 ratio
    zoom(e: any) {
      const next = e.detail.ratio as number
      sliderVal.value = Math.max(minZoom.value, Math.min(maxZoom.value, next))
    },
  })
})

onUnmounted(() => cropper?.destroy())

// zoom(delta): 相對縮放。0.1 = 放大10%，-0.1 = 縮小10%
function doZoom(delta: number) {
  cropper?.zoom(delta)
}

// zoomTo(ratio): 絕對縮放到指定 ratio（顯示寬/原始寬）
function applySlider() {
  cropper?.zoomTo(sliderVal.value)
}

async function confirmCrop() {
  if (!cropper || !isReady.value) return
  const canvas = cropper.getCroppedCanvas({ width: 400, height: 400, imageSmoothingQuality: 'high' })
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92))
  if (!blob) return
  emit('confirm', new File([blob], 'avatar.jpg', { type: 'image/jpeg' }))
}
</script>

<style>
/* 讓裁切框呈圓形，符合頭像外觀 */
.cropper-view-box,
.cropper-face {
  border-radius: 50%;
}
</style>
