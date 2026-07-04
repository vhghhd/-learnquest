import { ref, onMounted } from 'vue'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const data = ref<T>(initialValue)

  function load() {
    const raw = localStorage.getItem(key)
    if (raw) {
      try {
        data.value = JSON.parse(raw) as T
      } catch (e) {
        console.error(`Failed to parse localStorage item "${key}":`, e)
      }
    }
  }

  function save() {
    localStorage.setItem(key, JSON.stringify(data.value))
  }

  function remove() {
    localStorage.removeItem(key)
  }

  onMounted(() => {
    load()
  })

  return {
    data,
    load,
    save,
    remove,
  }
}
