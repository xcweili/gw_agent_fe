<template>
  <div class="sidebar">
    <div class="logo-area">
      <div class="logo-wrapper">
        <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSIxMCIgZmlsbD0iIzQwOUVGRiIvPjxwYXRoIGQ9Ik0yMCA4TDI0IDE2SDMyTDI2IDIyTDI5IDMwTDIwIDI0TDExIDMwTDE0IDIyTDggMTZIMTZMMjAgOFoiIGZpbGw9IndoaXRlIi8+PC9zdmc+" class="logo-icon" />
        <div class="logo-text">
          <span class="logo-title">招投标智能体平台</span>
          <span class="logo-subtitle">AI Agent Platform</span>
        </div>
      </div>
    </div>

    <div class="search-area">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索智能体..."
        prefix-icon="Search"
        clearable
        size="large"
        @input="handleSearch"
        class="search-input"
      />
    </div>

    <div class="sidebar-tabs">
      <el-radio-group v-model="activeTab" size="large">
        <el-radio-button label="agents">
          <el-icon><Grid /></el-icon>
          智能体
        </el-radio-button>
        <el-radio-button label="favorites">
          <el-icon><Star /></el-icon>
          收藏
        </el-radio-button>
      </el-radio-group>
    </div>

    <div class="agent-list-section">
      <div class="section-header">
        <span class="section-title">
          {{ activeTab === 'agents' ? '可用智能体' : '我的收藏' }}
        </span>
        <span class="section-count">{{ filteredAgents.length }} 个</span>
      </div>

      <div v-if="filteredAgents.length === 0" class="empty-agent-list">
        <el-empty description="暂无智能体" :image-size="80" />
      </div>

      <div v-else class="agent-list">
        <div
          v-for="agent in filteredAgents"
          :key="agent.id"
          class="agent-item"
          :class="{ active: selectedAgent?.id === agent.id }"
          @click="selectAgent(agent)"
        >
          <div class="agent-item-avatar">
            <img :src="agent.icon || defaultIcon" :alt="agent.name" />
          </div>
          <div class="agent-item-content">
            <div class="agent-item-header">
              <span class="agent-item-name">{{ agent.name }}</span>
              <el-icon
                v-if="activeTab === 'agents'"
                class="favorite-icon"
                :class="{ active: isFavorite(agent.id) }"
                @click.stop="toggleFavorite(agent.id)"
              >
                <Star v-if="isFavorite(agent.id)" />
                <StarFilled v-else />
              </el-icon>
            </div>
            <div class="agent-item-desc">{{ agent.description }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="sidebar-footer">
      <div class="quick-actions">
        <el-button
          type="primary"
          size="large"
          @click="$router.push('/agents')"
          class="quick-action-btn"
        >
          <el-icon><Plus /></el-icon>
          管理智能体
        </el-button>
      </div>
      <div class="user-info" v-if="currentUser">
        <el-avatar :size="36" class="user-avatar">
          {{ currentUser.username?.charAt(0)?.toUpperCase() }}
        </el-avatar>
        <div class="user-details">
          <span class="user-name">{{ currentUser.username }}</span>
          <span class="user-role">{{ getRoleLabel(currentUser.role) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Grid, Star, StarFilled, Plus } from '@element-plus/icons-vue'
import { backendService } from '../services/backendService'

export default {
  name: 'Sidebar',
  components: {
    Grid,
    Star,
    StarFilled,
    Plus
  },
  inject: {
    currentUser: { default: null }
  },
  emits: ['agent-selected'],
  data() {
    return {
      agents: [],
      selectedAgent: null,
      searchKeyword: '',
      activeTab: 'agents',
      favorites: [],
      defaultIcon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iIzQwOUVGRiIvPjxwYXRoIGQ9Ik0xMiAyTDEzLjA5IDguMjZMMjAgOUwxMy4wOSAxNS43NEwxMiAyMkwxMC45MSAxNS43NEw0IDlMMTAuOTEgOC4yNkwxMiAyWiIgZmlsbD0id2hpdGUiLz48L3N2Zz4='
    }
  },
  computed: {
    filteredAgents() {
      let agents = this.agents
      if (this.activeTab === 'favorites') {
        agents = agents.filter(a => this.favorites.includes(a.id))
      }
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase()
        agents = agents.filter(a =>
          a.name?.toLowerCase().includes(keyword) ||
          a.description?.toLowerCase().includes(keyword)
        )
      }
      return agents
    }
  },
  async mounted() {
    await this.loadAgents()
    this.loadFavorites()
  },
  methods: {
    async loadAgents() {
      try {
        const result = await backendService.getAgents()
        if (result.success && result.data) {
          this.agents = result.data
          if (this.agents.length > 0 && !this.selectedAgent) {
            this.selectedAgent = this.agents[0]
            this.$emit('agent-selected', this.selectedAgent)
          }
        }
      } catch (error) {
        console.error('加载智能体列表失败:', error)
      }
    },
    loadFavorites() {
      const saved = localStorage.getItem('agent_favorites')
      if (saved) {
        this.favorites = JSON.parse(saved)
      }
    },
    saveFavorites() {
      localStorage.setItem('agent_favorites', JSON.stringify(this.favorites))
    },
    isFavorite(agentId) {
      return this.favorites.includes(agentId)
    },
    toggleFavorite(agentId) {
      const index = this.favorites.indexOf(agentId)
      if (index > -1) {
        this.favorites.splice(index, 1)
      } else {
        this.favorites.push(agentId)
      }
      this.saveFavorites()
    },
    handleSearch() {
    },
    selectAgent(agent) {
      this.selectedAgent = agent
      this.$emit('agent-selected', agent)
    },
    getRoleLabel(role) {
      const labels = {
        admin: '管理员',
        user: '普通用户',
        viewer: '访客'
      }
      return labels[role] || role
    }
  }
}
</script>

<style scoped>
.sidebar {
  width: 280px;
  height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
}

.logo-area {
  padding: 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.logo-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.5px;
}

.logo-subtitle {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
}

.search-area {
  padding: 16px;
}

.search-input {
  --el-input-bg-color: rgba(255, 255, 255, 0.08);
  --el-input-border-color: rgba(255, 255, 255, 0.1);
  --el-input-text-color: #fff;
  --el-input-placeholder-color: rgba(255, 255, 255, 0.4);
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 10px;
}

.sidebar-tabs {
  padding: 0 16px;
}

.sidebar-tabs :deep(.el-radio-group) {
  width: 100%;
}

.sidebar-tabs :deep(.el-radio-button) {
  flex: 1;
}

.sidebar-tabs :deep(.el-radio-button__inner) {
  width: 100%;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
}

.sidebar-tabs :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: rgba(64, 158, 255, 0.2);
  color: #409EFF;
  border-color: transparent;
  box-shadow: none;
}

.agent-list-section {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.empty-agent-list {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.empty-agent-list :deep(.el-empty__description p) {
  color: rgba(255, 255, 255, 0.5);
}

.agent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.agent-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.03);
}

.agent-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.agent-item.active {
  background: rgba(64, 158, 255, 0.15);
  border: 1px solid rgba(64, 158, 255, 0.3);
}

.agent-item-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background: #409EFF;
}

.agent-item-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.agent-item-content {
  flex: 1;
  min-width: 0;
}

.agent-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.agent-item-name {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.favorite-icon {
  color: rgba(255, 255, 255, 0.3);
  font-size: 14px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.favorite-icon:hover,
.favorite-icon.active {
  color: #ffc53d;
}

.agent-item-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.quick-actions {
  margin-bottom: 16px;
}

.quick-action-btn {
  width: 100%;
  border-radius: 10px;
  background: rgba(64, 158, 255, 0.2);
  border: 1px solid rgba(64, 158, 255, 0.4);
  color: #409EFF;
}

.quick-action-btn:hover {
  background: rgba(64, 158, 255, 0.3);
  border-color: #409EFF;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-weight: 600;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
}

.user-role {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

::-webkit-scrollbar {
  width: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
