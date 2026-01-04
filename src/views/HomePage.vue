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
  methods: {
    handleAgentSelected(agent) {
      this.selectedAgent = agent
    }
  }
}
</script>