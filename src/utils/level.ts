import { GAME_CONFIG } from './constants'

export function xpToNextLevel(level: number): number {
  return Math.floor(
    GAME_CONFIG.BASE_XP_PER_LEVEL * Math.pow(level, GAME_CONFIG.XP_GROWTH_FACTOR)
  )
}

export function totalXPForLevel(level: number): number {
  let total = 0
  for (let i = 1; i < level; i++) {
    total += xpToNextLevel(i)
  }
  return total
}

export function calculateLevel(totalXP: number): { level: number; currentXP: number; xpNeeded: number } {
  let level = 1
  let remaining = totalXP

  while (remaining >= xpToNextLevel(level)) {
    remaining -= xpToNextLevel(level)
    level++
    if (level >= GAME_CONFIG.MAX_LEVEL) break
  }

  return {
    level,
    currentXP: remaining,
    xpNeeded: xpToNextLevel(level),
  }
}
