<template>
  <div class="admin-page">
    <div class="admin-container">
      <div class="page-header">
        <div class="header-left">
          <el-button class="back-button" @click="$router.push('/')">
            <el-icon><ArrowLeft /></el-icon>
            返回首页
          </el-button>
          <h1 class="page-title">权限管理</h1>
        </div>
        <div class="header-right">
          <span class="admin-badge">
            <el-icon><UserFilled /></el-icon>
            管理员: {{ currentUser?.username }}
          </span>
        </div>
      </div>

      <div class="search-section">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户名..."
          prefix-icon="Search"
          size="large"
          clearable
          class="search-input"
          @input="handleSearch"
        />
        <el-button type="primary" size="large" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>

      <el-table
        :data="filteredAccounts"
        v-loading="isLoading"
        class="account-table"
        stripe
        border
      >
        <el-table-column prop="username" label="用户名" min-width="150">
          <template #default="{ row }">
            <div class="username-cell">
              <el-avatar :size="36" class="user-avatar">
                {{ row.username.charAt(0).toUpperCase() }}
              </el-avatar>
              <span>{{ row.username }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="role" label="角色" min-width="120">
          <template #default="{ row }">
            <el-tag
              :type="getRoleTagType(row.role)"
              effect="light"
              size="large"
            >
              {{ getRoleName(row.role) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="创建时间" min-width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" min-width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                type="primary"
                size="small"
                @click="showRoleDialog(row)"
                :disabled="row.username === 'admin'"
              >
                <el-icon><Edit /></el-icon>
                修改角色
              </el-button>
              <el-button
                type="danger"
                size="small"
                @click="confirmDelete(row)"
                :disabled="row.username === 'admin'"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <span class="total-count">共 {{ filteredAccounts.length }} 个账号</span>
      </div>
    </div>

    <el-dialog
      v-model="showRoleEditDialog"
      title="修改用户角色"
      width="400px"
      center
    >
      <div class="role-edit-content">
        <div class="user-info">
          <el-avatar :size="48" class="edit-avatar">
            {{ editingUser?.username?.charAt(0).toUpperCase() }}
          </el-avatar>
          <span class="edit-username">{{ editingUser?.username }}</span>
        </div>
        <el-form label-position="top" class="role-form">
          <el-form-item label="选择角色">
            <el-radio-group v-model="newRole" class="role-radio-group">
              <el-radio-button label="admin">
                <el-icon><Key /></el-icon>
                管理员
              </el-radio-button>
              <el-radio-button label="user">
                <el-icon><User /></el-icon>
                普通用户
              </el-radio-button>
              <el-radio-button label="viewer">
                <el-icon><View /></el-icon>
                只读用户
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-form>
        <div class="role-description">
          <p v-if="newRole === 'admin'" class="desc admin-desc">
            管理员拥有最高权限，可以管理所有账号和智能体
          </p>
          <p v-if="newRole === 'user'" class="desc user-desc">
            普通用户可以创建、编辑和删除自己的智能体
          </p>
          <p v-if="newRole === 'viewer'" class="desc viewer-desc">
            只读用户只能查看和使用已有智能体，无法创建新智能体
          </p>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showRoleEditDialog = false">取消</el-button>
          <el-button type="primary" :loading="isUpdating" @click="updateRole">
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {
  ArrowLeft,
  UserFilled,
  Search,
  Edit,
  Delete,
  Key,
  User,
  View
} from '@element-plus/icons-vue'
import { authService } from '../services/authService'

export default {
  name: 'AdminPage',
  components: {
    ArrowLeft,
    UserFilled,
    Search,
    Edit,
    Delete,
    Key,
    User,
    View
  },
  data() {
    return {
      accounts: [],
      searchKeyword: '',
      isLoading: false,
      showRoleEditDialog: false,
      editingUser: null,
      newRole: 'user',
      isUpdating: false
    }
  },
  computed: {
    currentUser() {
      return authService.getCurrentUser()
    },
    filteredAccounts() {
      if (!this.searchKeyword.trim()) {
        return this.accounts
      }
      const keyword = this.searchKeyword.toLowerCase()
      return this.accounts.filter(
        acc => acc.username.toLowerCase().includes(keyword)
      )
    }
  },
  mounted() {
    this.checkAdminPermission()
    this.loadAccounts()
  },
  methods: {
    checkAdminPermission() {
      if (!authService.isLoggedIn()) {
        this.$message.warning('请先登录')
        this.$router.push('/login')
        return
      }

      if (!authService.isAdmin()) {
        this.$message.error('无权访问权限管理页面')
        this.$router.push('/')
      }
    },

    async loadAccounts() {
      this.isLoading = true
      try {
        this.accounts = await authService.getAllAccounts()
      } catch (error) {
        this.$message.error('加载账号列表失败')
        console.error(error)
      } finally {
        this.isLoading = false
      }
    },

    handleSearch() {
    },

    getRoleTagType(role) {
      const types = {
        admin: 'danger',
        user: 'primary',
        viewer: 'info'
      }
      return types[role] || 'info'
    },

    getRoleName(role) {
      const names = {
        admin: '管理员',
        user: '普通用户',
        viewer: '只读用户'
      }
      return names[role] || role
    },

    formatDate(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    showRoleDialog(user) {
      this.editingUser = user
      this.newRole = user.role
      this.showRoleEditDialog = true
    },

    async updateRole() {
      if (this.editingUser.role === this.newRole) {
        this.showRoleEditDialog = false
        return
      }

      this.isUpdating = true
      try {
        const result = await authService.updateAccountRole(
          this.editingUser.username,
          this.newRole
        )

        if (result.success) {
          this.$message.success(result.message)
          this.showRoleEditDialog = false
          await this.loadAccounts()
        }
      } catch (error) {
        this.$message.error(error.message)
      } finally {
        this.isUpdating = false
      }
    },

    confirmDelete(user) {
      this.$confirm(
        `确定要删除用户"${user.username}"吗？删除后该用户将无法登录。`,
        '删除确认',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning',
          center: true
        }
      ).then(async () => {
        try {
          const result = await authService.deleteAccount(user.username)
          if (result.success) {
            this.$message.success(result.message)
            await this.loadAccounts()
          }
        } catch (error) {
          this.$message.error(error.message)
        }
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 20px;
}

.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
}

.admin-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  color: #dc2626;
}

.search-section {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.search-input {
  max-width: 400px;
  flex: 1;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 10px;
}

.account-table {
  width: 100%;
}

.account-table :deep(.el-table__header th) {
  background: #f8fafc;
  color: #374151;
  font-weight: 600;
  font-size: 14px;
}

.account-table :deep(.el-table__body td) {
  font-size: 14px;
}

.username-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.table-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f8fafc;
}

.total-count {
  font-size: 14px;
  color: #6b7280;
}

.role-edit-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.edit-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  font-size: 20px;
}

.edit-username {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.role-form {
  width: 100%;
}

.role-radio-group {
  display: flex;
  width: 100%;
}

.role-radio-group :deep(.el-radio-button__inner) {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.role-description {
  width: 100%;
  padding: 16px;
  background: #f8fafc;
  border-radius: 10px;
}

.role-description .desc {
  margin: 0;
  font-size: 14px;
  text-align: center;
}

.desc.admin-desc {
  color: #dc2626;
}

.desc.user-desc {
  color: #409EFF;
}

.desc.viewer-desc {
  color: #6b7280;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .search-section {
    flex-direction: column;
  }

  .search-input {
    max-width: 100%;
  }

  .action-buttons {
    flex-direction: column;
  }

  .role-radio-group {
    flex-direction: column;
  }
}
</style>
