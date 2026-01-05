<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-header">
        <div class="logo">
          <svg viewBox="0 0 40 40" width="40" height="40">
            <circle cx="20" cy="20" r="20" fill="#409EFF"/>
            <path d="M12 2L13.09 8.26L20 9L13.09 15.74L12 22L10.91 15.74L4 9L10.91 8.26L12 2Z" fill="white"/>
          </svg>
        </div>
        <h1 class="title">创建账号</h1>
        <p class="subtitle">加入智能体平台，开启AI之旅</p>
      </div>

      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        class="register-form"
        label-position="top"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            size="large"
            clearable
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码（至少6位）"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item label="用户角色" prop="role">
          <el-select
            v-model="registerForm.role"
            placeholder="请选择用户角色"
            size="large"
            class="role-select"
          >
            <el-option
              label="普通用户"
              value="user"
            >
              <div class="role-option">
                <span>普通用户</span>
                <span class="role-desc">可以使用平台功能，创建和管理智能体</span>
              </div>
            </el-option>
            <el-option
              label="只读用户"
              value="viewer"
            >
              <div class="role-option">
                <span>只读用户</span>
                <span class="role-desc">只能查看和使用已有智能体，无法创建</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <div class="role-info">
          <el-icon><InfoFilled /></el-icon>
          <span>选择角色后，管理员可以随时调整您的权限</span>
        </div>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="register-button"
            :loading="isLoading"
            @click="handleRegister"
          >
            立即注册
          </el-button>
        </el-form-item>

        <div class="login-link">
          已有账号?
          <router-link to="/login">立即登录</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
import { User, Lock, InfoFilled } from '@element-plus/icons-vue'
import { authService } from '../services/authService'

export default {
  name: 'RegisterPage',
  components: {
    User,
    Lock,
    InfoFilled
  },
  data() {
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== this.registerForm.password) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }

    return {
      isLoading: false,
      registerForm: {
        username: '',
        password: '',
        confirmPassword: '',
        role: 'user'
      },
      registerRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '用户名长度在3-20个字符之间', trigger: 'blur' },
          { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, max: 20, message: '密码长度在6-20个字符之间', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请确认密码', trigger: 'blur' },
          { validator: validateConfirmPassword, trigger: 'blur' }
        ],
        role: [
          { required: true, message: '请选择用户角色', trigger: 'change' }
        ]
      }
    }
  },
  methods: {
    async handleRegister() {
      try {
        await this.$refs.registerFormRef.validate()
      } catch {
        return
      }

      this.isLoading = true
      try {
        const result = await authService.register(
          this.registerForm.username,
          this.registerForm.password,
          this.registerForm.role
        )

        if (result.success) {
          this.$message.success(result.message)
          this.$router.push('/login')
        }
      } catch (error) {
        this.$message.error(error.message)
      } finally {
        this.isLoading = false
      }
    }
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-container {
  width: 100%;
  max-width: 460px;
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  margin-bottom: 16px;
}

.logo svg {
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
  letter-spacing: 2px;
}

.subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.register-form {
  margin-top: 24px;
}

.register-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.register-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #374151;
  padding-bottom: 8px;
}

.register-form :deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.register-form :deep(.el-input__wrapper:hover) {
  border-color: #409EFF;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);
}

.register-form :deep(.el-input__wrapper.is-focus) {
  border-color: #409EFF;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.2);
}

.register-form :deep(.el-input__inner) {
  height: 48px;
  font-size: 15px;
}

.register-form :deep(.el-input__prefix) {
  color: #9ca3af;
}

.role-select {
  width: 100%;
}

.role-option {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
}

.role-option span:first-child {
  font-weight: 500;
  color: #374151;
}

.role-desc {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.role-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f0f9ff;
  border-radius: 10px;
  margin-bottom: 24px;
  font-size: 13px;
  color: #0369a1;
}

.role-info .el-icon {
  flex-shrink: 0;
}

.register-button {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #409EFF 0%, #667eea 100%);
  border: none;
  transition: all 0.3s ease;
}

.register-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.4);
}

.register-button:active {
  transform: translateY(0);
}

.login-link {
  text-align: center;
  margin-top: 8px;
  font-size: 14px;
  color: #6b7280;
}

.login-link a {
  color: #409EFF;
  text-decoration: none;
  font-weight: 500;
  margin-left: 4px;
}

.login-link a:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .register-container {
    padding: 24px;
  }

  .title {
    font-size: 24px;
  }

  .subtitle {
    font-size: 13px;
  }
}
</style>
