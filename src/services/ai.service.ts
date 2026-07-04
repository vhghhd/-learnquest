import api from './api'

export const aiService = {
  async extractKnowledge(content: string): Promise<{ topics: unknown[] }> {
    return api.post('/ai/extract-knowledge', { content })
  },

  async generateQuestions(knowledgeNode: unknown, count = 3): Promise<{ questions: unknown[] }> {
    return api.post('/ai/generate-questions', { knowledgeNode, count })
  },
}
