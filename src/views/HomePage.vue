<template>
  <div class="main-layout">
    <Sidebar @agent-selected="handleAgentSelected" ref="sidebar" />
    <ChatArea :selected-agent="selectedAgent" />
  </div>
</template>

<script>
import Sidebar from '../components/Sidebar.vue'
import ChatArea from '../components/ChatArea.vue'

export default {
  name: 'HomePage',
  components: {
    Sidebar,
    ChatArea
  },
  data() {
    return {
      selectedAgent: null
    }
  },
  mounted() {
    // 检查是否有预先选中的智能体
    const selectedAgentId = sessionStorage.getItem('selectedAgentId')
    if (selectedAgentId) {
      this.$nextTick(() => {
        const sidebar = this.$refs.sidebar
        if (sidebar && sidebar.selectedAgent && sidebar.selectedAgent.id === selectedAgentId) {
          this.selectedAgent = sidebar.selectedAgent
        }
        sessionStorage.removeItem('selectedAgentId')
      })
    }
  },
  watch: {
    $route: {
      async handler(newRoute, oldRoute) {
        // 当从智能体列表页返回首页时，刷新智能体列表
        if (newRoute.path === '/' && oldRoute && oldRoute.path === '/agents') {
          this.$nextTick(async () => {
            const sidebar = this.$refs.sidebar
            if (sidebar && sidebar.refreshAgents) {
              await sidebar.refreshAgents()
            }
          })
        }
      },
      immediate: false
    }
  },
  methods: {
    handleAgentSelected(agent) {
      this.selectedAgent = agent
    }
  }
}
</script>