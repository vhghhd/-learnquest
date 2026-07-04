import api from './api'
import type { CreateQuestRequest, CreateQuestResponse, Quest } from '@/types/quest.types'

export const questService = {
  async createQuest(data: CreateQuestRequest): Promise<CreateQuestResponse> {
    return api.post('/quests', data)
  },

  async getQuest(questId: string): Promise<Quest> {
    return api.get(`/quests/${questId}`)
  },

  async getQuestStatus(questId: string): Promise<{ status: string; progress?: number }> {
    return api.get(`/quests/${questId}/status`)
  },

  async regenerateQuest(questId: string): Promise<CreateQuestResponse> {
    return api.post(`/quests/${questId}/regenerate`)
  },

  async completeLevel(
    questId: string,
    levelId: string,
    data: unknown
  ): Promise<{ success: boolean; rewards?: unknown }> {
    return api.post(`/quests/${questId}/levels/${levelId}/complete`, data)
  },
}
