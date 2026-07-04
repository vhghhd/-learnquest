import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const isLoading = ref(false)
  const loadingText = ref('加载中...')
  const showToast = ref(false)
  const toastMessage = ref('')
  const toastType = ref<'success' | 'error' | 'info'>('info')

  function startLoading(text = '加载中...') {
    loadingText.value = text
    isLoading.value = true
  }

  function stopLoading() {
    isLoading.value = false
  }

  function showToastMessage(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 2000) {
    toastMessage.value = message
    toastType.value = type
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
    }, duration)
  }

  function $reset() {
    isLoading.value = false
    loadingText.value = '加载中...'
    showToast.value = false
    toastMessage.value = ''
    toastType.value = 'info'
  }

  return {
    isLoading,
    loadingText,
    showToast,
    toastMessage,
    toastType,
    startLoading,
    stopLoading,
    showToastMessage,
    $reset,
  }
})
