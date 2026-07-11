<template>
  <div class="bg-white rounded-2xl p-6 shadow-md max-w-lg w-full">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-ink">DeepSeek API 设置</h2>
      <button
        class="text-muted hover:text-ink transition-colors"
        @click="emit('close')"
      >
        ✕
      </button>
    </div>

    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-ink mb-2">API Key</label>
        <input
          v-model="apiKeyInput"
          type="password"
          class="w-full p-3 border rounded-xl focus:outline-none focus:border-accent text-ink"
          :class="errorMsg ? 'border-danger' : 'border-rule'"
          placeholder="sk-..."
          autocomplete="off"
          @input="errorMsg = ''"
        />
        <p v-if="errorMsg" class="text-xs text-danger mt-2">
          {{ errorMsg }}
        </p>
        <p class="text-xs text-muted mt-2">
          API Key 存储在浏览器本地，不会上传到服务器。
          请在
          <a
            href="https://platform.deepseek.com/api_keys"
            target="_blank"
            class="text-accent hover:underline"
          >DeepSeek 平台</a>
          获取。
        </p>
      </div>

      <div class="bg-bg2 rounded-xl p-4 text-sm text-muted space-y-2">
        <div class="flex items-center gap-2">
          <span class="text-lg">{{ hasKey ? '✅' : '⚠️' }}</span>
          <span class="font-medium text-ink">
            {{ hasKey ? '已配置 API Key' : '未配置，将使用示例数据' }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-lg">🤖</span>
          <span>模型: {{ modelName }}</span>
        </div>
      </div>

      <div class="flex gap-3">
        <button
          v-if="hasKey"
          class="flex-1 py-3 bg-bg2 text-ink rounded-xl font-medium hover:bg-bg transition-colors"
          @click="handleClear"
        >
          清除
        </button>
        <button
          class="flex-1 py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent-dark transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100"
          :disabled="!apiKeyInput.trim() || isTesting"
          :class="{ 'opacity-50 cursor-not-allowed': !apiKeyInput.trim() || isTesting }"
          @click="handleSave"
        >
          {{ isTesting ? '测试中...' : '保存' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  getApiKey,
  setApiKey,
  clearApiKey,
  hasApiKey,
  validateApiKeyFormat,
  testApiConnection,
} from '@/utils/deepseekApi'
import { AI_CONFIG } from '@/utils/constants'

const emit = defineEmits<{
  close: []
  change: [hasKey: boolean]
}>()

const apiKeyInput = ref(getApiKey())
const hasKey = ref(hasApiKey())
const isTesting = ref(false)
const errorMsg = ref('')
const modelName = AI_CONFIG.MODEL_NAME

async function handleSave() {
  const key = apiKeyInput.value.trim()
  if (!key) return

  if (!validateApiKeyFormat(key)) {
    errorMsg.value = 'API key 不满足规则要求'
    return
  }

  isTesting.value = true
  errorMsg.value = ''

  try {
    const result = await testApiConnection(key)
    if (!result.ok) {
      errorMsg.value = 'API Key 无法正常使用：' + (result.error || '未知错误')
      return
    }

    setApiKey(key)
    hasKey.value = true
    emit('change', true)
    emit('close')
  } catch (err) {
    errorMsg.value = 'API Key 无法正常使用：' + (err instanceof Error ? err.message : '未知错误')
  } finally {
    isTesting.value = false
  }
}

function handleClear() {
  clearApiKey()
  apiKeyInput.value = ''
  hasKey.value = false
  errorMsg.value = ''
  emit('change', false)
  emit('close')
}
</script>
