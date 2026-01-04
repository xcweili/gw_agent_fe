import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import AgentListPage from '../views/AgentListPage.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/agents',
    name: 'AgentList',
    component: AgentListPage
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router