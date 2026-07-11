import type { Quest, KnowledgeNode, Question, Fragment, MapConfig } from '@/types/quest.types'
import { buildMapLayout } from './mapLayout'
import { AI_CONFIG } from './constants'
import { generateId } from './formatters'
import { generateMockQuest } from './mockData'

const API_KEY_STORAGE = 'lq_deepseek_api_key'
const API_BASE_URL = 'https://api.deepseek.com/v1'

export function getApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE) || ''
}

export function setApiKey(key: string): void {
  localStorage.setItem(API_KEY_STORAGE, key)
}

export function clearApiKey(): void {
  localStorage.removeItem(API_KEY_STORAGE)
}

export function hasApiKey(): boolean {
  return getApiKey().length > 0
}

export function validateApiKeyFormat(key: string): boolean {
  const trimmed = key.trim()
  if (!trimmed) return false
  if (!trimmed.startsWith('sk-')) return false
  if (trimmed.length < 10) return false
  const validChars = /^[a-zA-Z0-9_-]+$/
  return validChars.test(trimmed.slice(3))
}

export async function testApiConnection(key: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch(`${AI_CONFIG.API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key.trim()}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.MODEL_NAME,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
        temperature: 0,
        stream: false,
      }),
    })

    if (response.status === 401) {
      return { ok: false, error: 'API Key 无效或已过期' }
    }
    if (response.status === 429) {
      return { ok: false, error: '请求过于频繁，请稍后再试' }
    }
    if (!response.ok) {
      const text = await response.text()
      let msg = `连接失败 (${response.status})`
      try {
        const json = JSON.parse(text)
        msg = json.error?.message || msg
      } catch {
        // ignore
      }
      return { ok: false, error: msg }
    }

    const data = await response.json()
    if (data.choices && data.choices.length > 0) {
      return { ok: true }
    }
    return { ok: false, error: '返回数据格式异常' }
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('fetch')) {
      return { ok: false, error: '网络连接失败，请检查网络' }
    }
    return { ok: false, error: err instanceof Error ? err.message : '未知错误' }
  }
}

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

async function callDeepSeek(messages: DeepSeekMessage[], temperature = 0.7): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('未配置 DeepSeek API Key，请先在设置中填写')
  }

  const response = await fetch(`${API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: AI_CONFIG.MODEL_NAME,
      messages,
      temperature,
      max_tokens: 4096,
      stream: false,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMsg = `API 请求失败 (${response.status})`
    try {
      const errorJson = JSON.parse(errorText)
      errorMsg = errorJson.error?.message || errorMsg
    } catch {
      errorMsg = errorText || errorMsg
    }
    throw new Error(errorMsg)
  }

  const data: DeepSeekResponse = await response.json()
  return data.choices[0]?.message?.content || ''
}

interface AIKnowledgeNode {
  name: string
  summary: string
  difficulty: number
  prerequisites: string[]
}

interface AIQuestion {
  knowledgeNodeName: string
  stem: string
  options: Record<string, string>
  correctAnswer: string
  explanation: string
  difficulty: number
  type: 'choice' | 'true_false'
}

async function extractKnowledgeNodes(
  content: string,
  onProgress?: (stage: string, progress: number) => void
): Promise<AIKnowledgeNode[]> {
  onProgress?.('分析内容，抽取知识点', 15)

  const systemPrompt = `你是一个知识架构师。请分析用户提供的文本内容，提取出 4-6 个核心知识点，形成一个由浅入深的学习路径。

要求：
1. 知识点名称简洁（2-6个字）
2. 按学习难度从低到高排列
3. prerequisites 引用前序知识点的 name（第一个为空数组）
4. difficulty 从 1 到 5 递增

请以 JSON 数组格式返回，不要包含任何其他文字：
[
  {"name": "知识点名称", "summary": "一句话描述", "difficulty": 1, "prerequisites": []},
  ...
]`

  const result = await callDeepSeek([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: content },
  ], 0.3)

  const nodes = parseJsonResponse<AIKnowledgeNode[]>(result)
  if (!nodes || nodes.length === 0) {
    throw new Error('知识点抽取失败：AI 返回数据为空')
  }
  return nodes
}

async function generateQuestionsForNode(
  node: AIKnowledgeNode,
  content: string,
  _onProgress?: (stage: string, progress: number) => void
): Promise<AIQuestion[]> {
  const questionCount = AI_CONFIG.QUESTIONS_PER_NODE

  const systemPrompt = `你是一位出题专家。请基于以下学习内容，为知识点"${node.name}"生成 ${questionCount} 道选择题。

要求：
1. 题目难度与知识点难度 ${node.difficulty} 匹配
2. 每题 4 个选项（A/B/C/D）
3. 只有一个正确答案
4. 提供简洁的解析说明
5. 题目应考察理解能力，避免死记硬背

请以 JSON 数组格式返回，不要包含任何其他文字：
[
  {
    "knowledgeNodeName": "${node.name}",
    "stem": "题干",
    "options": {"A": "选项A", "B": "选项B", "C": "选项C", "D": "选项D"},
    "correctAnswer": "A",
    "explanation": "解析",
    "difficulty": ${node.difficulty},
    "type": "choice"
  }
]`

  const result = await callDeepSeek([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `学习内容：\n${content}\n\n知识点：${node.name} - ${node.summary}` },
  ], 0.5)

  const questions = parseJsonResponse<AIQuestion[]>(result)
  if (!questions || questions.length === 0) {
    throw new Error(`题目生成失败：知识点 "${node.name}" 无返回数据`)
  }
  return questions
}

function parseJsonResponse<T>(raw: string): T | null {
  let text = raw.trim()
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    text = jsonMatch[1].trim()
  }

  const start = text.indexOf('[')
  const startObj = text.indexOf('{')
  if (start === -1 && startObj === -1) {
    return null
  }

  try {
    return JSON.parse(text) as T
  } catch {
    if (start !== -1) {
      const end = text.lastIndexOf(']')
      if (end > start) {
        try {
          return JSON.parse(text.slice(start, end + 1)) as T
        } catch {
          // continue
        }
      }
    }
    if (startObj !== -1) {
      const end = text.lastIndexOf('}')
      if (end > startObj) {
        try {
          return JSON.parse(text.slice(startObj, end + 1)) as T
        } catch {
          // continue
        }
      }
    }
  }
  return null
}

export async function generateQuestWithAI(
  content: string,
  onProgress?: (stage: string, progress: number) => void
): Promise<Quest> {
  if (!hasApiKey()) {
    throw new Error('未配置 DeepSeek API Key')
  }

  onProgress?.('开始分析内容', 5)

  const aiNodes = await extractKnowledgeNodes(content, onProgress)

  onProgress?.('知识点抽取完成', 30)

  const knowledgeNodes: KnowledgeNode[] = aiNodes.map((node, index) => ({
    id: `kn_${String(index + 1).padStart(3, '0')}`,
    name: node.name,
    summary: node.summary,
    difficulty: Math.min(5, Math.max(1, node.difficulty)) as 1 | 2 | 3 | 4 | 5,
    prerequisites: node.prerequisites || [],
  }))

  const nameToId = new Map(knowledgeNodes.map(n => [n.name, n.id]))
  for (const node of knowledgeNodes) {
    node.prerequisites = node.prerequisites
      .map(name => nameToId.get(name) || '')
      .filter(id => id !== '')
  }

  const allQuestions: Question[] = []
  const nodeCount = knowledgeNodes.length
  let processedCount = 0

  for (const knNode of knowledgeNodes) {
    const aiNode = aiNodes.find(n => n.name === knNode.name)!
    onProgress?.(`生成题目: ${knNode.name}`, 30 + Math.round((processedCount / nodeCount) * 50))

    let aiQuestions: AIQuestion[]
    try {
      aiQuestions = await generateQuestionsForNode(aiNode, content, onProgress)
    } catch (err) {
      console.warn(`知识点 "${knNode.name}" 题目生成失败，跳过:`, err)
      aiQuestions = []
    }

    for (let i = 0; i < aiQuestions.length; i++) {
      const q = aiQuestions[i]
      allQuestions.push({
        id: `q_${knNode.id}_${i}`,
        knowledgeNodeId: knNode.id,
        stem: q.stem,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: Math.min(5, Math.max(1, q.difficulty || knNode.difficulty)) as 1 | 2 | 3 | 4 | 5,
        type: q.type || 'choice',
      })
    }

    processedCount++
  }

  if (allQuestions.length === 0) {
    throw new Error('所有知识点题目生成失败，请检查 API Key 或网络后重试')
  }

  onProgress?.('构建冒险地图', 85)

  const mapNodes = buildMapLayout(knowledgeNodes)
  const paths = mapNodes.flatMap(node =>
    node.unlocks.map(targetId => ({ from: node.id, to: targetId }))
  )

  const mapConfig: MapConfig = {
    nodes: mapNodes,
    paths,
    startingNode: mapNodes[0]?.id || '',
  }

  const fragments: Fragment[] = knowledgeNodes.map(node => {
    const hash = node.id.charCodeAt(4) + node.id.charCodeAt(5)
    const rarity = hash % 10 === 0 ? 'legendary' : hash % 4 === 0 ? 'rare' : 'common'
    return {
      id: `frag_${node.id}`,
      name: node.name,
      knowledgeNodeId: node.id,
      rarity,
      description: node.summary,
    }
  })

  onProgress?.('生成完成', 100)

  return {
    id: generateId('qst'),
    title: content.length > 20 ? content.slice(0, 20) + '...' : content || '学习冒险',
    rawContent: content,
    status: 'ready',
    knowledgeNodes,
    questions: allQuestions,
    mapConfig,
    fragments,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export async function generateQuest(
  content: string,
  onProgress?: (stage: string, progress: number) => void
): Promise<Quest> {
  if (hasApiKey()) {
    try {
      return await generateQuestWithAI(content, onProgress)
    } catch (error) {
      console.error('DeepSeek API 调用失败，降级使用 Mock 数据:', error)
      onProgress?.('AI 调用失败，使用示例数据', 50)
      await new Promise(resolve => setTimeout(resolve, 800))
      return generateMockQuest(content)
    }
  } else {
    onProgress?.('未配置 API Key，使用示例数据', 30)
    await new Promise(resolve => setTimeout(resolve, 600))
    return generateMockQuest(content)
  }
}
