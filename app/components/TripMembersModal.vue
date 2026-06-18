<template>
  <div class="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')" />
    <div class="relative bg-food-surface rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
      <div class="px-5 py-4 border-b border-food-border flex items-center justify-between">
        <h3 class="font-bold text-food-brown text-sm">👥 旅程成員</h3>
        <button @click="$emit('close')" class="text-food-muted hover:text-food-brown transition text-lg leading-none">✕</button>
      </div>

      <div class="max-h-72 overflow-y-auto px-4 py-3 space-y-2">
        <div v-if="loading" class="py-4 text-center text-xs text-food-muted">載入中…</div>
        <div v-else-if="!members.length" class="py-4 text-center text-xs text-food-muted">尚無成員</div>
        <div v-for="m in members" :key="m.user_id"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-food-beige border border-food-border">
          <div class="w-8 h-8 rounded-full bg-food-border overflow-hidden shrink-0">
            <img v-if="m.avatar_url" :src="m.avatar_url" class="w-full h-full object-cover" />
            <span v-else class="flex items-center justify-center w-full h-full text-base select-none">👤</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 mb-1">
              <span class="text-xs font-bold text-food-brown truncate">{{ m.username }}</span>
              <span v-if="m.is_me" class="text-[10px] text-food-caramel shrink-0">(我)</span>
            </div>
            <!-- Owner: role toggle for non-owner members -->
            <div v-if="myRole === 'owner' && !m.is_me && m.role !== 'owner'" class="flex gap-1">
              <button
                @click="updateRole(m.user_id, 'viewer')"
                :disabled="roleUpdating === m.user_id"
                :class="m.role === 'viewer'
                  ? 'bg-gray-200 text-gray-700 border-gray-300'
                  : 'bg-food-surface text-food-muted border-food-border hover:border-gray-300 hover:text-gray-600'"
                class="text-[10px] px-2 py-0.5 rounded-full font-bold border transition disabled:opacity-50">
                觀看者
              </button>
              <button
                @click="updateRole(m.user_id, 'editor')"
                :disabled="roleUpdating === m.user_id"
                :class="m.role === 'editor'
                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                  : 'bg-food-surface text-food-muted border-food-border hover:border-blue-200 hover:text-blue-600'"
                class="text-[10px] px-2 py-0.5 rounded-full font-bold border transition disabled:opacity-50">
                可編輯
              </button>
            </div>
            <!-- Others: static badge -->
            <span v-else class="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
              :class="{
                'bg-amber-100 text-amber-700': m.role === 'owner',
                'bg-blue-100 text-blue-700':   m.role === 'editor',
                'bg-gray-100 text-gray-500':   m.role === 'viewer',
              }">
              {{ m.role === 'owner' ? '擁有者' : m.role === 'editor' ? '可編輯' : '觀看者' }}
            </span>
          </div>
          <button
            v-if="(myRole === 'owner' && !m.is_me && m.role !== 'owner') || (m.is_me && m.role !== 'owner')"
            @click="removeMember(m.user_id)"
            class="text-red-400 hover:text-red-600 text-xs transition shrink-0 leading-none">
            {{ m.is_me ? '退出' : '移除' }}
          </button>
        </div>
      </div>

      <div class="px-4 py-3 border-t border-food-border">
        <button @click="$emit('close')"
          class="w-full py-2.5 rounded-xl bg-food-caramel text-white text-xs font-bold hover:bg-food-orange transition">
          完成
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { TripMember } from '~/types'

const props = defineProps<{
  tripId: string
  myRole: string
  token: string
}>()

defineEmits<{ close: [] }>()

const msg         = useMessage()
const { authFetch } = useAuthFetch(computed(() => props.token))
const members     = ref<TripMember[]>([])
const loading     = ref(true)
const roleUpdating = ref<string | null>(null)

async function fetchMembers() {
  loading.value = true
  try {
    const { members: data } = await authFetch<{ members: TripMember[] }>(`/api/trips/${props.tripId}/members`, {
    })
    members.value = data
  } finally {
    loading.value = false
  }
}

async function updateRole(uid: string, role: 'viewer' | 'editor') {
  const member = members.value.find(m => m.user_id === uid)
  if (!member || member.role === role) return
  roleUpdating.value = uid
  try {
    await authFetch(`/api/trips/${props.tripId}/members/${uid}`, {
      method: 'PATCH',
      body: { role },
    })
    member.role = role
  } catch (err: any) {
    msg.error(err.data?.statusMessage ?? '更新角色失敗')
  } finally {
    roleUpdating.value = null
  }
}

async function removeMember(uid: string) {
  if (!confirm('確定要移除此成員？')) return
  try {
    await authFetch(`/api/trips/${props.tripId}/members/${uid}`, {
      method: 'DELETE',
    })
    members.value = members.value.filter(m => m.user_id !== uid)
  } catch (err: any) {
    msg.error(err.data?.statusMessage ?? '操作失敗')
  }
}

onMounted(fetchMembers)
</script>
