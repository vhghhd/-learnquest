import type { MapNode, KnowledgeNode } from '@/types/quest.types'
import { MAP_CONFIG, AI_CONFIG } from './constants'

export function buildMapLayout(knowledgeNodes: KnowledgeNode[]): MapNode[] {
  const nodes: MapNode[] = []
  const nodeMap = new Map<string, KnowledgeNode>()
  
  for (const node of knowledgeNodes) {
    nodeMap.set(node.id, node)
  }

  const layers = groupByLayer(knowledgeNodes, nodeMap)
  
  for (const [layerIndex, layerNodes] of layers.entries()) {
    const nodeCount = layerNodes.length
    const baseY = MAP_CONFIG.START_Y + layerIndex * MAP_CONFIG.LAYER_HEIGHT
    
    for (let i = 0; i < nodeCount; i++) {
      const kn = layerNodes[i]
      let baseX = MAP_CONFIG.START_X
      
      if (nodeCount > 1) {
        const totalWidth = (nodeCount - 1) * MAP_CONFIG.LAYER_WIDTH
        baseX += i * MAP_CONFIG.LAYER_WIDTH - totalWidth / 2
      }
      
      const isBoss = (layerIndex + 1) % MAP_CONFIG.BOSS_NODE_INTERVAL === 0 || 
                     layerIndex === layers.size - 1
      
      const questionCount = Math.min(
        AI_CONFIG.QUESTIONS_PER_NODE,
        Math.ceil(AI_CONFIG.MAX_QUESTIONS_PER_QUEST / knowledgeNodes.length)
      )
      
      const questionIds: string[] = []
      for (let j = 0; j < questionCount; j++) {
        questionIds.push(`q_${kn.id}_${j}`)
      }
      
      const unlocks: string[] = []
      for (const nextNode of knowledgeNodes) {
        if (nextNode.prerequisites.includes(kn.id)) {
          unlocks.push(nextNode.id)
        }
      }
      
      nodes.push({
        id: kn.id,
        knowledgeNodeId: kn.id,
        name: kn.name,
        x: baseX,
        y: baseY,
        layer: layerIndex,
        type: isBoss ? 'boss' : 'normal',
        questionIds,
        estimatedTime: questionCount * 15,
        reward: {
          xp: isBoss ? questionCount * 30 : questionCount * 10,
          coins: questionCount * 5,
          fragments: [kn.id],
        },
        unlocks,
        prerequisites: kn.prerequisites,
      })
    }
  }
  
  return nodes
}

function groupByLayer(
  nodes: KnowledgeNode[],
  nodeMap: Map<string, KnowledgeNode>
): Map<number, KnowledgeNode[]> {
  const layers = new Map<number, KnowledgeNode[]>()
  const layerCache = new Map<string, number>()
  const recursionDepth = new Map<string, number>()
  const MAX_RECURSION_DEPTH = 100
  
  function findLayer(nodeId: string): number {
    const depth = (recursionDepth.get(nodeId) || 0) + 1
    recursionDepth.set(nodeId, depth)
    
    if (depth > MAX_RECURSION_DEPTH) {
      console.error(`[mapLayout] ❌ 递归深度超限! nodeId=${nodeId}, depth=${depth}`)
      console.error(`[mapLayout] 当前递归栈:`, Array.from(recursionDepth.entries()).filter(([, d]) => d > 0))
      recursionDepth.set(nodeId, 0)
      return 0
    }
    
    if (layerCache.has(nodeId)) {
      const cachedLayer = layerCache.get(nodeId)!
      console.debug(`[mapLayout] 🟢 缓存命中: nodeId=${nodeId}, layer=${cachedLayer}, depth=${depth}`)
      recursionDepth.set(nodeId, 0)
      return cachedLayer
    }
    
    const node = nodeMap.get(nodeId)
    if (!node) {
      console.warn(`[mapLayout] 🟡 节点不存在: nodeId=${nodeId}, depth=${depth}`)
      layerCache.set(nodeId, 0)
      recursionDepth.set(nodeId, 0)
      return 0
    }
    
    console.debug(`[mapLayout] 🔍 开始计算: nodeId=${nodeId}, name=${node.name}, prerequisites=[${node.prerequisites.join(',')}], depth=${depth}`)
    
    if (node.prerequisites.length === 0) {
      console.debug(`[mapLayout] 🟢 无前置依赖: nodeId=${nodeId}, name=${node.name}, layer=0, depth=${depth}`)
      layerCache.set(nodeId, 0)
      recursionDepth.set(nodeId, 0)
      return 0
    }
    
    const prereqLayers: number[] = []
    for (const prereqId of node.prerequisites) {
      const prereqLayer = findLayer(prereqId)
      prereqLayers.push(prereqLayer)
      console.debug(`[mapLayout]   ↓ 前置依赖: prereqId=${prereqId}, layer=${prereqLayer}, depth=${depth}`)
    }
    
    const layer = Math.max(...prereqLayers) + 1
    layerCache.set(nodeId, layer)
    
    console.debug(`[mapLayout] ✅ 计算完成: nodeId=${nodeId}, name=${node.name}, prereqLayers=[${prereqLayers.join(',')}], resultLayer=${layer}, depth=${depth}`)
    
    recursionDepth.set(nodeId, 0)
    return layer
  }
  
  console.debug(`[mapLayout] === 开始分层计算 === totalNodes=${nodes.length}`)
  
  for (const node of nodes) {
    const layer = findLayer(node.id)
    if (!layers.has(layer)) {
      layers.set(layer, [])
    }
    layers.get(layer)!.push(node)
  }
  
  console.debug(`[mapLayout] === 分层完成 === layers=${layers.size}`)
  for (const [layer, layerNodes] of layers.entries()) {
    console.debug(`[mapLayout]   Layer ${layer}: [${layerNodes.map(n => n.name).join(',')}]`)
  }
  
  return layers
}

export function generateMapPath(fromNode: MapNode, toNode: MapNode): string {
  const startX = fromNode.x
  const startY = fromNode.y
  const endX = toNode.x
  const endY = toNode.y
  
  const dx = endX - startX
  const dy = endY - startY
  
  const cp1x = startX + dx * 0.3
  const cp1y = startY + dy * 0.1
  
  const cp2x = startX + dx * 0.7
  const cp2y = startY + dy * 0.9
  
  return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`
}

export function getMapBounds(nodes: MapNode[]): { minX: number; maxX: number; minY: number; maxY: number } {
  if (nodes.length === 0) {
    return { minX: 0, maxX: 800, minY: 0, maxY: 600 }
  }
  
  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity
  
  for (const node of nodes) {
    const nodeEdge = MAP_CONFIG.NODE_SIZE / 2
    minX = Math.min(minX, node.x - nodeEdge)
    maxX = Math.max(maxX, node.x + nodeEdge)
    minY = Math.min(minY, node.y - nodeEdge)
    maxY = Math.max(maxY, node.y + nodeEdge)
  }
  
  const padding = 60
  return {
    minX: minX - padding,
    maxX: maxX + padding,
    minY: minY - padding,
    maxY: maxY + padding,
  }
}

export function getLayerBounds(nodes: MapNode[]): Map<number, { minX: number; maxX: number; centerY: number }> {
  const layerBounds = new Map<number, { minX: number; maxX: number; centerY: number }>()
  
  for (const node of nodes) {
    const existing = layerBounds.get(node.layer)
    if (!existing) {
      layerBounds.set(node.layer, {
        minX: node.x,
        maxX: node.x,
        centerY: node.y,
      })
    } else {
      existing.minX = Math.min(existing.minX, node.x)
      existing.maxX = Math.max(existing.maxX, node.x)
    }
  }
  
  return layerBounds
}
