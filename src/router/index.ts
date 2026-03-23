import { createRouter, createWebHistory } from 'vue-router'
import MyScrapers from '../views/MyScrapers.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: MyScrapers,
    },
    {
      path: '/code-editor',
      name: 'code-editor',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/CodeEditor.vue'),
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('../views/Search.vue'),
    },
    {
      path: '/view-search',
      name: 'ViewSearch',
      component: () => import('../views/ViewSearch.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/Settings.vue'),
    },
    {
      path: '/edit-search',
      name: 'EditSearch',
      component: () => import('../views/EditSearch.vue'),
    },
  ],
})

export default router
