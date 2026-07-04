import api from './api'
import type { UserProgress, UserStats } from '@/types/user.types'

export const userService = {
  async getProfile(): Promise<UserProgress> {
    return api.get('/user/profile')
  },

  async updateProfile(data: Partial<UserProgress>): Promise<UserProgress> {
    return api.put('/user/profile', data)
  },

  async getStats(): Promise<UserStats> {
    return api.get('/user/stats')
  },
}
