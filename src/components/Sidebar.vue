<template>
  <div class="sidebar">
    <div class="logo-area">
      <div class="logo-text">招投标智能体平台</div>
    </div>
    
    <div class="agent-list-section">
      <div class="section-title" style="font-size: 14px; font-weight: bold; color: var(--text-color-primary); margin-bottom: 12px;">
        AI智能体
      </div>
      
      <div v-if="agents.length === 0" class="empty-agent-list">
        <div style="margin-bottom: 16px;">暂无智能体</div>
        <el-button type="primary" @click="$router.push('/agents')">
          <el-icon><Plus /></el-icon>
          创建智能体
        </el-button>
      </div>
      
      <div v-else>
        <div 
          v-for="agent in agents" 
          :key="agent.id"
          class="agent-card"
          :class="{ active: selectedAgent?.id === agent.id }"
          @click="selectAgent(agent)"
        >
          <div class="agent-card-header">
            <img :src="agent.icon" :alt="agent.name" class="agent-avatar" />
            <div class="agent-title">{{ agent.name }}</div>
          </div>
          <div class="agent-intro">{{ agent.description }}</div>
        </div>
        
        <div style="margin-top: 16px; text-align: center;">
          <el-button 
            type="primary" 
            plain 
            @click="$router.push('/agents')"
            style="width: 100%;"
          >
            <el-icon><More /></el-icon>
            更多智能体
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Plus, More } from '@element-plus/icons-vue'
import { agentService } from '../services/agentService'

export default {
  name: 'Sidebar',
  components: {
    Plus,
    More
  },
  emits: ['agent-selected'],
  data() {
    return {
      agents: [],
      selectedAgent: null
    }
  },
  async mounted() {
    await this.loadAgents()
  },
  methods: {
    async loadAgents() {
      try {
        this.agents = await agentService.getAgents()
        if (this.agents.length > 0 && !this.selectedAgent) {
          this.selectedAgent = this.agents[0]
          this.$emit('agent-selected', this.selectedAgent)
        }
      } catch (error) {
        console.error('加载智能体列表失败:', error)
      }
    },
    selectAgent(agent) {
      this.selectedAgent = agent
      this.$emit('agent-selected', agent)
    }
  }
}
</script>