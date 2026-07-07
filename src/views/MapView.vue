<template>
  <div class="min-h-screen bg-black flex flex-col">
    <div class="p-4 bg-white/90 backdrop-blur-sm border-b border-rule">
      <div class="flex items-center justify-between max-w-6xl mx-auto">
        <div class="flex items-center gap-4">
          <button 
            class="text-ink hover:text-accent transition-colors"
            @click="goHome"
          >
            ← 返回首页
          </button>
          <div>
            <h1 class="text-xl font-bold text-ink">{{ questTitle }}</h1>
            <p class="text-sm text-muted">探索知识世界</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-1">
            <span class="text-xl">❤️</span>
            <span class="font-bold text-danger">{{ hearts }}</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="text-xl">⭐</span>
            <span class="font-bold text-gold">{{ xp }}</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="text-xl">💰</span>
            <span class="font-bold text-accent">{{ coins }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-hidden">
      <div 
        class="w-full h-full flex items-center justify-center p-8"
        ref="containerRef"
        @wheel.prevent="handleWheel"
      >
        <svg
          :viewBox="viewBox"
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          :style="{ transform: `scale(${currentScale})`, transformOrigin: 'center' }"
        >
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#8b5cf6" />
              <stop offset="100%" stop-color="#10b981" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="strongGlow">
              <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>
              <stop offset="70%" stop-color="#e0e7ff" stop-opacity="0.8"/>
              <stop offset="100%" stop-color="#a5b4fc" stop-opacity="0"/>
            </radialGradient>
          </defs>

          <g class="stars">
            <circle
              v-for="star in stars"
              :key="`star-${star.id}`"
              :cx="star.x"
              :cy="star.y"
              :r="star.r"
              :fill="star.color"
              :opacity="star.opacity"
            >
              <animate
                attributeName="opacity"
                :values="`${star.opacity * 0.3};${star.opacity};${star.opacity * 0.3}`"
                :dur="`${star.duration}s`"
                :begin="`${star.delay}s`"
                repeatCount="indefinite"
              />
              <animate
                attributeName="r"
                :values="`${star.r * 0.8};${star.r * 1.2};${star.r * 0.8}`"
                :dur="`${star.duration}s`"
                :begin="`${star.delay}s`"
                repeatCount="indefinite"
              />
            </circle>
          </g>

          <g class="paths">
            <path
              v-for="path in paths"
              :key="`${path.from}-${path.to}`"
              :d="getPathD(path)"
              :stroke="getPathColor(path)"
              stroke-width="3"
              fill="none"
              stroke-linecap="round"
              :opacity="isPathUnlocked(path) ? 1 : 0.3"
              :stroke-dasharray="isPathUnlocked(path) ? 'none' : '8,4'"
            />
          </g>

          <g class="nodes">
            <g
              v-for="node in mapNodes"
              :key="node.id"
              :transform="`translate(${node.x}, ${node.y})`"
              class="node-group cursor-pointer"
              @click="handleNodeClick(node)"
              :class="getNodeClasses(node)"
            >
              <circle
                v-if="nodeStatusMap.get(node.id) === 'current'"
                r="36"
                fill="none"
                stroke="#8b5cf6"
                stroke-width="4"
                opacity="0.3"
                class="animate-ping"
              />
              
              <circle
                :r="node.type === 'boss' ? 28 : 24"
                :fill="getNodeFill(node)"
                :stroke="getNodeStroke(node)"
                stroke-width="3"
                filter="url(#glow)"
                class="transition-all duration-200 hover:stroke-accent hover:opacity-80"
                :class="nodeStatusMap.get(node.id) === 'locked' ? '' : 'cursor-pointer'"
              />

              <circle
                v-if="nodeStatusMap.get(node.id) === 'completed'"
                r="10"
                fill="#10b981"
                filter="url(#strongGlow)"
              />
              
              <circle
                v-else-if="nodeStatusMap.get(node.id) === 'locked'"
                r="10"
                fill="none"
                stroke="#94a3b8"
                stroke-width="2"
              >
                <text x="0" y="4" text-anchor="middle" font-size="14" fill="#94a3b8" font-weight="bold">🔒</text>
              </circle>

              <circle
                v-else-if="node.type === 'boss'"
                r="12"
                fill="none"
                stroke="#f59e0b"
                stroke-width="2"
              >
                <text x="0" y="5" text-anchor="middle" font-size="16" fill="#f59e0b">👹</text>
              </circle>

              <text
                :y="node.type === 'boss' ? 38 : 36"
                text-anchor="middle"
                font-size="11"
                :fill="getNodeTextColor(node)"
                font-weight="500"
                class="pointer-events-none"
              >
                {{ node.name.length > 6 ? node.name.slice(0, 5) + '..' : node.name }}
              </text>

              <text
                :y="node.type === 'boss' ? 52 : 50"
                text-anchor="middle"
                font-size="9"
                fill="#94a3b8"
                class="pointer-events-none"
              >
                {{ node.questionIds.length }}题
              </text>
            </g>
          </g>
        </svg>
      </div>
    </div>

    <Teleport to="body">
      <div 
        v-if="selectedNode"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="selectedNode = null"
      >
        <div class="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl transform transition-all">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-16 h-16 rounded-full flex items-center justify-center" :class="getNodeBgClass(selectedNode)">
              <span v-if="selectedNode.type === 'boss'" class="text-3xl">👹</span>
              <span v-else-if="nodeStatusMap.get(selectedNode.id) === 'completed'" class="text-3xl">✅</span>
              <span v-else-if="nodeStatusMap.get(selectedNode.id) === 'locked'" class="text-3xl">🔒</span>
              <span v-else class="text-3xl">📚</span>
            </div>
            <div>
              <h3 class="text-xl font-bold text-ink">{{ selectedNode.name }}</h3>
              <p class="text-sm text-muted">
                {{ nodeStatusMap.get(selectedNode.id) === 'locked' ? '未解锁' : 
                   nodeStatusMap.get(selectedNode.id) === 'completed' ? '已完成' : 
                   nodeStatusMap.get(selectedNode.id) === 'current' ? '当前关卡' : '可挑战' }}
              </p>
            </div>
          </div>

          <div class="space-y-3 mb-6">
            <div class="flex justify-between text-sm">
              <span class="text-muted">题目数量</span>
              <span class="font-medium text-ink">{{ selectedNode.questionIds.length }} 题</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted">预计用时</span>
              <span class="font-medium text-ink">{{ selectedNode.estimatedTime }} 秒</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted">难度等级</span>
              <span class="font-medium" :class="selectedNode.type === 'boss' ? 'text-danger' : 'text-accent'">
                {{ selectedNode.type === 'boss' ? 'Boss关' : `Level ${selectedNode.layer + 1}` }}
              </span>
            </div>
            <div class="border-t border-rule pt-3">
              <p class="text-sm text-muted mb-2">奖励</p>
              <div class="flex gap-4">
                <div class="flex items-center gap-1">
                  <span>⭐</span>
                  <span class="font-bold text-gold">{{ selectedNode.reward.xp }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <span>💰</span>
                  <span class="font-bold text-accent">{{ selectedNode.reward.coins }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <span>🧩</span>
                  <span class="font-bold text-accent2">1</span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-3">
            <button
              class="flex-1 py-3 bg-bg2 text-ink rounded-xl font-medium hover:bg-bg transition-colors"
              @click="selectedNode = null"
            >
              关闭
            </button>
            <button
              v-if="nodeStatusMap.get(selectedNode.id) !== 'locked'"
              class="flex-1 py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent-dark transition-all duration-200 hover:scale-[1.02]"
              @click="startLevel(selectedNode)"
            >
              {{ nodeStatusMap.get(selectedNode.id) === 'completed' ? '重新挑战' : '开始挑战' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuestStore } from '@/stores/quest.store'
import { useUserStore } from '@/stores/user.store'
import { generateMapPath, getMapBounds } from '@/utils/mapLayout'
import { ROUTES } from '@/utils/constants'
import type { MapNode, MapPath } from '@/types/quest.types'

const route = useRoute()
const router = useRouter()
const questStore = useQuestStore()
const userStore = useUserStore()

const containerRef = ref<HTMLElement | null>(null)
const currentScale = ref(1)
const selectedNode = ref<MapNode | null>(null)
const stars = ref<Array<{ id: number; x: number; y: number; r: number; color: string; opacity: number; duration: number; delay: number }>>([])

const questTitle = computed(() => questStore.quest?.title ?? '冒险地图')
const mapNodes = computed(() => questStore.mapNodes)
const nodeStatusMap = computed(() => questStore.nodeStatusMap)

const hearts = computed(() => userStore.hearts)
const xp = computed(() => userStore.xp)
const coins = computed(() => userStore.coins)

const bounds = computed(() => getMapBounds(mapNodes.value))
const viewBox = computed(() => {
  const { minX, maxX, minY, maxY } = bounds.value
  const pad = 80
  return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`
})

const paths = computed(() => {
  const result: MapPath[] = []
  for (const node of mapNodes.value) {
    for (const unlockId of node.unlocks) {
      result.push({ from: node.id, to: unlockId })
    }
  }
  return result
})

const nodeMap = computed(() => {
  const map = new Map<string, MapNode>()
  for (const node of mapNodes.value) {
    map.set(node.id, node)
  }
  return map
})

function getPathD(path: MapPath): string {
  const fromNode = nodeMap.value.get(path.from)
  const toNode = nodeMap.value.get(path.to)
  if (!fromNode || !toNode) return ''
  return generateMapPath(fromNode, toNode)
}

function getPathColor(path: MapPath): string {
  if (isPathUnlocked(path)) {
    return 'url(#pathGradient)'
  }
  return '#cbd5e1'
}

function isPathUnlocked(path: MapPath): boolean {
  return questStore.isLevelCompleted(path.from)
}

function getNodeFill(node: MapNode): string {
  const status = nodeStatusMap.value.get(node.id)
  switch (status) {
    case 'completed':
      return '#10b981'
    case 'current':
      return '#8b5cf6'
    case 'available':
      return '#ffffff'
    case 'locked':
    default:
      return '#e2e8f0'
  }
}

function getNodeStroke(node: MapNode): string {
  const status = nodeStatusMap.value.get(node.id)
  switch (status) {
    case 'completed':
      return '#059669'
    case 'current':
      return '#7c3aed'
    case 'available':
      return '#8b5cf6'
    case 'locked':
    default:
      return '#94a3b8'
  }
}

function getNodeTextColor(node: MapNode): string {
  const status = nodeStatusMap.value.get(node.id)
  switch (status) {
    case 'completed':
    case 'current':
      return '#ffffff'
    case 'available':
    case 'locked':
    default:
      return '#475569'
  }
}

function getNodeClasses(node: MapNode): string {
  const status = nodeStatusMap.value.get(node.id)
  return `node-${status} node-${node.type}`
}

function getNodeBgClass(node: MapNode): string {
  const status = nodeStatusMap.value.get(node.id)
  switch (status) {
    case 'completed':
      return 'bg-accent2'
    case 'current':
      return 'bg-accent'
    case 'available':
      return 'bg-accent-light'
    case 'locked':
    default:
      return 'bg-bg2'
  }
}

function handleNodeClick(node: MapNode) {
  selectedNode.value = node
}

function startLevel(node: MapNode) {
  selectedNode.value = null
  router.push(ROUTES.QUEST_LEVEL(route.params.id as string, node.id))
}

function goHome() {
  router.push(ROUTES.HOME)
}

function handleWheel(event: WheelEvent) {
  const delta = event.deltaY > 0 ? 0.9 : 1.1
  currentScale.value = Math.max(0.5, Math.min(2, currentScale.value * delta))
}

function generateStars() {
  const { minX, maxX, minY, maxY } = bounds.value
  const width = maxX - minX
  const height = maxY - minY
  const count = Math.floor((width * height) / 3000)
  const result: typeof stars.value = []
  
  for (let i = 0; i < count; i++) {
    const size = Math.random() * 2 + 0.5
    const intensity = Math.random()
    const colors = ['#ffffff', '#ffffff', '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24']
    const color = colors[Math.floor(Math.random() * colors.length)]
    
    result.push({
      id: i,
      x: minX + Math.random() * width,
      y: minY + Math.random() * height,
      r: size,
      color,
      opacity: 0.5 + intensity * 0.5,
      duration: 2 + Math.random() * 4,
      delay: Math.random() * 5,
    })
  }
  
  stars.value = result
}

onMounted(() => {
  if (route.params.id) {
    questStore.loadFromStorage(route.params.id as string)
  }
  generateStars()
})
</script>

<style scoped>
.node-current circle:not(.ping-circle) {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

svg {
  transition: transform 0.1s ease-out;
}

.stars circle {
  pointer-events: none;
}
</style>
