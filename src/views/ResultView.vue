<template>
  <div class="min-h-screen bg-gradient-to-br from-bg via-bg to-bg2 flex flex-col items-center justify-center p-6">
    <div class="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
      <div class="mb-6">
        <div 
          class="w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4"
          :class="resultBgClass"
        >
          <span class="text-4xl">{{ resultIcon }}</span>
        </div>
        <h1 class="text-2xl font-bold text-ink mb-2">{{ resultTitle }}</h1>
        <p class="text-muted">{{ mapNode?.name ?? '关卡挑战' }}</p>
      </div>

      <div class="flex justify-center gap-2 mb-8">
        <span 
          v-for="i in 3" 
          :key="i"
          class="text-4xl transition-all duration-500"
          :class="i <= stars ? 'scale-100 opacity-100' : 'scale-75 opacity-30'"
          :style="{ transitionDelay: `${i * 200}ms` }"
        >
          ⭐
        </span>
      </div>

      <div class="grid grid-cols-3 gap-4 mb-8">
        <div class="bg-bg rounded-xl p-4">
          <div class="text-2xl font-bold text-accent">{{ score }}</div>
          <div class="text-sm text-muted">得分</div>
        </div>
        <div class="bg-bg rounded-xl p-4">
          <div class="text-2xl font-bold text-accent2">{{ accuracy }}%</div>
          <div class="text-sm text-muted">正确率</div>
        </div>
        <div class="bg-bg rounded-xl p-4">
          <div class="text-2xl font-bold text-gold">{{ formatTime(timeSpent) }}</div>
          <div class="text-sm text-muted">用时</div>
        </div>
      </div>

      <div class="bg-gradient-to-r from-accent-light to-accent2-light rounded-2xl p-6 mb-8">
        <h3 class="font-bold text-ink mb-4">获得奖励</h3>
        <div class="flex justify-center gap-6">
          <div class="flex items-center gap-2">
            <span class="text-2xl">⭐</span>
            <div class="text-left">
              <div class="font-bold text-gold">+{{ xpReward }}</div>
              <div class="text-xs text-muted">经验值</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-2xl">💰</span>
            <div class="text-left">
              <div class="font-bold text-accent">+{{ coinReward }}</div>
              <div class="text-xs text-muted">金币</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-2xl">🧩</span>
            <div class="text-left">
              <div class="font-bold text-accent2">+1</div>
              <div class="text-xs text-muted">知识碎片</div>
            </div>
          </div>
        </div>

        <div v-if="stars === 3" class="mt-4 pt-4 border-t border-accent/20">
          <div class="flex items-center justify-center gap-2 text-accent">
            <span>🏆</span>
            <span class="font-bold">三星通关奖励！</span>
            <span class="text-gold">+{{ GAME_CONFIG.THREE_STAR_XP_BONUS }} XP</span>
          </div>
        </div>
      </div>

      <div class="flex gap-3">
        <button
          class="flex-1 py-3 bg-bg2 text-ink rounded-xl font-medium hover:bg-bg transition-colors"
          @click="goMap"
        >
          返回地图
        </button>
        <button
          v-if="hasNextLevel"
          class="flex-1 py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent-dark transition-all duration-200 hover:scale-[1.02]"
          @click="goNextLevel"
        >
          继续冒险 →
        </button>
      </div>
    </div>

    <div class="mt-6 text-center text-sm text-muted">
      <p>已收集 {{ collectedFragmentCount }} / {{ totalFragmentCount }} 个知识碎片</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuestStore } from '@/stores/quest.store'
import { useLevelStore } from '@/stores/level.store'
import { useUserStore } from '@/stores/user.store'
import { ROUTES, GAME_CONFIG } from '@/utils/constants'

const route = useRoute()
const router = useRouter()
const questStore = useQuestStore()
const levelStore = useLevelStore()
const userStore = useUserStore()

const levelId = computed(() => route.params.levelId as string)
const questId = computed(() => route.params.id as string)

const mapNode = computed(() => questStore.mapNodes.find(n => n.id === levelId.value))
const levelProgress = computed(() => questStore.getLevelProgress(levelId.value))

const stars = computed(() => levelProgress.value?.stars ?? 0)
const score = computed(() => levelProgress.value?.bestScore ?? 0)
const timeSpent = computed(() => levelProgress.value?.bestTime ?? 0)
const correctCount = computed(() => levelStore.correctCount)
const totalQuestions = computed(() => levelStore.totalQuestions)

const accuracy = computed(() => {
  if (totalQuestions.value === 0) return 0
  return Math.round((correctCount.value / totalQuestions.value) * 100)
})

const xpReward = computed(() => {
  let base = mapNode.value?.reward.xp ?? 0
  if (stars.value === 3) base += GAME_CONFIG.THREE_STAR_XP_BONUS
  if (!questStore.isLevelCompleted(levelId.value)) base += GAME_CONFIG.FIRST_CLEAR_XP_BONUS
  return base
})

const coinReward = computed(() => mapNode.value?.reward.coins ?? 0)

const collectedFragmentCount = computed(() => questStore.collectedFragments.length)
const totalFragmentCount = computed(() => questStore.allFragments.length)

const hasNextLevel = computed(() => {
  if (!mapNode.value) return false
  return mapNode.value.unlocks.length > 0 && 
         mapNode.value.unlocks.some(id => questStore.nodeStatusMap.get(id) === 'available')
})

const resultTitle = computed(() => {
  if (stars.value === 3) return '完美通关！'
  if (stars.value >= 1) return '挑战成功！'
  return '再接再厉'
})

const resultIcon = computed(() => {
  if (stars.value === 3) return '🏆'
  if (stars.value >= 2) return '🎉'
  if (stars.value === 1) return '👍'
  return '💪'
})

const resultBgClass = computed(() => {
  if (stars.value === 3) return 'bg-yellow-100'
  if (stars.value >= 1) return 'bg-accent-light'
  return 'bg-bg2'
})

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function goMap() {
  router.push(ROUTES.QUEST_MAP(questId.value))
}

function goNextLevel() {
  if (!mapNode.value) return
  const nextLevelId = mapNode.value.unlocks.find(id => 
    questStore.nodeStatusMap.get(id) === 'available'
  )
  if (nextLevelId) {
    router.push(ROUTES.QUEST_LEVEL(questId.value, nextLevelId))
  }
}

onMounted(() => {
  if (mapNode.value) {
    for (const fragId of mapNode.value.reward.fragments) {
      questStore.collectFragment(fragId)
    }
    
    userStore.addXP(xpReward.value)
    userStore.addCoins(coinReward.value)
    userStore.saveToStorage()
    questStore.saveToStorage()
  }
})
</script>
