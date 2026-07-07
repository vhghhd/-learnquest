export const GAME_CONFIG = {
  INITIAL_HEARTS: 5,
  MAX_HEARTS: 5,
  HEART_RECOVERY_MINUTES: 30,
  HEART_COST_COINS: 10,

  BASE_XP_PER_LEVEL: 100,
  XP_GROWTH_FACTOR: 1.5,
  MAX_LEVEL: 100,

  XP_PER_CORRECT_NORMAL: 10,
  XP_PER_CORRECT_BOSS: 30,
  COINS_PER_CORRECT: 5,
  FIRST_CLEAR_XP_BONUS: 50,
  THREE_STAR_XP_BONUS: 20,

  STAR_THRESHOLDS: {
    ONE_STAR: 0.4,
    TWO_STAR: 0.7,
    THREE_STAR: 0.9,
    THREE_STAR_TIME_RATIO: 0.7,
  },

  STREAK_XP_BONUS_PER_DAY: 5,
  MAX_STREAK_BONUS: 50,
} as const

export const AI_CONFIG = {
  MIN_CONTENT_LENGTH: 100,
  MAX_CONTENT_LENGTH: 10000,
  MAX_QUESTIONS_PER_QUEST: 30,
  WORDS_PER_KNOWLEDGE_NODE: 500,
  QUESTIONS_PER_NODE: 3,
  QUESTION_TYPE_RATIO: {
    choice: 0.7,
    true_false: 0.3,
  },
  API_TIMEOUT_MS: 60000,
  MAX_RETRIES: 2,
  BATCH_SIZE: 5,
  MODEL_NAME: 'deepseek-chat',
} as const

export const MAP_CONFIG = {
  NODE_SIZE: 56,
  NODE_RADIUS: 28,
  LAYER_WIDTH: 180,
  LAYER_HEIGHT: 120,
  START_X: 90,
  START_Y: 60,
  BOSS_NODE_INTERVAL: 5,
  PATH_WIDTH: 3,
  ZOOM_MIN: 0.5,
  ZOOM_MAX: 2,
  ZOOM_DEFAULT: 1,
} as const

export const FRAGMENT_CONFIG = {
  RARITY_RATIO: {
    common: 0.7,
    rare: 0.25,
    legendary: 0.05,
  },
  RARITY_COLORS: {
    common: '#94a3b8',
    rare: '#f59e0b',
    legendary: '#8b5cf6',
  },
  RARITY_XP_BONUS: {
    common: 10,
    rare: 30,
    legendary: 100,
  },
} as const

export const STORAGE_KEYS = {
  USER: 'lq_user',
  QUEST_PREFIX: 'lq_quest_',
  QUEST_LIST: 'lq_quest_list',
} as const

export const ROUTES = {
  HOME: '/',
  QUEST_MAP: (id: string) => `/quest/${id}/map`,
  QUEST_LEVEL: (id: string, levelId: string) => `/quest/${id}/level/${levelId}`,
  QUEST_RESULT: (id: string, levelId: string) => `/quest/${id}/result/${levelId}`,
  QUEST_CODEX: (id: string) => `/quest/${id}/codex`,
  STATS: '/stats',
  PROFILE: '/profile',
} as const
