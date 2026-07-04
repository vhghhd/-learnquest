import { GAME_CONFIG } from './constants'

export function calculateStars(
  correctCount: number,
  totalCount: number,
  totalTime: number,
  estimatedTime: number,
  heartsRemaining: number
): number {
  if (heartsRemaining <= 0) return 0
  if (totalCount === 0) return 0

  const accuracy = correctCount / totalCount
  const timeRatio = totalTime / estimatedTime

  let stars = 0
  if (accuracy >= GAME_CONFIG.STAR_THRESHOLDS.ONE_STAR) stars = 1
  if (accuracy >= GAME_CONFIG.STAR_THRESHOLDS.TWO_STAR) stars = 2
  if (
    accuracy >= GAME_CONFIG.STAR_THRESHOLDS.THREE_STAR &&
    timeRatio < GAME_CONFIG.STAR_THRESHOLDS.THREE_STAR_TIME_RATIO
  ) {
    stars = 3
  }

  return stars
}

export function calculateXP(
  correctCount: number,
  isBoss: boolean,
  isFirstClear: boolean,
  stars: number
): number {
  const baseXP = isBoss
    ? correctCount * GAME_CONFIG.XP_PER_CORRECT_BOSS
    : correctCount * GAME_CONFIG.XP_PER_CORRECT_NORMAL

  let bonus = 0
  if (isFirstClear) bonus += GAME_CONFIG.FIRST_CLEAR_XP_BONUS
  if (stars === 3) bonus += GAME_CONFIG.THREE_STAR_XP_BONUS

  return baseXP + bonus
}

export function calculateCoins(correctCount: number): number {
  return correctCount * GAME_CONFIG.COINS_PER_CORRECT
}
