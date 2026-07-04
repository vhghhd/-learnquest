export interface AvatarConfig {
  hat?: string
  cape?: string
  pet?: string
  skin?: string
}

export interface UserProgress {
  level: number
  xp: number
  hearts: number
  coins: number
  streak: number
  lastPlayDate: string
  totalQuestions: number
  correctQuestions: number
  totalStudyTime: number
  avatar: AvatarConfig
  achievements: string[]
}

export interface UserStats {
  totalStudyDays: number
  currentStreak: number
  longestStreak: number
  totalQuestions: number
  correctQuestions: number
  accuracyRate: number
  totalStudyTime: number
  totalFragments: number
  completedLevels: number
}
