export interface UserAnswer {
  questionId: string
  selected: string
  correct: boolean
  timeSpent: number
}

export interface LevelResult {
  levelId: string
  stars: number
  score: number
  correctCount: number
  totalCount: number
  totalTime: number
  xpEarned: number
  coinsEarned: number
  fragmentsEarned: string[]
  answers: UserAnswer[]
}

export interface SubmitLevelRequest {
  answers: UserAnswer[]
  totalTime: number
  stars: number
  xpEarned: number
  coinsEarned: number
  fragmentsEarned: string[]
}
