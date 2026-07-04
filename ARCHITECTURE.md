# LearnQuest 系统架构设计文档

> 基于 PRD v1.0 的技术架构细化设计

---

## 1. 总体架构

### 1.1 架构分层

LearnQuest 采用 **前后端分离 + Serverless 架构**，整体分为五层：

```
┌─────────────────────────────────────────────────────────┐
│                    表现层 (Presentation)                  │
│  Vue 3 组件 / 页面 / 路由 / 状态管理 / CSS 动画           │
├─────────────────────────────────────────────────────────┤
│                   接入层 (API Gateway)                    │
│  Cloudflare Workers / Vercel Edge Functions              │
│  路由分发 / 鉴权 / 限流 / CORS / 请求日志                  │
├─────────────────────────────────────────────────────────┤
│                    服务层 (Service)                       │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌──────────────┐ │
│  │ 知识处理  │ │ 游戏引擎  │ │ 用户服务 │ │  AI 服务层    │ │
│  │  服务    │ │  服务    │ │        │ │              │ │
│  └──────────┘ └──────────┘ └─────────┘ └──────────────┘ │
├─────────────────────────────────────────────────────────┤
│                   数据层 (Data Access)                    │
│  Drizzle ORM / Prisma / Kysely                           │
│  连接池 / 事务 / 迁移 / 缓存                              │
├─────────────────────────────────────────────────────────┤
│                    存储层 (Storage)                       │
│  Turso (SQLite) / Supabase (PostgreSQL)                  │
│  Cloudflare KV / R2 (对象存储)                            │
└─────────────────────────────────────────────────────────┘
```

### 1.2 模块划分

| 模块 | 职责 | 技术实现 |
|------|------|----------|
| **知识导入模块** | 文本粘贴 / 文件上传 / URL 抓取 / 内容解析 | 前端表单 + 后端解析服务 |
| **AI 生成模块** | 知识点抽取 / 题目生成 / 知识图谱构建 / 质量校验 | DeepSeek API + Prompt 模板引擎 |
| **冒险地图模块** | 地图渲染 / 节点状态 / 解锁逻辑 / 路径计算 | Canvas 2D / SVG + 状态机 |
| **关卡挑战模块** | 题目展示 / 答题交互 / 计时 / 即时反馈 | Vue 组件 + CSS 动画 + Lottie |
| **角色养成模块** | 等级 / XP / 生命值 / 金币 / 技能树 / 装备 | 状态管理 + 持久化 |
| **收集系统模块** | 知识碎片 / 图鉴 / 稀有度 / 收集进度 | 数据模型 + 卡片组件 |
| **社交模块** | 排行榜 / 学习包分享 / PK 对战 | 后端排名服务 + WebSocket |
| **数据统计模块** | 学习数据 / 正确率趋势 / 掌握度分析 | 图表库 (ECharts / Chart.js) |

---

## 2. 前端架构设计

### 2.1 技术栈确认

| 类别 | 技术选择 | 版本/说明 |
|------|----------|-----------|
| 框架 | Vue 3 | Composition API + `<script setup>` |
| 构建工具 | Vite 5+ | HMR / 按需加载 / Tree Shaking |
| 语言 | TypeScript 5+ | 严格模式 strict: true |
| 样式 | Tailwind CSS 3 | 原子化 CSS + 自定义主题 |
| UI 组件 | Headless UI | 无样式组件 + 自定义样式 |
| 状态管理 | Pinia | 模块化 store + 持久化插件 |
| 路由 | Vue Router 4 | 路由懒加载 + 导航守卫 |
| HTTP 客户端 | axios | 拦截器 / 错误处理 / 重试机制 |
| 图表 | ECharts | 数据看板可视化 |
| 动画 | CSS Animations + Lottie | 答题反馈 / 粒子效果 |
| 地图渲染 | SVG (MVP) / Canvas 2D (后期) | 冒险地图节点渲染 |

### 2.2 目录结构

```
src/
├── assets/              # 静态资源
│   ├── images/
│   ├── lottie/          # Lottie 动画文件
│   └── fonts/
├── components/          # 通用组件
│   ├── common/          # 基础组件 (Button, Card, Modal...)
│   ├── game/            # 游戏相关组件
│   │   ├── HeartBar.vue       # 生命值条
│   │   ├── XPBar.vue          # 经验值进度条
│   │   ├── CoinDisplay.vue    # 金币显示
│   │   ├── StreakBadge.vue    # 连续打卡徽章
│   │   └── LevelBadge.vue     # 等级徽章
│   ├── map/             # 地图组件
│   │   ├── AdventureMap.vue   # 冒险地图容器
│   │   ├── MapNode.vue        # 地图节点
│   │   └── MapPath.vue        # 路径连线
│   ├── question/        # 答题组件
│   │   ├── QuestionCard.vue   # 题目卡片
│   │   ├── ChoiceButton.vue   # 选项按钮
│   │   ├── TimerBar.vue       # 倒计时条
│   │   └── FeedbackEffect.vue # 答对/答错反馈
│   └── fragment/        # 碎片收集组件
│       ├── FragmentCard.vue   # 碎片卡片
│       └── FragmentFlip.vue   # 翻转动画
├── views/               # 页面视图
│   ├── HomeView.vue           # 首页 / 知识导入
│   ├── MapView.vue            # 冒险地图页
│   ├── LevelView.vue          # 关卡挑战页
│   ├── ResultView.vue         # 关卡结算页
│   ├── CodexView.vue          # 知识图鉴页
│   ├── StatsView.vue          # 数据看板页
│   └── ProfileView.vue        # 个人中心页
├── stores/              # Pinia 状态管理
│   ├── user.store.ts          # 用户游戏化状态
│   ├── quest.store.ts         # 当前学习包状态
│   ├── level.store.ts         # 关卡答题状态
│   └── ui.store.ts            # UI 全局状态
├── composables/         # 组合式函数
│   ├── useGameLogic.ts        # 游戏逻辑计算
│   ├── useAI.ts               # AI 服务调用
│   ├── useStorage.ts          # 本地存储封装
│   └── useAnimation.ts        # 动画工具
├── services/            # API 服务层
│   ├── api.ts                 # axios 实例配置
│   ├── quest.service.ts       # 学习包相关接口
│   ├── user.service.ts        # 用户相关接口
│   └── ai.service.ts          # AI 生成相关接口
├── types/               # TypeScript 类型定义
│   ├── user.types.ts          # 用户相关类型
│   ├── quest.types.ts         # 学习包相关类型
│   ├── question.types.ts      # 题目相关类型
│   ├── game.types.ts          # 游戏化相关类型
│   └── api.types.ts           # API 响应类型
├── utils/               # 工具函数
│   ├── level.ts               # 等级/XP 计算
│   ├── difficulty.ts          # 难度算法
│   ├── formatters.ts          # 格式化工具
│   └── constants.ts           # 常量配置
├── router/              # 路由配置
│   └── index.ts
├── styles/              # 全局样式
│   ├── index.css
│   ├── variables.css         # CSS 变量
│   └── animations.css        # 关键帧动画
├── App.vue
└── main.ts
```

### 2.3 路由设计

| 路径 | 页面 | 说明 | 权限 |
|------|------|------|------|
| `/` | HomeView | 首页 / 新建冒险入口 | 公开 |
| `/quest/:id/map` | MapView | 冒险地图页 | 需学习包存在 |
| `/quest/:id/level/:levelId` | LevelView | 关卡挑战页 | 需关卡已解锁 |
| `/quest/:id/result/:levelId` | ResultView | 关卡结算页 | 需关卡已完成 |
| `/quest/:id/codex` | CodexView | 知识图鉴页 | 需学习包存在 |
| `/stats` | StatsView | 学习数据看板 | 公开（本地数据） |
| `/profile` | ProfileView | 个人中心 | 公开（本地数据） |

**路由守卫逻辑：**
- 检查学习包是否存在 → 不存在则重定向到首页
- 检查关卡是否解锁 → 未解锁则重定向到地图页
- MVP 阶段无账号系统，数据存在 localStorage

### 2.4 状态管理 (Pinia Stores)

#### 2.4.1 user.store.ts — 用户游戏化状态

```typescript
interface UserState {
  level: number
  xp: number
  hearts: number
  coins: number
  streak: number
  lastPlayDate: string       // ISO 日期字符串，用于连续打卡判定
  totalQuestionsAnswered: number
  totalCorrectAnswers: number
  totalStudyTime: number     // 秒
  avatar: {
    hat?: string
    cape?: string
    pet?: string
  }
  achievements: string[]     // 成就 ID 列表
}
```

**核心 actions：**
- `addXP(amount: number)` — 增加经验值，自动判定升级
- `loseHeart()` — 扣除生命值
- `addCoins(amount: number)` — 增加金币
- `checkStreak()` — 检查并更新连续打卡天数
- `recordAnswer(correct: boolean, timeSpent: number)` — 记录答题数据
- `saveToStorage()` / `loadFromStorage()` — 本地持久化

#### 2.4.2 quest.store.ts — 学习包状态

```typescript
interface QuestState {
  currentQuestId: string | null
  quest: Quest | null             // 当前学习包完整数据
  completedLevels: LevelProgress[] // 已完成关卡及星级
  collectedFragments: string[]    // 已收集碎片 ID
  unlockedLevels: string[]        // 已解锁关卡 ID
}
```

**核心 actions：**
- `createQuest(content: string)` — 创建新学习包（触发AI生成）
- `loadQuest(questId: string)` — 加载学习包
- `completeLevel(levelId: string, stars: number)` — 完成关卡
- `unlockNextLevels(levelId: string)` — 解锁后续关卡
- `collectFragment(fragmentId: string)` — 收集碎片

#### 2.4.3 level.store.ts — 关卡答题状态

```typescript
interface LevelState {
  currentLevelId: string | null
  questions: Question[]
  currentQuestionIndex: number
  score: number
  correctCount: number
  wrongCount: number
  heartsRemaining: number
  startTime: number
  timeLimit: number | null        // 限时挑战用
  answers: UserAnswer[]           // 用户作答记录
  isFinished: boolean
}
```

**核心 actions：**
- `startLevel(levelId: string)` — 开始关卡
- `submitAnswer(answerId: string)` — 提交答案
- `nextQuestion()` — 下一题
- `finishLevel()` — 结束关卡，计算星级和奖励

### 2.5 核心组件层级

**冒险地图页 (MapView):**
```
MapView
├── TopStatusBar          # 顶部状态栏
│   ├── LevelBadge
│   ├── XPBar
│   ├── HeartBar
│   ├── CoinDisplay
│   └── StreakBadge
├── AdventureMap          # 地图主体
│   ├── MapPath x N       # 路径连线
│   └── MapNode x N       # 地图节点
│       └── NodeTooltip   # 节点悬浮信息
└── BottomNav             # 底部导航
```

**关卡挑战页 (LevelView):**
```
LevelView
├── LevelHeader           # 顶部进度
│   ├── ProgressBar       # 题目进度
│   ├── TimerBar          # 倒计时（限时模式）
│   └── ScoreDisplay
├── BattleArea            # 战斗区域
│   ├── QuestionCard      # 题目卡片
│   │   ├── QuestionText
│   │   └── ChoiceList
│   │       └── ChoiceButton x 4
│   └── CharacterSprite   # 角色/怪兽展示
├── FeedbackEffect        # 即时反馈（叠加层）
│   ├── CorrectEffect     # 答对动画
│   └── WrongEffect       # 答错动画
└── ResultModal           # 结算弹窗（MVP后改为独立页面）
```

---

## 3. 后端架构设计

### 3.1 技术选型确认

| 类别 | 技术选择 | 说明 |
|------|----------|------|
| 运行时 | Cloudflare Workers | Edge 计算，免费额度充足 |
| 框架 | Hono | 轻量 Web 框架，类 Express API |
| 数据库 | Turso (libSQL) | SQLite 兼容，边缘部署，免费 |
| ORM | Drizzle ORM | TypeScript 优先，SQLite 兼容好 |
| AI 服务 | DeepSeek API | 性价比高，支持 JSON 输出 |
| 认证 | 无 (MVP) / JWT (Phase 3) | MVP 本地存储，Phase 3 接账号 |
| 缓存 | Cloudflare KV | 热点数据缓存（生成结果缓存） |
| 对象存储 | Cloudflare R2 | 用户上传文件存储 |

### 3.2 API 接口设计

#### 3.2.1 知识导入与生成

| 方法 | 路径 | 说明 | 优先级 |
|------|------|------|--------|
| POST | `/api/quests` | 创建学习包（传入文本，触发AI生成） | P0 |
| GET | `/api/quests/:id` | 获取学习包详情（含地图、题目） | P0 |
| GET | `/api/quests/:id/status` | 获取学习包生成状态 | P0 |
| POST | `/api/quests/:id/regenerate` | 重新生成知识点/题目 | P1 |
| POST | `/api/quests/upload` | 上传文件创建学习包 | P1 |

**POST /api/quests 请求体:**
```json
{
  "title": "考研政治马原",
  "content": "马克思主义哲学是科学的世界观和方法论...",
  "options": {
    "difficulty": "medium",
    "questionCount": 30
  }
}
```

**POST /api/quests 响应 (202 Accepted):**
```json
{
  "questId": "qst_abc123",
  "status": "generating",
  "estimatedTime": 15
}
```

#### 3.2.2 关卡与答题

| 方法 | 路径 | 说明 | 优先级 |
|------|------|------|--------|
| GET | `/api/quests/:id/levels/:levelId` | 获取关卡详情（题目列表） | P0 |
| POST | `/api/quests/:id/levels/:levelId/complete` | 提交关卡完成结果 | P0 |

**POST /api/quests/:id/levels/:levelId/complete 请求体:**
```json
{
  "answers": [
    { "questionId": "q1", "selected": "A", "correct": true, "timeSpent": 12 },
    { "questionId": "q2", "selected": "C", "correct": false, "timeSpent": 8 }
  ],
  "totalTime": 180,
  "stars": 3,
  "xpEarned": 100,
  "coinsEarned": 50,
  "fragmentsEarned": ["frag_01", "frag_02"]
}
```

#### 3.2.3 用户数据

| 方法 | 路径 | 说明 | 优先级 |
|------|------|------|--------|
| GET | `/api/user/profile` | 获取用户游戏化数据 | P1 |
| PUT | `/api/user/profile` | 更新用户数据 | P1 |
| GET | `/api/user/stats` | 获取学习统计数据 | P1 |

### 3.3 AI 服务层设计

#### 3.3.1 AI 服务模块划分

```
ai/
├── index.ts                 # AI 服务入口
├── client.ts                # DeepSeek API 客户端封装
├── prompts/
│   ├── extract-knowledge.ts  # 知识点抽取 Prompt
│   ├── generate-questions.ts # 题目生成 Prompt
│   ├── build-knowledge-graph.ts # 知识图谱构建 Prompt
│   └── quality-check.ts      # 质量校验 Prompt
├── parsers/
│   ├── knowledge-parser.ts   # 知识点 JSON 解析
│   ├── question-parser.ts    # 题目 JSON 解析
│   └── graph-parser.ts       # 图谱 JSON 解析
├── validators/
│   ├── question-validator.ts # 题目质量校验
│   └── knowledge-validator.ts # 知识点校验
└── cache.ts                 # AI 结果缓存
```

#### 3.3.2 AI 生成流水线 (Pipeline)

```
输入文本
  ↓
[1] 文本预处理
  - 清洗 / 分段 / 去重
  - 估算 token 数量
  ↓
[2] 知识点抽取 (extractKnowledge)
  - Prompt: 提取知识点（名称/摘要/难度/前置依赖）
  - 输出: KnowledgeNode[]
  ↓
[3] 知识图谱构建 (buildGraph)
  - 分析知识点间的依赖关系
  - 组织为层级结构（主题 → 子主题 → 要点）
  - 输出: KnowledgeGraph
  ↓
[4] 题目生成 (generateQuestions)
  - 按知识点分批生成题目
  - 每题: 题干 + 4选项 + 答案 + 解析 + 难度
  - 输出: Question[]
  ↓
[5] 质量校验 (validateQuestions)
  - 检查选项互斥性
  - 检查答案唯一性
  - 检查解析是否对应题目
  - 过滤低质量题目
  ↓
[6] 地图配置生成 (buildMapConfig)
  - 根据知识图谱生成节点坐标
  - 计算节点间路径
  - 分配关卡类型（普通/Boss/限时）
  ↓
[7] 碎片配置生成 (buildFragments)
  - 为每个知识点分配知识碎片
  - 设置稀有度
  ↓
输出完整学习包
```

#### 3.3.3 Prompt 模板设计

**知识点抽取 Prompt:**
```
你是一位专业的课程设计师。请从以下学习内容中提取所有核心知识点。

要求：
1. 每个知识点包含：id、name（名称）、summary（一句话摘要）、difficulty（1-5难度，1最简单）、prerequisites（前置知识点ID数组）
2. 知识点之间有明确的依赖关系，构成学习路径
3. 按从易到难、从基础到高级的顺序组织
4. 输出纯 JSON 格式，不要任何额外解释

学习内容：
{content}

输出格式：
{{
  "topics": [
    {{
      "id": "kn_001",
      "name": "知识点名称",
      "summary": "一句话摘要",
      "difficulty": 2,
      "prerequisites": []
    }}
  ]
}}
```

**题目生成 Prompt:**
```
你是一位专业的出题老师。请基于以下知识点生成 {count} 道选择题。

要求：
1. 每道题包含：id、knowledgeNodeId、stem（题干）、options（4个选项A/B/C/D）、correctAnswer（正确选项字母）、explanation（答案解析）、difficulty（1-5）
2. 选项要具有迷惑性，错误选项要贴近正确答案
3. 答案解析要简明扼要，说明为什么正确
4. 题目难度要对应知识点难度
5. 输出纯 JSON 格式

知识点：
{knowledgeNode}

输出格式：
{{
  "questions": [
    {{
      "id": "q_001",
      "knowledgeNodeId": "kn_001",
      "stem": "题目内容",
      "options": {{
        "A": "选项A内容",
        "B": "选项B内容",
        "C": "选项C内容",
        "D": "选项D内容"
      }},
      "correctAnswer": "A",
      "explanation": "答案解析",
      "difficulty": 2
    }}
  ]
}}
```

---

## 4. 数据模型设计

### 4.1 数据库表结构 (SQLite / Turso)

#### 4.1.1 quests — 学习包表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | 学习包 ID (qst_xxx) |
| title | TEXT | NOT NULL | 学习包名称 |
| raw_content | TEXT | NOT NULL | 原始文本内容 |
| status | TEXT | NOT NULL DEFAULT 'generating' | 生成状态: generating/ready/failed |
| knowledge_nodes | JSON | NOT NULL DEFAULT '[]' | 知识点列表 |
| questions | JSON | NOT NULL DEFAULT '[]' | 题目列表 |
| map_config | JSON | NOT NULL DEFAULT '{}' | 地图配置 |
| fragments_config | JSON | NOT NULL DEFAULT '[]' | 碎片配置 |
| created_at | INTEGER | NOT NULL | 创建时间戳 |
| updated_at | INTEGER | NOT NULL | 更新时间戳 |

#### 4.1.2 user_progress — 用户进度表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键 |
| quest_id | TEXT | NOT NULL | 学习包 ID |
| user_id | TEXT | NOT NULL DEFAULT 'local' | 用户 ID (MVP 固定 local) |
| level | INTEGER | NOT NULL DEFAULT 1 | 用户等级 |
| xp | INTEGER | NOT NULL DEFAULT 0 | 经验值 |
| hearts | INTEGER | NOT NULL DEFAULT 5 | 生命值 |
| coins | INTEGER | NOT NULL DEFAULT 0 | 金币 |
| streak | INTEGER | NOT NULL DEFAULT 0 | 连续打卡天数 |
| last_play_date | TEXT | | 最后游戏日期 (YYYY-MM-DD) |
| completed_levels | JSON | NOT NULL DEFAULT '[]' | 已完成关卡 [{levelId, stars}] |
| collected_fragments | JSON | NOT NULL DEFAULT '[]' | 已收集碎片 ID 列表 |
| total_questions | INTEGER | NOT NULL DEFAULT 0 | 累计答题数 |
| correct_questions | INTEGER | NOT NULL DEFAULT 0 | 正确答题数 |
| total_study_time | INTEGER | NOT NULL DEFAULT 0 | 累计学习时间（秒） |
| avatar_config | JSON | NOT NULL DEFAULT '{}' | 角色外观配置 |
| created_at | INTEGER | NOT NULL | 创建时间 |
| updated_at | INTEGER | NOT NULL | 更新时间 |

**索引：**
- `UNIQUE(quest_id, user_id)` — 每人每个学习包唯一

#### 4.1.3 answer_records — 答题记录表 (用于统计分析)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键 |
| quest_id | TEXT | NOT NULL | 学习包 ID |
| level_id | TEXT | NOT NULL | 关卡 ID |
| question_id | TEXT | NOT NULL | 题目 ID |
| user_id | TEXT | NOT NULL DEFAULT 'local' | 用户 ID |
| is_correct | INTEGER | NOT NULL | 是否正确 (0/1) |
| selected_option | TEXT | | 选择的选项 |
| time_spent | INTEGER | NOT NULL | 答题耗时（秒） |
| created_at | INTEGER | NOT NULL | 答题时间 |

### 4.2 TypeScript 类型定义

```typescript
// types/quest.types.ts
export interface KnowledgeNode {
  id: string
  name: string
  summary: string
  difficulty: 1 | 2 | 3 | 4 | 5
  prerequisites: string[]
}

export interface Question {
  id: string
  knowledgeNodeId: string
  stem: string
  options: Record<string, string>
  correctAnswer: string
  explanation: string
  difficulty: 1 | 2 | 3 | 4 | 5
  type: 'choice' | 'true_false' | 'fill_blank'
}

export interface MapNode {
  id: string
  knowledgeNodeId: string
  name: string
  x: number
  y: number
  type: 'normal' | 'boss' | 'timed' | 'hidden'
  questionIds: string[]
  estimatedTime: number
  reward: {
    xp: number
    coins: number
    fragments: string[]
  }
  unlocks: string[]  // 完成后解锁的节点 ID
}

export interface MapConfig {
  nodes: MapNode[]
  paths: { from: string; to: string }[]
  startingNode: string
}

export interface Fragment {
  id: string
  name: string
  knowledgeNodeId: string
  rarity: 'common' | 'rare' | 'legendary'
  image?: string
  description: string
}

export interface Quest {
  id: string
  title: string
  rawContent: string
  status: 'generating' | 'ready' | 'failed'
  knowledgeNodes: KnowledgeNode[]
  questions: Question[]
  mapConfig: MapConfig
  fragments: Fragment[]
  createdAt: number
  updatedAt: number
}
```

```typescript
// types/user.types.ts
export interface UserProgress {
  level: number
  xp: number
  hearts: number
  coins: number
  streak: number
  lastPlayDate: string
  completedLevels: { levelId: string; stars: number }[]
  collectedFragments: string[]
  totalQuestions: number
  correctQuestions: number
  totalStudyTime: number
  avatar: AvatarConfig
}

export interface AvatarConfig {
  hat?: string
  cape?: string
  pet?: string
  skin?: string
}

export interface LevelProgress {
  levelId: string
  stars: number
  bestScore: number
  bestTime: number
  attempts: number
}
```

```typescript
// types/game.types.ts
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

export type NodeStatus = 'locked' | 'available' | 'current' | 'completed'
```

---

## 5. 核心业务流程细化

### 5.1 学习包创建与生成流程

```
用户粘贴文本 → 点击"生成冒险"
    ↓
前端校验内容长度 (100-10000 字)
    ↓
POST /api/quests → 后端接收
    ↓
创建 quest 记录 (status=generating)
    ↓
返回 questId + 生成中状态
    ↓
前端显示进度动画，轮询 GET /api/quests/:id/status
    ↓
后端异步执行 AI 生成流水线：
  1. 文本预处理
  2. 知识点抽取 (DeepSeek API)
  3. 知识图谱构建
  4. 题目生成 (分批调用 DeepSeek)
  5. 质量校验
  6. 地图配置生成
  7. 碎片配置生成
    ↓
更新 quest 记录 (status=ready，填充所有数据)
    ↓
前端轮询到 status=ready → 跳转冒险地图页
```

**关键参数：**
- 文本长度限制：MVP 阶段 100-10000 字
- 知识点数量：估算 ≈ 每 500 字 1 个知识点
- 每个知识点题目数：MVP 阶段 3 道（2选择+1判断）
- AI 调用超时：单步 30s，总时长 2-3 分钟

### 5.2 答题交互流程

```
用户点击地图节点 → 进入关卡
    ↓
加载题目列表 → 打乱题目顺序
    ↓
初始化关卡状态：
  - currentIndex = 0
  - score = 0
  - correctCount = 0
  - hearts = 当前用户生命值
    ↓
显示第 1 题 → 开始计时
    ↓
用户选择选项 → 锁定按钮 → 校验答案
    ↓
┌───────── 答对? ─────────┐
│ 是                        否
↓                          ↓
XP +10                    生命值 -1
金币 +5                   显示正确答案
怪兽 HP -10               红色闪烁动画
绿色粒子动画                震动效果
                          ↓
                    生命值 = 0?
                    ┌─ 是 ─┴─ 否 ─┐
                    ↓             ↓
                 关卡失败        继续
                 结算页面
                    ↓
            显示解析 (2秒)
                    ↓
            还有下一题?
            ┌─ 是 ─┴─ 否 ─┐
            ↓             ↓
         下一题        关卡结算
```

### 5.3 星级评定算法

```
星级 = f(正确率, 用时)

正确率权重: 70%
用时权重: 30%

星级计算：
  baseStars = floor(正确率 * 3)      // 0-3 星基础分
  timeBonus = if (用时 < 预估时间 * 0.7) 1 else 0  // 速度奖励
  
  最终星级 = min(3, baseStars + timeBonus)

具体规则：
  ★☆☆ (1星): 正确率 ≥ 40%
  ★★☆ (2星): 正确率 ≥ 70%
  ★★★ (3星): 正确率 ≥ 90% 且 用时 < 预估的 70%

特殊：
  - 生命值耗尽 → 强制 0 星，需重新挑战
  - 首次通关 → 额外奖励碎片
```

### 5.4 等级与 XP 计算公式

```
升级所需 XP = baseXP * (level ^ growthFactor)

参数配置：
  baseXP = 100        // 1 级升 2 级所需 XP
  growthFactor = 1.5   // 增长系数

示例：
  Lv1 → Lv2: 100 XP
  Lv2 → Lv3: 100 * 2^1.5 ≈ 283 XP
  Lv3 → Lv4: 100 * 3^1.5 ≈ 520 XP
  Lv5 → Lv6: 100 * 5^1.5 ≈ 1118 XP

XP 获取途径：
  - 答对普通题: +10 XP
  - 答对 Boss 题: +30 XP
  - 首次通关关卡: +50 XP (首通奖励)
  - 三星通关: +20 XP 额外奖励
  - 收集齐一套碎片: +100 XP
```

### 5.5 生命值恢复机制

```
初始生命值: 5

扣除规则：
  - 普通题答错: -1
  - Boss 题答错: -2

恢复规则：
  - 每 30 分钟恢复 1 点 (MVP 阶段可简化)
  - 使用金币购买: 10 金币 / 1 点
  - 观看广告恢复 (后期扩展)
  - MVP 简化: 刷新页面恢复 / 每日重置
```

### 5.6 关卡解锁逻辑

```
节点解锁规则：
  1. 起始节点默认解锁
  2. 完成某节点后，该节点的 unlocks 列表中的所有节点变为"可用"
  3. 如果某节点有多个前置依赖，需全部前置节点完成后才解锁
  4. 隐藏关卡: 完成特定条件后触发（如三星通关某关）

伪代码：
function unlockNodes(completedNodeId):
  completed = getCompletedSet()
  completed.add(completedNodeId)
  
  for node in allNodes:
    if node.id in completed:
      status = 'completed'
    elif all(p in completed for p in node.prerequisites):
      status = 'available'
    else:
      status = 'locked'
  
  // 当前节点 = 第一个 available 节点
  currentNode = firstAvailableNode()
  currentNode.status = 'current'
```

---

## 6. 配置常量 (全局变量)

> 遵循用户代码风格：可配置阈值使用全局变量

```typescript
// utils/constants.ts

// === 游戏平衡配置 ===
export const GAME_CONFIG = {
  // 生命值
  INITIAL_HEARTS: 5,
  MAX_HEARTS: 5,
  HEART_RECOVERY_MINUTES: 30,
  HEART_COST_COINS: 10,

  // 等级系统
  BASE_XP_PER_LEVEL: 100,
  XP_GROWTH_FACTOR: 1.5,
  MAX_LEVEL: 100,

  // 答题奖励
  XP_PER_CORRECT_NORMAL: 10,
  XP_PER_CORRECT_BOSS: 30,
  COINS_PER_CORRECT: 5,
  FIRST_CLEAR_XP_BONUS: 50,
  THREE_STAR_XP_BONUS: 20,

  // 星级评定
  STAR_THRESHOLDS: {
    ONE_STAR: 0.4,    // 40% 正确率
    TWO_STAR: 0.7,    // 70% 正确率
    THREE_STAR: 0.9,  // 90% 正确率
    THREE_STAR_TIME_RATIO: 0.7, // 用时 < 70% 预估时间
  },

  // 连续打卡
  STREAK_XP_BONUS_PER_DAY: 5,
  MAX_STREAK_BONUS: 50,
}

// === AI 生成配置 ===
export const AI_CONFIG = {
  // 内容长度限制
  MIN_CONTENT_LENGTH: 100,
  MAX_CONTENT_LENGTH: 10000,

  // 知识点密度 (字/知识点)
  WORDS_PER_KNOWLEDGE_NODE: 500,

  // 每个知识点题目数
  QUESTIONS_PER_NODE: 3,

  // 题目类型分布
  QUESTION_TYPE_RATIO: {
    choice: 0.7,
    true_false: 0.3,
  },

  // AI 调用超时 (毫秒)
  API_TIMEOUT_MS: 30000,

  // 最大重试次数
  MAX_RETRIES: 2,

  // 批量生成大小
  BATCH_SIZE: 5,
}

// === 地图配置 ===
export const MAP_CONFIG = {
  // 节点间距
  NODE_HORIZONTAL_GAP: 120,
  NODE_VERTICAL_GAP: 80,

  // 节点大小
  NODE_SIZE: 48,

  // Boss 节点间隔 (每 N 个普通节点一个 Boss)
  BOSS_NODE_INTERVAL: 5,

  // 初始节点位置
  START_X: 80,
  START_Y: 200,
}

// === 碎片稀有度配置 ===
export const FRAGMENT_CONFIG = {
  RARITY_RATIO: {
    common: 0.7,
    rare: 0.25,
    legendary: 0.05,
  },
  RARITY_COLORS: {
    common: '#94a3b8',   // 银灰
    rare: '#f59e0b',     // 金色
    legendary: '#8b5cf6', // 紫色
  },
  RARITY_XP_BONUS: {
    common: 10,
    rare: 30,
    legendary: 100,
  },
}
```

---

## 7. MVP 阶段技术简化说明

| 功能 | 完整方案 | MVP 简化方案 |
|------|----------|-------------|
| 用户系统 | JWT + 后端账号 | localStorage 本地存储 |
| 数据持久化 | Turso 数据库 | localStorage |
| AI 生成 | 后端 Serverless + 异步队列 | 前端直接调用 API / Mock 数据 |
| 文件上传 | R2 对象存储 | 仅文本粘贴 |
| 地图渲染 | Canvas 2D + 拖拽缩放 | SVG + 固定布局 |
| 角色动画 | Lottie + 角色精灵 | CSS 简单动画 |
| 答题音效 | Web Audio API | 无音效 |
| 题型丰富度 | 4种题型 | 选择题 + 判断题 |
| 地图复杂度 | 分支 + 隐藏关卡 | 线性地图 |

---

## 8. 部署架构

### MVP 阶段（纯前端）
```
用户浏览器
  ↓
Vercel / Cloudflare Pages (静态托管)
  ↓
直接调用 DeepSeek API (前端直连，Key 存环境变量)
  ↓
localStorage (本地数据持久化)
```

### Phase 2（接入后端）
```
用户浏览器
  ↓
Cloudflare Pages (前端静态资源)
  ↓
Cloudflare Workers (API 服务)
  ↓
├─ Turso (主数据库)
├─ Cloudflare KV (缓存)
└─ DeepSeek API (AI 服务)
```

---

## 9. 架构决策（已确认）

| 序号 | 决策项 | 确认方案 | 备注 |
|------|--------|----------|------|
| 1 | AI 模型选择 | **DeepSeek Chat (deepseek-chat)** | 当前指向 DeepSeek-V3，性价比高，API 兼容 GPT 格式 |
| 2 | 数据库选型 | **SQLite (localStorage 存储)** | MVP 纯前端方案，数据存储在浏览器 localStorage |
| 3 | 部署平台 | **Cloudflare Pages** | 全球边缘节点，国内访问速度较好，免费额度充足 |
| 4 | 后端方案 | **纯前端 + localStorage** | MVP 阶段无需后端，数据本地存储；Phase 2 接入 Cloudflare Workers |
| 5 | 文本长度上限 | **10000 字** | 用户可一次导入完整章节内容，系统自动分段处理 |
| 6 | 题目数量上限 | **30 题/学习包** | 每个知识点 2-3 题，覆盖度足够，生成时间可接受 |
| 7 | 生命值机制 | **保留（简化版）** | 初始 5 点，答错扣 1，每天自动恢复满，支持金币购买恢复 |
| 8 | 地图视觉风格 | **俯视视角（分层技能树式）** | SVG 实现，节点按知识依赖关系分层排列，路径清晰 |

### 9.1 安全风险说明

**⚠️ API Key 暴露风险**：MVP 阶段前端直连 DeepSeek API，API Key 通过环境变量注入到浏览器中。虽然 Vite 会在构建时替换环境变量，但 Key 仍会暴露在打包后的 JS 文件中。这是 MVP 阶段的可接受风险，Phase 2 接入后端后必须改为后端代理调用。

**缓解措施**：
- 使用 DeepSeek 的免费额度（每月 100 万 token）
- 限制单个 API Key 的调用频率
- Phase 2 必须接入后端代理，前端只调用自己的 API
