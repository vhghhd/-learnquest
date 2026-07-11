<template>
  <div class="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-accent mb-4">LearnQuest</h1>
      <p class="text-muted mb-8">将任意知识变成一场冒险</p>
      
      <div class="bg-white rounded-2xl p-8 shadow-md max-w-lg w-full">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold">开始新冒险</h2>
          <button
            class="text-sm text-muted hover:text-accent transition-colors flex items-center gap-1"
            @click="showSettings = true"
          >
            <span>⚙️</span>
            <span>API 设置</span>
          </button>
        </div>
        
        <div v-if="!isGenerating" class="space-y-4">
          <textarea
            v-model="content"
            class="w-full h-48 p-4 border border-rule rounded-xl resize-none focus:outline-none focus:border-accent text-ink"
            placeholder="粘贴你的学习内容..."
          />
          
          <div class="flex items-center justify-between text-sm text-muted">
            <span>{{ content.length }} / {{ MAX_CONTENT_LENGTH }} 字</span>
            <button
              class="text-accent hover:text-accent-dark transition-colors"
              @click="loadExampleContent"
            >
              加载示例内容
            </button>
          </div>
          
          <button
            class="w-full py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent-dark transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            :disabled="content.length < 10 || content.length > MAX_CONTENT_LENGTH"
            :class="{ 'opacity-50 cursor-not-allowed': content.length < 10 || content.length > MAX_CONTENT_LENGTH }"
            @click="createQuest"
          >
            生成冒险
          </button>

          <div class="text-xs text-center text-muted">
            {{ apiKeyConfigured ? '🤖 使用 DeepSeek AI 生成' : '⚠️ 未配置 API Key，将使用示例数据' }}
          </div>
        </div>
        
        <div v-else class="py-12">
          <div class="relative w-24 h-24 mx-auto mb-6">
            <div class="absolute inset-0 border-4 border-accent rounded-full animate-ping opacity-20"></div>
            <div class="absolute inset-0 border-4 border-accent-light rounded-full"></div>
            <div class="absolute inset-2 border-4 border-accent rounded-full animate-pulse"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-2xl font-bold text-accent">{{ Math.round(progress) }}%</span>
            </div>
          </div>
          <p class="text-lg font-medium text-ink mb-4">{{ currentStage }}</p>
          <div class="h-2 bg-bg2 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-accent to-accent2 transition-all duration-300"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
        </div>
      </div>
      
      <div class="mt-8 grid grid-cols-3 gap-4 max-w-lg w-full">
        <div class="text-center">
          <div class="text-2xl font-bold text-accent">5min</div>
          <div class="text-sm text-muted">从导入到开始</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-accent">80%</div>
          <div class="text-sm text-muted">知识覆盖率</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-accent">30题</div>
          <div class="text-sm text-muted">每学习包</div>
        </div>
      </div>

      <div v-if="savedQuests.length > 0" class="mt-8 max-w-lg w-full">
        <h2 class="text-lg font-bold text-ink mb-4 text-left">我的题库</h2>
        <div class="space-y-3">
          <div
            v-for="q in savedQuests"
            :key="q.id"
            class="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div class="flex-1 text-left cursor-pointer" @click="continueQuest(q.id)">
              <div class="font-medium text-ink">{{ q.title }}</div>
              <div class="text-xs text-muted mt-1 flex items-center gap-3">
                <span>{{ formatDate(q.createdAt) }}</span>
                <span>{{ q.nodeCount }} 个节点</span>
                <span>{{ q.questionCount }} 题</span>
                <span class="text-accent">{{ q.completedCount }}/{{ q.nodeCount }} 已通关</span>
              </div>
            </div>
            <button
              class="ml-3 text-muted hover:text-danger transition-colors text-sm"
              @click.stop="removeQuest(q.id)"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showSettings"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="handleSettingsClose"
      >
        <DeepSeekSettings
          @close="handleSettingsClose"
          @change="(has) => { apiKeyConfigured = has }"
        />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuestStore } from '@/stores/quest.store'
import { generateQuest, hasApiKey } from '@/utils/deepseekApi'
import DeepSeekSettings from '@/components/DeepSeekSettings.vue'
import { AI_CONFIG, ROUTES } from '@/utils/constants'

const router = useRouter()
const questStore = useQuestStore()

const content = ref('')
const isGenerating = ref(false)
const progress = ref(0)
const currentStage = ref('')
const showSettings = ref(false)
const apiKeyConfigured = ref(hasApiKey())
const MAX_CONTENT_LENGTH = AI_CONFIG.MAX_CONTENT_LENGTH

const savedQuests = computed(() => questStore.savedQuests)

function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function continueQuest(questId: string) {
  if (questStore.loadQuest(questId)) {
    router.push(ROUTES.QUEST_MAP(questId))
  } else {
    alert('加载题库失败')
  }
}

function removeQuest(questId: string) {
  if (confirm('确定删除这个题库吗？')) {
    questStore.deleteQuest(questId)
  }
}

onMounted(() => {
  questStore.loadSavedQuests()
})

const EXAMPLE_CONTENT = `学习是一个主动构建知识的过程。建构主义学习理论认为，学习者不是被动地接受知识，而是通过与环境的交互主动构建自己的理解。学习的本质是通过经验引起的认知或行为的持久改变。

认知负荷理论强调，学习效率取决于如何有效分配有限的认知资源。维果茨基的社会文化理论提出了"最近发展区"概念，即学习者在他人帮助下能完成的任务与独立完成的任务之间的差距。

深度练习专注于自己的薄弱环节，而不是简单重复。间隔重复法利用记忆曲线，在即将遗忘时进行复习，能有效提高记忆效率。费曼技巧通过将知识教给他人来检验自己的理解深度。

面对复杂问题，应该先拆解成可管理的小问题，然后逐步解决。知识整合能力是综合应用不同领域知识的关键，需要识别新场景与原有知识的相似性。`

function loadExampleContent() {
  content.value = EXAMPLE_CONTENT
}

function handleSettingsClose() {
  showSettings.value = false
  apiKeyConfigured.value = hasApiKey()
}

async function createQuest() {
  if (!content.value.trim() || content.value.length < 10) return

  isGenerating.value = true
  progress.value = 0
  apiKeyConfigured.value = hasApiKey()

  try {
    const quest = await generateQuest(
      content.value,
      (stage, p) => {
        currentStage.value = stage
        progress.value = p
      }
    )

    questStore.setQuest(quest)
    questStore.saveToStorage()

    await router.push(ROUTES.QUEST_MAP(quest.id))
  } catch (error) {
    console.error('Failed to create quest:', error)
    alert('生成失败：' + (error instanceof Error ? error.message : '未知错误'))
  } finally {
    isGenerating.value = false
    progress.value = 0
    currentStage.value = ''
  }
}
</script>
