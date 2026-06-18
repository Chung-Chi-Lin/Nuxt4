<template>
  <el-dialog
    v-model="dialogVisible"
    width="400px"
    align-center
    @closed="emit('close')"
  >
    <!-- 自訂標題區：主標 + 地點名稱副標 -->
    <template #header>
      <span class="font-bold text-base">✏️ 評論</span>
      <p class="text-xs text-[--el-text-color-secondary] mt-0.5 truncate">{{ spotName }}</p>
    </template>

    <!-- 成功狀態 -->
    <el-result v-if="done" icon="success" title="評論已送出！" />

    <!-- 評論表單 -->
    <el-form v-else ref="formRef" :model="form" :rules="rules">
      <el-form-item prop="content">
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="4"
          maxlength="300"
          show-word-limit
          resize="none"
          placeholder="分享你對這個地點的看法…"
        />
      </el-form-item>
    </el-form>

    <!-- 底部按鈕 -->
    <template #footer>
      <el-button v-if="done" type="primary" @click="dialogVisible = false">關閉</el-button>
      <template v-else>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="submit">送出評論</el-button>
      </template>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import type { SpotComment } from '~/types'

const props = defineProps<{ spotId: string; spotName: string; token: string }>()
const emit  = defineEmits<{ close: []; saved: [comment: SpotComment] }>()
const msg   = useMessage()
const { authFetch } = useAuthFetch(computed(() => props.token))

// 掛載時立即開啟；關閉動畫結束後 @closed 觸發 emit('close')，父層 v-if 卸載元件
const dialogVisible = ref(true)

const formRef = ref<FormInstance>()
const form    = reactive({ content: '' })
const loading = ref(false)
const done    = ref(false)

const rules: FormRules = {
  content: [{ required: true, message: '請輸入評論內容', trigger: 'blur' }],
}

async function submit(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid || loading.value) return
  loading.value = true
  try {
    const { comment } = await authFetch<{ comment: SpotComment }>(
      `/api/spots/${props.spotId}/comments`,
      {
        method: 'POST',
        body: { content: form.content },
      }
    )
    done.value = true
    emit('saved', comment)
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    msg.error(e.data?.statusMessage ?? '送出失敗，請稍後再試')
  } finally {
    loading.value = false
  }
}
</script>
