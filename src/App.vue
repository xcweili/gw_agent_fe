<template>
  <div id="app">
    <router-view />
    <div class="user-info-bar" v-if="currentUser">
      <el-dropdown @command="handleUserCommand">
        <span class="user-info-trigger">
          <el-avatar :size="32" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM0MDlFRkYiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI4IiB5PSI4Ij4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+" />
          <span class="username">{{ currentUser.username }}</span>
          <el-icon><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="agents">
              <el-icon><Grid /></el-icon>
              智能体管理
            </el-dropdown-item>
            <el-dropdown-item command="admin" v-if="isAdmin" divided>
              <el-icon><Setting /></el-icon>
              权限管理
            </el-dropdown-item>
            <el-dropdown-item command="logout" divided>
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import { ArrowDown, Grid, SwitchButton, Setting } from '@element-plus/icons-vue'
import { authService } from './services/authService'

export default {
  name: 'App',
  components: {
    ArrowDown,
    Grid,
    SwitchButton,
    Setting
  },
  provide() {
    return {
      getCurrentUser: () => this.currentUser,
      getIsAdmin: () => this.isAdmin,
      logout: this.logout,
      refreshUser: this.refreshUser
    }
  },
  data() {
    return {
      currentUser: null,
      isAdmin: false
    }
  },
  mounted() {
    this.refreshUser()
    window.addEventListener('storage', this.handleStorageChange)
    this.$router.afterEach(() => {
      this.refreshUser()
    })
  },
  beforeUnmount() {
    window.removeEventListener('storage', this.handleStorageChange)
  },
  methods: {
    refreshUser() {
      this.currentUser = authService.getCurrentUser()
      this.isAdmin = authService.isAdmin()
    },
    handleUserCommand(command) {
      if (command === 'logout') {
        this.logout()
      } else if (command === 'agents') {
        this.$router.push('/agents')
      } else if (command === 'admin') {
        this.$router.push('/admin')
      }
    },
    logout() {
      authService.logout()
      this.currentUser = null
      this.isAdmin = false
      this.$router.push('/login')
      this.$message.success('已退出登录')
    },
    handleStorageChange(e) {
      if (e.key === 'currentUser') {
        this.refreshUser()
      }
    }
  }
}
</script>

<style scoped>
#app {
  min-height: 100vh;
}

.user-info-bar {
  position: fixed;
  top: 16px;
  right: 20px;
  z-index: 9999;
}

.user-info-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.user-info-trigger:hover {
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.username {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
