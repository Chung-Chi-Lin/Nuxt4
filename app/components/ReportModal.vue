<template>
  <el-dialog
    v-model="dialogVisible"
    title="回報標記"
    width="400px"
    align-center
    @closed="emit('close')"
  >
    <!-- 成功狀態 -->
    <el-result
      v-if="done"
      icon="success"
      title="回報已送出，謝謝！"
      sub-title="我們會盡快審核這個標記。"
    />

    <!-- 回報表單 -->
    <el-form v-else ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="回報原因" prop="reason">
        <!-- el-select：下拉選單，placeholder 為未選狀態提示 -->
        <el-select v-model="form.reason" placeholder="請選擇原因…" class="w-full">
          <el-option label="店家已暫停或停止營業" value="closed" />
          <el-option label="資訊錯誤（位置、名稱等）" value="wrong_info" />
          <el-option label="無意義或垃圾標記" value="spam" />
          <el-option label="與其他標記重複" value="duplicate" />
          <el-option label="不當內容" value="inappropriate" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>

      <el-form-item label="補充說明（選填）">
        <el-input
          v-model="form.note"
          type="textarea"
          :rows="3"
          maxlength="300"
          show-word-limit
          resize="none"
          placeholder="描述問題，例如：地址有誤、已於 2025 年歇業…"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button v-if="done" type="primary" @click="dialogVisible = false">關閉</el-button>
      <template v-else>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="submit">送出回報</el-button>
      </template>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'

const props = defineProps<{ spotId: string; token: string }>()
const emit  = defineEmits<{ close: [] }>()
const msg   = useMessage()
const { authFetch } = useAuthFetch(computed(() => props.token))

const dialogVisible = ref(true)
const formRef = ref<FormInstance>()
const form    = reactive({ reason: '', note: '' })
const loading = ref(false)
const done    = ref(false)

const rules: FormRules = {
  reason: [{ required: true, message: '請選擇回報原因', trigger: 'change' }],
}

async function submit(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid || loading.value) return
  loading.value = true
  try {
    await authFetch('/api/reports', {
      method: 'POST',
      body: { spotId: props.spotId, reason: form.reason, note: form.note },
    })
    done.value = true
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    msg.error(e.data?.statusMessage ?? '送出失敗，請稍後再試')
  } finally {
    loading.value = false
  }
}
</script>
