import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Question } from '@/types/quest.types'
import type { UserAnswer } from '@/types/question.types'
import { GAME_CONFIG } from '@/utils/constants'

export const useLevelStore = defineStore('level', () => {
  const currentLevelId = ref<string | null>(null)
  const questions = ref<Question[]>([])
  const currentQuestionIndex = ref(0)
  const score = ref(0)
  const correctCount = ref(0)
  const wrongCount = ref(0)
  const heartsRemaining = ref<number>(GAME_CONFIG.INITIAL_HEARTS)
  const startTime = ref(0)
  const timeLimit = ref<number | null>(null)
  const answers = ref<UserAnswer[]>([])
  const isFinished = ref(false)
  const showFeedback = ref(false)
  const lastAnswerCorrect = ref(false)

  const currentQuestion = computed(() => questions.value[currentQuestionIndex.value] ?? null)
  const totalQuestions = computed(() => questions.value.length)
  const progress = computed(() => {
    if (totalQuestions.value === 0) return 0
    return ((currentQuestionIndex.value + 1) / totalQuestions.value) * 100
  })
  const elapsedTime = computed(() => Date.now() - startTime.value)

  function startLevel(levelId: string, questionList: Question[], hearts: number) {
    console.debug('[levelStore] 🎮 startLevel:', {
      levelId,
      questionCount: questionList.length,
      initialHearts: hearts,
      questions: questionList.map(q => q.id),
    })
    
    currentLevelId.value = levelId
    questions.value = [...questionList].sort(() => Math.random() - 0.5)
    currentQuestionIndex.value = 0
    score.value = 0
    correctCount.value = 0
    wrongCount.value = 0
    heartsRemaining.value = hearts
    startTime.value = Date.now()
    answers.value = []
    isFinished.value = false
    showFeedback.value = false
    
    console.debug('[levelStore] ✅ Level started:', {
      shuffledQuestions: questions.value.map(q => q.id),
      currentQuestionId: questions.value[0]?.id,
    })
  }

  function submitAnswer(selected: string): boolean {
    const question = currentQuestion.value
    if (!question) {
      console.error('[levelStore] ❌ submitAnswer failed: no current question')
      return false
    }

    const isCorrect = selected === question.correctAnswer
    const timeSpent = Math.floor((Date.now() - startTime.value - answers.value.reduce((s, a) => s + a.timeSpent, 0)) / 1000)

    console.debug('[levelStore] 📝 submitAnswer:', {
      questionId: question.id,
      stem: question.stem.slice(0, 30) + '...',
      selected: selected,
      correctAnswer: question.correctAnswer,
      isCorrect,
      timeSpent,
    })

    answers.value.push({
      questionId: question.id,
      selected,
      correct: isCorrect,
      timeSpent,
    })

    if (isCorrect) {
      correctCount.value++
      score.value += 10
      console.debug('[levelStore] ✅ Answer correct:', {
        correctCount: correctCount.value,
        score: score.value,
        currentAccuracy: ((correctCount.value) / (correctCount.value + wrongCount.value)) * 100,
      })
    } else {
      wrongCount.value++
      heartsRemaining.value--
      console.debug('[levelStore] ❌ Answer wrong:', {
        wrongCount: wrongCount.value,
        heartsRemaining: heartsRemaining.value,
        currentAccuracy: ((correctCount.value) / (correctCount.value + wrongCount.value)) * 100,
      })
    }

    lastAnswerCorrect.value = isCorrect
    showFeedback.value = true

    if (heartsRemaining.value <= 0) {
      isFinished.value = true
      console.warn('[levelStore] 💔 Level failed: hearts exhausted')
    }

    return isCorrect
  }

  function nextQuestion() {
    showFeedback.value = false
    console.debug('[levelStore] ➡️ nextQuestion:', {
      currentIndex: currentQuestionIndex.value,
      totalQuestions: totalQuestions.value,
    })

    if (currentQuestionIndex.value < questions.value.length - 1) {
      currentQuestionIndex.value++
      console.debug('[levelStore] ✅ Next question:', {
        newIndex: currentQuestionIndex.value,
        questionId: questions.value[currentQuestionIndex.value]?.id,
      })
    } else {
      isFinished.value = true
      console.debug('[levelStore] 🏁 Level finished: all questions answered')
    }
  }

  function calculateStars(): number {
    if (heartsRemaining.value <= 0) {
      console.debug('[levelStore] ⭐ calculateStars: 0 stars (hearts exhausted)')
      return 0
    }
    
    const accuracy = correctCount.value / totalQuestions.value
    const totalTime = elapsedTime.value / 1000
    const estimatedTime = totalQuestions.value * 15

    console.debug('[levelStore] ⭐ calculateStars:', {
      accuracy: accuracy * 100,
      totalTime,
      estimatedTime,
      timeRatio: totalTime / estimatedTime,
    })

    let stars = 0
    if (accuracy >= GAME_CONFIG.STAR_THRESHOLDS.ONE_STAR) stars = 1
    if (accuracy >= GAME_CONFIG.STAR_THRESHOLDS.TWO_STAR) stars = 2
    if (accuracy >= GAME_CONFIG.STAR_THRESHOLDS.THREE_STAR &&
        totalTime < estimatedTime * GAME_CONFIG.STAR_THRESHOLDS.THREE_STAR_TIME_RATIO) {
      stars = 3
    }
    
    console.debug('[levelStore] ✅ Stars calculated:', stars)
    return stars
  }

  function finishLevel() {
    isFinished.value = true
    console.debug('[levelStore] 🔚 finishLevel called')
  }

  function $reset() {
    currentLevelId.value = null
    questions.value = []
    currentQuestionIndex.value = 0
    score.value = 0
    correctCount.value = 0
    wrongCount.value = 0
    heartsRemaining.value = GAME_CONFIG.INITIAL_HEARTS
    startTime.value = 0
    timeLimit.value = null
    answers.value = []
    isFinished.value = false
    showFeedback.value = false
    lastAnswerCorrect.value = false
  }

  return {
    currentLevelId,
    questions,
    currentQuestionIndex,
    score,
    correctCount,
    wrongCount,
    heartsRemaining,
    startTime,
    timeLimit,
    answers,
    isFinished,
    showFeedback,
    lastAnswerCorrect,
    currentQuestion,
    totalQuestions,
    progress,
    elapsedTime,
    startLevel,
    submitAnswer,
    nextQuestion,
    calculateStars,
    finishLevel,
    $reset,
  }
})
