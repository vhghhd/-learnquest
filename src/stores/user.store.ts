import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AvatarConfig } from '@/types/user.types'
import { GAME_CONFIG } from '@/utils/constants'

const RECOVERY_INTERVAL = GAME_CONFIG.HEART_RECOVERY_MINUTES * 60 * 1000

export const useUserStore = defineStore('user', () => {
  const level = ref(1)
  const xp = ref(0)
  const hearts = ref<number>(GAME_CONFIG.INITIAL_HEARTS)
  const coins = ref(0)
  const streak = ref(0)
  const lastPlayDate = ref('')
  const totalQuestionsAnswered = ref(0)
  const totalCorrectAnswers = ref(0)
  const totalStudyTime = ref(0)
  const avatar = ref<AvatarConfig>({})
  const achievements = ref<string[]>([])
  const lastHeartLossTime = ref<number>(0)

  const xpToNextLevel = computed(() => {
    return Math.floor(
      GAME_CONFIG.BASE_XP_PER_LEVEL * Math.pow(level.value, GAME_CONFIG.XP_GROWTH_FACTOR)
    )
  })

  const xpProgress = computed(() => {
    return Math.min(100, (xp.value / xpToNextLevel.value) * 100)
  })

  const accuracyRate = computed(() => {
    if (totalQuestionsAnswered.value === 0) return 0
    return (totalCorrectAnswers.value / totalQuestionsAnswered.value) * 100
  })

  const nextHeartRecoveryMs = computed(() => {
    if (hearts.value >= GAME_CONFIG.MAX_HEARTS || lastHeartLossTime.value === 0) return 0
    const elapsed = Date.now() - lastHeartLossTime.value
    const remaining = RECOVERY_INTERVAL - (elapsed % RECOVERY_INTERVAL)
    return remaining
  })

  function addXP(amount: number) {
    xp.value += amount
    while (xp.value >= xpToNextLevel.value) {
      xp.value -= xpToNextLevel.value
      level.value++
    }
  }

  function loseHeart() {
    if (hearts.value > 0) {
      hearts.value--
      if (lastHeartLossTime.value === 0) {
        lastHeartLossTime.value = Date.now()
      }
    }
  }

  function checkHeartRecovery() {
    if (hearts.value >= GAME_CONFIG.MAX_HEARTS || lastHeartLossTime.value === 0) {
      return
    }

    const elapsed = Date.now() - lastHeartLossTime.value
    const recovered = Math.floor(elapsed / RECOVERY_INTERVAL)

    if (recovered > 0) {
      const newHearts = Math.min(GAME_CONFIG.MAX_HEARTS, hearts.value + recovered)
      const actualRecovered = newHearts - hearts.value
      hearts.value = newHearts

      if (hearts.value >= GAME_CONFIG.MAX_HEARTS) {
        lastHeartLossTime.value = 0
      } else {
        lastHeartLossTime.value += actualRecovered * RECOVERY_INTERVAL
      }
    }
  }

  function buyHeart(): { ok: boolean; reason?: string } {
    if (hearts.value >= GAME_CONFIG.MAX_HEARTS) {
      return { ok: false, reason: '爱心已满' }
    }
    if (!spendCoins(GAME_CONFIG.HEART_COST_COINS)) {
      return { ok: false, reason: '金币不足' }
    }
    hearts.value++
    if (hearts.value >= GAME_CONFIG.MAX_HEARTS) {
      lastHeartLossTime.value = 0
    }
    return { ok: true }
  }

  function addCoins(amount: number) {
    coins.value += amount
  }

  function spendCoins(amount: number): boolean {
    if (coins.value >= amount) {
      coins.value -= amount
      return true
    }
    return false
  }

  function recordAnswer(correct: boolean, timeSpent: number) {
    totalQuestionsAnswered.value++
    if (correct) {
      totalCorrectAnswers.value++
    }
    totalStudyTime.value += timeSpent
  }

  function checkStreak() {
    const today = new Date().toISOString().split('T')[0]
    if (lastPlayDate.value === today) return

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    if (lastPlayDate.value === yesterday) {
      streak.value++
    } else if (lastPlayDate.value !== today) {
      streak.value = 1
    }
    lastPlayDate.value = today
  }

  function saveToStorage() {
    const data = {
      level: level.value,
      xp: xp.value,
      hearts: hearts.value,
      coins: coins.value,
      streak: streak.value,
      lastPlayDate: lastPlayDate.value,
      totalQuestionsAnswered: totalQuestionsAnswered.value,
      totalCorrectAnswers: totalCorrectAnswers.value,
      totalStudyTime: totalStudyTime.value,
      avatar: avatar.value,
      achievements: achievements.value,
      lastHeartLossTime: lastHeartLossTime.value,
    }
    localStorage.setItem('lq_user', JSON.stringify(data))
  }

  function loadFromStorage() {
    const raw = localStorage.getItem('lq_user')
    if (raw) {
      try {
        const data = JSON.parse(raw)
        level.value = data.level ?? 1
        xp.value = data.xp ?? 0
        hearts.value = data.hearts ?? GAME_CONFIG.INITIAL_HEARTS
        coins.value = data.coins ?? 0
        streak.value = data.streak ?? 0
        lastPlayDate.value = data.lastPlayDate ?? ''
        totalQuestionsAnswered.value = data.totalQuestionsAnswered ?? 0
        totalCorrectAnswers.value = data.totalCorrectAnswers ?? 0
        totalStudyTime.value = data.totalStudyTime ?? 0
        avatar.value = data.avatar ?? {}
        achievements.value = data.achievements ?? []
        lastHeartLossTime.value = data.lastHeartLossTime ?? 0
        checkHeartRecovery()
      } catch (e) {
        console.error('Failed to load user data:', e)
      }
    }
  }

  function $reset() {
    level.value = 1
    xp.value = 0
    hearts.value = GAME_CONFIG.INITIAL_HEARTS
    coins.value = 0
    streak.value = 0
    lastPlayDate.value = ''
    totalQuestionsAnswered.value = 0
    totalCorrectAnswers.value = 0
    totalStudyTime.value = 0
    avatar.value = {}
    achievements.value = []
    lastHeartLossTime.value = 0
  }

  return {
    level,
    xp,
    hearts,
    coins,
    streak,
    lastPlayDate,
    totalQuestionsAnswered,
    totalCorrectAnswers,
    totalStudyTime,
    avatar,
    achievements,
    lastHeartLossTime,
    xpToNextLevel,
    xpProgress,
    accuracyRate,
    nextHeartRecoveryMs,
    addXP,
    loseHeart,
    checkHeartRecovery,
    buyHeart,
    addCoins,
    spendCoins,
    recordAnswer,
    checkStreak,
    saveToStorage,
    loadFromStorage,
    $reset,
  }
})
