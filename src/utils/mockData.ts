import type { Quest, KnowledgeNode, Question, MapNode, Fragment, MapConfig } from '@/types/quest.types'
import { buildMapLayout } from './mapLayout'
import { AI_CONFIG } from './constants'
import { generateId } from './formatters'

const MOCK_TOPICS: { name: string; summary: string; prerequisites: string[] }[] = [
  { name: '基础概念', summary: '学习的基础定义和核心原理', prerequisites: [] },
  { name: '核心理论', summary: '理解领域的核心理论框架', prerequisites: ['kn_001'] },
  { name: '实践应用', summary: '将理论应用到实际场景', prerequisites: ['kn_002'] },
  { name: '进阶技巧', summary: '掌握高级技巧和最佳实践', prerequisites: ['kn_002'] },
  { name: '综合案例', summary: '综合运用所学知识解决复杂问题', prerequisites: ['kn_003', 'kn_004'] },
]

const MOCK_QUESTION_TEMPLATES: Record<string, { stem: string; options: Record<string, string>; correct: string; explanation: string }[]> = {
  '基础概念': [
    {
      stem: '以下哪个是学习的基本特征？',
      options: { A: '被动接受', B: '主动构建', C: '机械记忆', D: '重复练习' },
      correct: 'B',
      explanation: '学习是一个主动构建知识的过程，而不是被动接受。'
    },
    {
      stem: '学习的本质是什么？',
      options: { A: '获取信息', B: '改变行为', C: '存储知识', D: '通过经验改变认知' },
      correct: 'D',
      explanation: '学习的本质是通过经验引起的认知或行为的持久改变。'
    },
    {
      stem: '学习可以分为哪两大类？',
      options: { A: '理论学习和实践学习', B: '接受学习和发现学习', C: '课堂学习和自学', D: '知识学习和技能学习' },
      correct: 'B',
      explanation: '学习主要分为接受学习（被动接受知识）和发现学习（主动探索）。'
    }
  ],
  '核心理论': [
    {
      stem: '建构主义学习理论强调什么？',
      options: { A: '教师主导', B: '学生主动建构', C: '知识灌输', D: '题海战术' },
      correct: 'B',
      explanation: '建构主义强调学习者主动构建自己的知识体系。'
    },
    {
      stem: '认知负荷理论认为学习效率取决于什么？',
      options: { A: '学习时间', B: '认知资源分配', C: '学习环境', D: '学习动机' },
      correct: 'B',
      explanation: '认知负荷理论认为学习效率取决于如何有效分配有限的认知资源。'
    },
    {
      stem: '以下哪个理论强调"最近发展区"？',
      options: { A: '行为主义', B: '认知主义', C: '建构主义', D: '社会文化理论' },
      correct: 'D',
      explanation: '维果茨基的社会文化理论提出了"最近发展区"概念。'
    }
  ],
  '实践应用': [
    {
      stem: '在实践应用中，以下哪种方法最有效？',
      options: { A: '看演示', B: '听讲解', C: '动手操作', D: '阅读资料' },
      correct: 'C',
      explanation: '动手操作能加深理解，提高知识的迁移能力。'
    },
    {
      stem: '知识迁移的关键是什么？',
      options: { A: '重复练习', B: '理解原理', C: '死记硬背', D: '大量做题' },
      correct: 'B',
      explanation: '理解原理是实现知识迁移的关键，而不是机械重复。'
    },
    {
      stem: '如何将理论知识应用到新场景？',
      options: { A: '照搬公式', B: '寻找相似性', C: '依赖经验', D: '随机尝试' },
      correct: 'B',
      explanation: '应用知识的关键是识别新场景与原有知识的相似性。'
    }
  ],
  '进阶技巧': [
    {
      stem: '深度练习的核心是什么？',
      options: { A: '练习时长', B: '专注于薄弱环节', C: '练习频率', D: '练习环境' },
      correct: 'B',
      explanation: '深度练习专注于自己的薄弱环节，而不是简单重复。'
    },
    {
      stem: '间隔重复法的原理是什么？',
      options: { A: '频繁复习', B: '在遗忘前复习', C: '一次性记牢', D: '考前突击' },
      correct: 'B',
      explanation: '间隔重复法利用记忆曲线，在即将遗忘时进行复习。'
    },
    {
      stem: '以下哪个不是高效学习的技巧？',
      options: { A: '主动回忆', B: '费曼技巧', C: '被动阅读', D: '思维导图' },
      correct: 'C',
      explanation: '被动阅读是低效的学习方式，主动参与才是关键。'
    }
  ],
  '综合案例': [
    {
      stem: '面对复杂问题，第一步应该做什么？',
      options: { A: '直接解决', B: '拆解问题', C: '寻求帮助', D: '放弃尝试' },
      correct: 'B',
      explanation: '面对复杂问题，应该先拆解成可管理的小问题。'
    },
    {
      stem: '综合应用知识时，最需要什么能力？',
      options: { A: '记忆力', B: '创造力', C: '整合能力', D: '计算能力' },
      correct: 'C',
      explanation: '综合应用需要将不同领域的知识整合起来解决问题。'
    },
    {
      stem: '在案例分析中，如何验证解决方案？',
      options: { A: '凭直觉', B: '理论推导', C: '实践检验', D: '他人认可' },
      correct: 'C',
      explanation: '解决方案需要通过实践来检验是否有效。'
    }
  ]
}

export function generateMockQuest(content: string): Quest {
  const knowledgeNodes: KnowledgeNode[] = MOCK_TOPICS.map((topic, index) => ({
    id: `kn_${String(index + 1).padStart(3, '0')}`,
    name: topic.name,
    summary: topic.summary,
    difficulty: Math.min(5, index + 1) as 1 | 2 | 3 | 4 | 5,
    prerequisites: topic.prerequisites,
  }))

  const questions: Question[] = []
  knowledgeNodes.forEach(node => {
    const templates = MOCK_QUESTION_TEMPLATES[node.name] || MOCK_QUESTION_TEMPLATES['基础概念']
    const questionCount = Math.min(AI_CONFIG.QUESTIONS_PER_NODE, Math.ceil(AI_CONFIG.MAX_QUESTIONS_PER_QUEST / knowledgeNodes.length))
    
    for (let i = 0; i < questionCount && i < templates.length; i++) {
      const template = templates[i]
      questions.push({
        id: `q_${node.id}_${i}`,
        knowledgeNodeId: node.id,
        stem: template.stem,
        options: template.options,
        correctAnswer: template.correct,
        explanation: template.explanation,
        difficulty: node.difficulty,
        type: 'choice',
      })
    }
  })

  const mapNodes: MapNode[] = buildMapLayout(knowledgeNodes)
  
  const paths = mapNodes.flatMap(node => 
    node.unlocks.map(targetId => ({
      from: node.id,
      to: targetId,
    }))
  )

  const mapConfig: MapConfig = {
    nodes: mapNodes,
    paths,
    startingNode: mapNodes[0]?.id || '',
  }

  const fragments: Fragment[] = knowledgeNodes.map(node => ({
    id: `frag_${node.id}`,
    name: node.name,
    knowledgeNodeId: node.id,
    rarity: Math.random() < 0.1 ? 'legendary' : Math.random() < 0.3 ? 'rare' : 'common',
    description: node.summary,
  }))

  return {
    id: generateId('qst'),
    title: content.length > 20 ? content.slice(0, 20) + '...' : content || '学习冒险',
    rawContent: content,
    status: 'ready',
    knowledgeNodes,
    questions,
    mapConfig,
    fragments,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export async function simulateAIGeneration(content: string, onProgress?: (stage: string, progress: number) => void): Promise<Quest> {
  if (onProgress) {
    onProgress('分析内容', 10)
    await delay(500)
    
    onProgress('抽取知识点', 30)
    await delay(800)
    
    onProgress('生成题目', 60)
    await delay(1000)
    
    onProgress('构建地图', 80)
    await delay(600)
    
    onProgress('生成碎片', 95)
    await delay(400)
  }
  
  return generateMockQuest(content)
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
