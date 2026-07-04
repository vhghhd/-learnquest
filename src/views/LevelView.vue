<template>
  <div class="min-h-screen bg-gradient-to-br from-bg via-bg to-bg2 flex flex-col">
    <div class="p-4 bg-white/90 backdrop-blur-sm border-b border-rule">
      <div class="flex items-center justify-between max-w-4xl mx-auto">
        <button 
          class="text-ink hover:text-accent transition-colors"
          @click="goBack"
        >
          ← 返回地图
        </button>
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-1">
            <span 
              v-for="i in GAME_CONFIG.MAX_HEARTS" 
              :key="i"
              class="text-xl transition-all duration-300"
              :class="i <= heartsRemaining ? 'opacity-100 scale-100' : 'opacity-30 scale-75'"
            >
              ❤️
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted">进度</span>
            <span class="font-bold text-accent">{{ currentQuestionIndex + 1 }}/{{ totalQuestions }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted">用时</span>
            <span class="font-bold text-ink">{{ formatTime(elapsedTime) }}</span>
          </div>
        </div>
      </div>
      
      <div class="max-w-4xl mx-auto mt-3">
        <div class="h-2 bg-bg2 rounded-full overflow-hidden">
          <div 
            class="h-full bg-gradient-to-r from-accent to-accent2 transition-all duration-300"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
      </div>
    </div>

    <div class="flex-1 flex items-center justify-center p-6">
      <div v-if="currentQuestion" class="w-full max-w-2xl">
        <div class="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div class="flex items-center gap-3 mb-4">
            <span 
              class="px-3 py-1 rounded-full text-sm font-bold"
              :class="difficultyClass"
            >
              {{ difficultyLabel }}
            </span>
            <span class="text-sm text-muted">选择题</span>
          </div>
          
          <h2 class="text-xl font-bold text-ink mb-8 leading-relaxed">
            {{ currentQuestion.stem }}
          </h2>

          <div class="space-y-3">
            <button
              v-for="(option, key) in currentQuestion.options"
              :key="key"
              class="w-full p-4 rounded-xl text-left transition-all duration-200 flex items-center gap-4"
              :class="getOptionClass(key)"
              :disabled="showFeedback"
              @click="selectOption(key)"
            >
              <span 
                class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-200"
                :class="getOptionBadgeClass(key)"
              >
                {{ key }}
              </span>
              <span class="flex-1 text-lg">{{ option }}</span>
              <span v-if="showFeedback && key === currentQuestion.correctAnswer" class="text-xl">✓</span>
              <span v-if="showFeedback && selectedAnswer === key && !lastAnswerCorrect" class="text-xl">✗</span>
            </button>
          </div>
        </div>

        <div v-if="showFeedback" class="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div 
            class="flex items-center gap-2 mb-3"
            :class="lastAnswerCorrect ? 'text-accent2' : 'text-danger'"
          >
            <span class="text-xl">{{ lastAnswerCorrect ? '🎉' : '😢' }}</span>
            <span class="font-bold text-lg">
              {{ lastAnswerCorrect ? '回答正确！' : '回答错误' }}
            </span>
          </div>
          <p class="text-muted">
            <span class="font-medium">正确答案：</span>{{ currentQuestion.options[currentQuestion.correctAnswer] }}
          </p>
          <p class="text-muted mt-2">
            <span class="font-medium">解析：</span>{{ currentQuestion.explanation }}
          </p>
        </div>

        <div v-if="showFeedback" class="flex justify-end">
          <button
            v-if="!isFinished"
            class="px-8 py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent-dark transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            @click="goNext"
          >
            {{ isLastQuestion ? '查看结果' : '下一题' }}
          </button>
          <button
            v-else
            class="px-8 py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent-dark transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            @click="goResult"
          >
            查看结果
          </button>
        </div>
      </div>

      <div v-else-if="isFinished && heartsRemaining <= 0" class="text-center">
        <div class="text-6xl mb-4">💔</div>
        <h2 class="text-2xl font-bold text-danger mb-2">生命值耗尽！</h2>
        <p class="text-muted mb-6">休息一下，恢复生命值后再挑战吧</p>
        <button
          class="px-8 py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent-dark transition-all duration-200"
          @click="goBack"
        >
          返回地图
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
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

const selectedAnswer = ref<string | null>(null)
const timerInterval = ref<ReturnType<typeof setInterval> | null>(null)

const currentQuestion = computed(() => levelStore.currentQuestion)
const currentQuestionIndex = computed(() => levelStore.currentQuestionIndex)
const totalQuestions = computed(() => levelStore.totalQuestions)
const progress = computed(() => levelStore.progress)
const heartsRemaining = computed(() => levelStore.heartsRemaining)
const elapsedTime = computed(() => levelStore.elapsedTime)
const showFeedback = computed(() => levelStore.showFeedback)
const lastAnswerCorrect = computed(() => levelStore.lastAnswerCorrect)
const isFinished = computed(() => levelStore.isFinished)

const isLastQuestion = computed(() => currentQuestionIndex.value >= totalQuestions.value - 1)

const difficultyLabel = computed(() => {
  const diff = currentQuestion.value?.difficulty ?? 1
  const labels = ['', '简单', '普通', '困难', '挑战', '地狱']
  return labels[diff]
})

const difficultyClass = computed(() => {
  const diff = currentQuestion.value?.difficulty ?? 1
  const classes = ['', 'bg-green-100 text-green-700', 'bg-blue-100 text-blue-700', 
                   'bg-yellow-100 text-yellow-700', 'bg-orange-100 text-orange-700', 
                   'bg-red-100 text-red-700']
  return classes[diff]
})

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function getOptionClass(key: string): string {
  if (!showFeedback.value) {
    return 'bg-bg hover:bg-accent-light border-2 border-transparent hover:border-accent'
  }
  
  if (key === currentQuestion.value?.correctAnswer) {
    return 'bg-green-50 border-2 border-green-500'
  }
  
  if (key === selectedAnswer.value && !lastAnswerCorrect.value) {
    return 'bg-red-50 border-2 border-red-500'
  }
  
  return 'bg-bg border-2 border-transparent opacity-50'
}

function getOptionBadgeClass(key: string): string {
  if (!showFeedback.value) {
    return 'bg-accent-light text-accent'
  }
  
  if (key === currentQuestion.value?.correctAnswer) {
    return 'bg-green-500 text-white'
  }
  
  if (key === selectedAnswer.value && !lastAnswerCorrect.value) {
    return 'bg-red-500 text-white'
  }
  
  return 'bg-bg2 text-muted'
}

function selectOption(key: string) {
  if (showFeedback.value) return
  
  selectedAnswer.value = key
  const correct = levelStore.submitAnswer(key)
  
  userStore.recordAnswer(correct, 0)
  
  if (correct) {
    userStore.addXP(GAME_CONFIG.XP_PER_CORRECT_NORMAL)
    userStore.addCoins(GAME_CONFIG.COINS_PER_CORRECT)
  } else {
    userStore.loseHeart()
  }
  
  userStore.saveToStorage()
}

function goNext() {
  selectedAnswer.value = null
  levelStore.nextQuestion()
}

function goResult() {
  const stars = levelStore.calculateStars()
  questStore.completeLevel(
    route.params.levelId as string,
    stars,
    levelStore.score,
    Math.floor(levelStore.elapsedTime / 1000)
  )
  
  router.push(ROUTES.QUEST_RESULT(route.params.id as string, route.params.levelId as string))
}

function goBack() {
  router.push(ROUTES.QUEST_MAP(route.params.id as string))
}

onMounted(() => {
  const levelId = route.params.levelId as string
  const mapNode = questStore.mapNodes.find(n => n.id === levelId)
  
  if (mapNode) {
    const questions = questStore.allQuestions.filter(q => 
      mapNode.questionIds.includes(q.id)
    )
    
    levelStore.startLevel(levelId, questions, userStore.hearts)
  }
  
  timerInterval.value = setInterval(() => {}, 1000)
})

onUnmounted(() => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
})
</script>

<style scoped>
button:not(:disabled):active {
  transform: scale(0.98);
}
</style>
