<template>
  <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />

    <div class="relative bg-food-surface rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

      <!-- Header -->
      <div class="bg-gradient-to-r from-food-caramel to-food-orange px-5 py-5 text-white text-center relative overflow-hidden shrink-0">
        <div class="text-4xl mb-1 select-none">🎯</div>
        <h2 class="font-bold text-xl">標記已儲存！</h2>
        <Transition name="xp-float">
          <div v-if="showTotal"
            class="absolute top-3 right-4 text-2xl font-black text-yellow-300 drop-shadow-lg select-none pointer-events-none leading-none">
            +{{ xpGained }} XP
          </div>
        </Transition>
      </div>

      <div class="overflow-y-auto flex-1">

        <!-- XP Breakdown -->
        <div class="px-5 pt-4 pb-2">
          <p class="text-[10px] font-bold text-food-muted mb-2 uppercase tracking-widest">經驗值明細</p>
          <div class="space-y-1.5">
            <TransitionGroup name="slide-in">
              <div v-for="item in visibleBreakdown" :key="item.label"
                class="flex items-center justify-between bg-food-beige rounded-lg px-3 py-2">
                <span class="text-xs text-food-brown">{{ item.label }}</span>
                <span class="text-xs font-bold text-food-caramel">+{{ item.xp }} XP</span>
              </div>
            </TransitionGroup>
          </div>

          <Transition name="pop-in">
            <div v-if="showTotal"
              class="mt-3 flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
              <span class="font-bold text-food-brown text-sm">本次獲得</span>
              <span class="text-xl font-black text-food-orange">+{{ xpGained }} XP</span>
            </div>
          </Transition>

          <Transition name="pop-in">
            <div v-if="showLevelUp && leveledUp"
              class="mt-3 bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 text-center">
              <div class="text-3xl mb-1.5 select-none">⭐✨⭐</div>
              <div class="text-base font-black text-yellow-700">LEVEL UP！</div>
              <div class="text-sm text-yellow-600 mt-0.5 font-bold">Lv.{{ oldLevel }} → Lv.{{ newLevel }}</div>
            </div>
          </Transition>
        </div>

        <!-- Leaderboard -->
        <Transition name="fade-up">
          <div v-if="showLeaderboard" class="px-5 pb-4">
            <div class="border-t border-food-border pt-3 mb-2.5 flex items-center justify-between">
              <p class="text-[10px] font-bold text-food-muted uppercase tracking-widest">🏆 排行榜</p>
              <span class="text-xs text-food-muted">目前第 {{ currentUserRank }} 名</span>
            </div>

            <TransitionGroup name="rank-swap" tag="div" class="space-y-1.5">
              <div v-for="entry in animatedEntries" :key="entry.id"
                :class="entry.isMe
                  ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-200'
                  : 'bg-food-input border-food-border'"
                class="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs">
                <span class="w-7 shrink-0 text-center font-bold"
                  :class="{
                    'text-yellow-500': entry.rank === 1,
                    'text-slate-400':  entry.rank === 2,
                    'text-orange-400': entry.rank === 3,
                    'text-food-muted': entry.rank > 3,
                  }">
                  {{ entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}` }}
                </span>
                <span class="flex-1 font-bold text-food-brown truncate">
                  {{ entry.username || '匿名' }}
                  <span v-if="entry.isMe" class="text-food-caramel font-normal text-[10px]"> ◀ 我</span>
                </span>
                <UserLevelBadge :level="entry.user_level" :size="16" class="shrink-0" />
                <span class="font-mono font-bold min-w-[58px] text-right tabular-nums"
                  :class="entry.isMe ? 'text-amber-600' : 'text-food-muted'">
                  {{ (entry.isMe ? displayXp : entry.xp).toLocaleString() }}
                </span>
              </div>
            </TransitionGroup>
          </div>
        </Transition>

      </div>

      <!-- Close button -->
      <Transition name="fade-up">
        <div v-if="phase === 'done'" class="px-5 pb-5 pt-3 border-t border-food-border shrink-0">
          <button @click="$emit('close')"
            class="w-full py-3 rounded-xl bg-food-caramel text-white font-bold text-sm hover:bg-food-orange transition active:scale-95">
            繼續探索 🗺️
          </button>
        </div>
      </Transition>

    </div>
  </div>
</template>

<script lang="ts" setup>
interface XpBreakdown { label: string; xp: number }
interface LeaderboardEntry {
  id: string
  username: string
  user_level: number
  xp: number
  rank: number
  isMe: boolean
}

const props = defineProps<{
  xpGained: number
  newXp: number
  oldXp: number
  newLevel: number
  oldLevel: number
  leveledUp: boolean
  breakdown: XpBreakdown[]
  leaderboard: { entries: LeaderboardEntry[]; userRank: number }
}>()

defineEmits<{ close: [] }>()

type Phase = 'breakdown' | 'total' | 'leaderboard' | 'done'
const phase            = ref<Phase>('breakdown')
const visibleBreakdown = ref<XpBreakdown[]>([])
const showTotal        = ref(false)
const showLevelUp      = ref(false)
const showLeaderboard  = ref(false)
const displayXp        = ref(props.oldXp)

// Sort leaderboard using animated XP for current user, real XP for others
const baseRank = computed(() =>
  props.leaderboard.entries.length
    ? props.leaderboard.entries.reduce((min, e) => Math.min(min, e.rank), Infinity)
    : 1
)

const animatedEntries = computed(() => {
  const sorted = [...props.leaderboard.entries].sort((a, b) => {
    const xa = a.isMe ? displayXp.value : a.xp
    const xb = b.isMe ? displayXp.value : b.xp
    return xb - xa
  })
  return sorted.map((e, i) => ({ ...e, rank: baseRank.value + i }))
})

const currentUserRank = computed(() =>
  animatedEntries.value.find(e => e.isMe)?.rank ?? props.leaderboard.userRank
)

function delay(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}

onMounted(async () => {
  // Reveal breakdown items one by one
  for (const item of props.breakdown) {
    await delay(320)
    visibleBreakdown.value.push(item)
  }

  await delay(380)
  showTotal.value = true

  if (props.leveledUp) {
    await delay(550)
    showLevelUp.value = true
    await delay(1200)
  } else {
    await delay(500)
  }

  // Show leaderboard then animate XP counter
  showLeaderboard.value = true
  phase.value = 'leaderboard'
  await delay(250)

  const duration = 1400
  const from     = props.oldXp
  const to       = props.newXp
  const startTs  = Date.now()

  await new Promise<void>(resolve => {
    function tick() {
      const t      = Math.min((Date.now() - startTs) / duration, 1)
      const eased  = 1 - Math.pow(1 - t, 3)
      displayXp.value = Math.round(from + (to - from) * eased)
      if (t < 1) requestAnimationFrame(tick)
      else { displayXp.value = to; resolve() }
    }
    requestAnimationFrame(tick)
  })

  await delay(400)
  phase.value = 'done'
})
</script>

<style scoped>
.slide-in-enter-active { transition: all 0.28s ease; }
.slide-in-enter-from   { opacity: 0; transform: translateX(-10px); }

.pop-in-enter-active { transition: all 0.38s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pop-in-enter-from   { opacity: 0; transform: scale(0.75); }

.xp-float-enter-active { transition: all 0.55s cubic-bezier(0.34, 1.56, 0.64, 1); }
.xp-float-enter-from   { opacity: 0; transform: translateY(18px) scale(0.5); }

.fade-up-enter-active { transition: all 0.35s ease; }
.fade-up-enter-from   { opacity: 0; transform: translateY(8px); }

/* TransitionGroup MOVE animation — triggered when sort order changes */
.rank-swap-move         { transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
.rank-swap-enter-active { transition: all 0.3s ease; }
.rank-swap-enter-from   { opacity: 0; }
</style>
