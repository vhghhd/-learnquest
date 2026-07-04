export type Difficulty = 1 | 2 | 3 | 4 | 5

export type QuestionType = 'choice' | 'true_false' | 'fill_blank'

export interface KnowledgeNode {
  id: string
  name: string
  summary: string
  difficulty: Difficulty
  prerequisites: string[]
}

export interface Question {
  id: string
  knowledgeNodeId: string
  stem: string
  options: Record<string, string>
  correctAnswer: string
  explanation: string
  difficulty: Difficulty
  type: QuestionType
}

export type NodeType = 'normal' | 'boss' | 'timed' | 'hidden'

export type NodeStatus = 'locked' | 'available' | 'current' | 'completed'

export interface MapNodeReward {
  xp: number
  coins: number
  fragments: string[]
}

export interface MapNode {
  id: string
  knowledgeNodeId: string
  name: string
  x: number
  y: number
  layer: number
  type: NodeType
  questionIds: string[]
  estimatedTime: number
  reward: MapNodeReward
  unlocks: string[]
  prerequisites?: string[]
}

export interface MapPath {
  from: string
  to: string
}

export interface MapConfig {
  nodes: MapNode[]
  paths: MapPath[]
  startingNode: string
}

export type Rarity = 'common' | 'rare' | 'legendary'

export interface Fragment {
  id: string
  name: string
  knowledgeNodeId: string
  rarity: Rarity
  image?: string
  description: string
}

export type QuestStatus = 'generating' | 'ready' | 'failed'

export interface Quest {
  id: string
  title: string
  rawContent: string
  status: QuestStatus
  knowledgeNodes: KnowledgeNode[]
  questions: Question[]
  mapConfig: MapConfig
  fragments: Fragment[]
  createdAt: number
  updatedAt: number
}

export interface LevelProgress {
  levelId: string
  stars: number
  bestScore: number
  bestTime: number
  attempts: number
}

export interface CreateQuestRequest {
  title?: string
  content: string
  options?: {
    difficulty?: 'easy' | 'medium' | 'hard'
    questionCount?: number
  }
}

export interface CreateQuestResponse {
  questId: string
  status: QuestStatus
  estimatedTime?: number
}
