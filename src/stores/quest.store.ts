import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Quest, MapNode, LevelProgress } from '@/types/quest.types'

export interface QuestMeta {
  id: string
  title: string
  createdAt: number
  nodeCount: number
  questionCount: number
  completedCount: number
}

const QUEST_LIST_KEY = 'lq_quest_list'
const QUEST_DATA_PREFIX = 'lq_quest_data_'

export const useQuestStore = defineStore('quest', () => {
  const currentQuestId = ref<string | null>(null)
  const quest = ref<Quest | null>(null)
  const completedLevels = ref<LevelProgress[]>([])
  const collectedFragments = ref<string[]>([])
  const unlockedLevels = ref<string[]>([])
  const savedQuests = ref<QuestMeta[]>([])

  const mapNodes = computed<MapNode[]>(() => quest.value?.mapConfig.nodes ?? [])
  const allQuestions = computed(() => quest.value?.questions ?? [])
  const allFragments = computed(() => quest.value?.fragments ?? [])

  const nodeStatusMap = computed(() => {
    const statusMap = new Map<string, 'locked' | 'available' | 'current' | 'completed'>()
    const completedIds = new Set(completedLevels.value.map(l => l.levelId))

    console.debug('[questStore] 🔄 nodeStatusMap recalculating:', {
      completedIds: Array.from(completedIds),
      totalNodes: mapNodes.value.length,
    })

    for (const node of mapNodes.value) {
      if (completedIds.has(node.id)) {
        statusMap.set(node.id, 'completed')
      } else if (node.prerequisites?.every(p => completedIds.has(p)) ?? true) {
        statusMap.set(node.id, 'available')
      } else {
        statusMap.set(node.id, 'locked')
      }
    }

    let foundCurrent = false
    for (const node of mapNodes.value) {
      if (statusMap.get(node.id) === 'available' && !foundCurrent) {
        statusMap.set(node.id, 'current')
        foundCurrent = true
      }
    }

    console.debug('[questStore] ✅ nodeStatusMap calculated:', {
      completed: Array.from(statusMap.entries()).filter(([, v]) => v === 'completed').map(([k]) => k),
      current: Array.from(statusMap.entries()).find(([, v]) => v === 'current')?.[0],
      available: Array.from(statusMap.entries()).filter(([, v]) => v === 'available').map(([k]) => k),
      locked: Array.from(statusMap.entries()).filter(([, v]) => v === 'locked').map(([k]) => k),
    })

    return statusMap
  })

  function setQuest(questData: Quest) {
    console.debug('[questStore] 🆕 setQuest:', {
      questId: questData.id,
      title: questData.title,
      knowledgeNodes: questData.knowledgeNodes.length,
      questions: questData.questions.length,
    })

    quest.value = questData
    currentQuestId.value = questData.id
    if (questData.mapConfig.startingNode) {
      unlockedLevels.value = [questData.mapConfig.startingNode]
      console.debug('[questStore] 🚪 Starting node unlocked:', questData.mapConfig.startingNode)
    }
    saveQuestData(questData)
    saveToStorage()
  }

  function saveQuestData(questData: Quest) {
    localStorage.setItem(`${QUEST_DATA_PREFIX}${questData.id}`, JSON.stringify(questData))

    const existing = savedQuests.value.find(q => q.id === questData.id)
    const meta: QuestMeta = {
      id: questData.id,
      title: questData.title,
      createdAt: questData.createdAt,
      nodeCount: questData.mapConfig.nodes.length,
      questionCount: questData.questions.length,
      completedCount: existing?.completedCount ?? 0,
    }

    if (existing) {
      Object.assign(existing, meta)
    } else {
      savedQuests.value.unshift(meta)
    }
    localStorage.setItem(QUEST_LIST_KEY, JSON.stringify(savedQuests.value))
  }

  function loadSavedQuests() {
    const raw = localStorage.getItem(QUEST_LIST_KEY)
    if (!raw) {
      savedQuests.value = []
      return
    }
    try {
      const list = JSON.parse(raw) as QuestMeta[]
      savedQuests.value = list.map(meta => {
        const progressRaw = localStorage.getItem(`lq_quest_${meta.id}`)
        let completedCount = 0
        if (progressRaw) {
          try {
            const progress = JSON.parse(progressRaw)
            completedCount = progress.completedLevels?.length ?? 0
          } catch { /* ignore */ }
        }
        return { ...meta, completedCount }
      })
    } catch (e) {
      console.error('[questStore] Failed to load quest list:', e)
      savedQuests.value = []
    }
  }

  function loadQuest(questId: string): boolean {
    const raw = localStorage.getItem(`${QUEST_DATA_PREFIX}${questId}`)
    if (!raw) return false
    try {
      const questData = JSON.parse(raw) as Quest
      quest.value = questData
      currentQuestId.value = questId
      loadFromStorage(questId)
      return true
    } catch (e) {
      console.error('[questStore] Failed to load quest data:', e)
      return false
    }
  }

  function deleteQuest(questId: string) {
    localStorage.removeItem(`${QUEST_DATA_PREFIX}${questId}`)
    localStorage.removeItem(`lq_quest_${questId}`)
    savedQuests.value = savedQuests.value.filter(q => q.id !== questId)
    localStorage.setItem(QUEST_LIST_KEY, JSON.stringify(savedQuests.value))

    if (currentQuestId.value === questId) {
      $reset()
    }
  }

  function completeLevel(levelId: string, stars: number, score: number, time: number) {
    console.debug('[questStore] 🏆 completeLevel:', {
      levelId,
      stars,
      score,
      time,
      existingCompleted: completedLevels.value.map(l => l.levelId),
    })

    const existing = completedLevels.value.find(l => l.levelId === levelId)
    if (existing) {
      console.debug('[questStore] 📈 Updating existing level progress:', {
        levelId,
        oldStars: existing.stars,
        newStars: stars,
        oldBestScore: existing.bestScore,
        newBestScore: score,
        oldBestTime: existing.bestTime,
        newBestTime: time,
      })
      
      if (stars > existing.stars) existing.stars = stars
      if (score > existing.bestScore) existing.bestScore = score
      if (time < existing.bestTime) existing.bestTime = time
      existing.attempts++
    } else {
      completedLevels.value.push({
        levelId,
        stars,
        bestScore: score,
        bestTime: time,
        attempts: 1,
      })
      console.debug('[questStore] 🎉 New level completed:', {
        levelId,
        stars,
        completedCount: completedLevels.value.length,
      })
    }

    const node = mapNodes.value.find(n => n.id === levelId)
    if (node?.unlocks) {
      console.debug('[questStore] 🔓 Processing level unlocks:', {
        levelId,
        unlocks: node.unlocks,
        currentlyUnlocked: unlockedLevels.value,
      })

      for (const unlockId of node.unlocks) {
        if (!unlockedLevels.value.includes(unlockId)) {
          unlockedLevels.value.push(unlockId)
          console.debug('[questStore] ✅ Level unlocked:', {
            levelId: unlockId,
            nodeName: mapNodes.value.find(n => n.id === unlockId)?.name,
          })
        }
      }
    }

    saveToStorage()

    const meta = savedQuests.value.find(q => q.id === currentQuestId.value)
    if (meta) {
      meta.completedCount = completedLevels.value.length
      localStorage.setItem(QUEST_LIST_KEY, JSON.stringify(savedQuests.value))
    }

    console.debug('[questStore] ✅ completeLevel finished:', {
      totalCompleted: completedLevels.value.length,
      totalUnlocked: unlockedLevels.value.length,
    })
  }

  function collectFragment(fragmentId: string) {
    if (!collectedFragments.value.includes(fragmentId)) {
      collectedFragments.value.push(fragmentId)
      console.debug('[questStore] 🧩 Fragment collected:', {
        fragmentId,
        collectedCount: collectedFragments.value.length,
        totalFragments: allFragments.value.length,
      })
      saveToStorage()
    }
  }

  function isLevelCompleted(levelId: string): boolean {
    const result = completedLevels.value.some(l => l.levelId === levelId)
    return result
  }

  function getLevelProgress(levelId: string): LevelProgress | undefined {
    return completedLevels.value.find(l => l.levelId === levelId)
  }

  function saveToStorage() {
    if (!currentQuestId.value) return
    const data = {
      currentQuestId: currentQuestId.value,
      completedLevels: completedLevels.value,
      collectedFragments: collectedFragments.value,
      unlockedLevels: unlockedLevels.value,
    }
    localStorage.setItem(`lq_quest_${currentQuestId.value}`, JSON.stringify(data))
  }

  function loadFromStorage(questId: string) {
    const raw = localStorage.getItem(`lq_quest_${questId}`)
    if (raw) {
      try {
        const data = JSON.parse(raw)
        currentQuestId.value = data.currentQuestId ?? questId
        completedLevels.value = data.completedLevels ?? []
        collectedFragments.value = data.collectedFragments ?? []
        unlockedLevels.value = data.unlockedLevels ?? []
        
        console.debug('[questStore] 📂 Data loaded from storage:', {
          questId,
          completedLevels: completedLevels.value.length,
          collectedFragments: collectedFragments.value.length,
          unlockedLevels: unlockedLevels.value.length,
        })
      } catch (e) {
        console.error('[questStore] ❌ Failed to load quest data:', e)
      }
    }
  }

  function $reset() {
    currentQuestId.value = null
    quest.value = null
    completedLevels.value = []
    collectedFragments.value = []
    unlockedLevels.value = []
  }

  return {
    currentQuestId,
    quest,
    completedLevels,
    collectedFragments,
    unlockedLevels,
    savedQuests,
    mapNodes,
    allQuestions,
    allFragments,
    nodeStatusMap,
    setQuest,
    completeLevel,
    collectFragment,
    isLevelCompleted,
    getLevelProgress,
    saveToStorage,
    loadFromStorage,
    loadSavedQuests,
    loadQuest,
    deleteQuest,
    $reset,
  }
})
