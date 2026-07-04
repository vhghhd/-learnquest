import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/quest/:id/map',
    name: 'quest-map',
    component: () => import('@/views/MapView.vue'),
  },
  {
    path: '/quest/:id/level/:levelId',
    name: 'quest-level',
    component: () => import('@/views/LevelView.vue'),
  },
  {
    path: '/quest/:id/result/:levelId',
    name: 'quest-result',
    component: () => import('@/views/ResultView.vue'),
  },
  {
    path: '/quest/:id/codex',
    name: 'quest-codex',
    component: () => import('@/views/CodexView.vue'),
  },
  {
    path: '/stats',
    name: 'stats',
    component: () => import('@/views/StatsView.vue'),
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
