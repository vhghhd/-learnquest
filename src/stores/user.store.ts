import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AvatarConfig } from '@/types/user.types'
import { GAME_CONFIG } from '@/utils/constants'

export const useUserStore = defineStore('user', () => {
  const level = ref(1)
  const xp = ref(0)
  const hearts = ref(GAME_CONFIG.INITIAL_HEARTS)
  const coins = ref(0)
  const streak = ref(0)
  const lastPlayDate = ref('')
  const totalQuestionsAnswered = ref(0)
  const totalCorrectAnswers = ref(0)
  const totalStudyTime = ref(0)
  const avatar = ref<AvatarConfig>({})
  const achievements = ref<string[]>([])

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
    }
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
    xpToNextLevel,
    xpProgress,
    accuracyRate,
    addXP,
    loseHeart,
    addCoins,
    spendCoins,
    recordAnswer,
    checkStreak,
    saveToStorage,
    loadFromStorage,
    $reset,
  }
})
