<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <div class="logo">
          <svg viewBox="0 0 40 40" width="40" height="40">
            <circle cx="20" cy="20" r="20" fill="#409EFF"/>
            <path d="M12 2L13.09 8.26L20 9L13.09 15.74L12 22L10.91 15.74L4 9L10.91 8.26L12 2Z" fill="white"/>
          </svg>
        </div>
        <h1 class="title">智能体平台</h1>
      </div>

      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        class="login-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="passwordForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            size="large"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="passwordForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handlePasswordLogin"
            ref="passwordInput"
          />
        </el-form-item>

        <div class="form-options">
          <el-checkbox v-model="passwordForm.remember">记住我</el-checkbox>
          <el-link type="primary" :underline="false">忘记密码?</el-link>
        </div>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-button"
            :loading="isLoading"
            @click="handlePasswordLogin"
          >
            登录
          </el-button>
        </el-form-item>

        <div class="register-link">
          还没有账号?
          <router-link to="/register">立即注册</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
import { User, Lock } from '@element-plus/icons-vue'
import { authService } from '../services/authService'

export default {
  name: 'LoginPage',
  components: {
    User,
    Lock
  },
  data() {
    return {
      isLoading: false,
      passwordForm: {
        username: '',
        password: '',
        remember: false
      },
      passwordRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    async handlePasswordLogin() {
      try {
        await this.$refs.passwordFormRef.validate()
      } catch {
        return
      }

      this.isLoading = true
      try {
        const result = await authService.login(
          this.passwordForm.username,
          this.passwordForm.password
        )

        if (result.success) {
          this.$message.success(result.message)
          this.$router.push('/')
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
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.login-header {
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
  margin: 0;
  letter-spacing: 2px;
}

.login-form {
  margin-top: 24px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 24px;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.login-form :deep(.el-input__wrapper:hover) {
  border-color: #409EFF;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: #409EFF;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.2);
}

.login-form :deep(.el-input__inner) {
  height: 48px;
  font-size: 15px;
}

.login-form :deep(.el-input__prefix) {
  color: #9ca3af;
}

.login-form :deep(.el-input__prefix-inner) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.form-options :deep(.el-checkbox__label) {
  color: #6b7280;
  font-size: 14px;
}

.form-options :deep(.el-link--primary) {
  font-size: 14px;
}

.login-button {
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

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.4);
}

.login-button:active {
  transform: translateY(0);
}

.register-link {
  text-align: center;
  margin-top: 8px;
  font-size: 14px;
  color: #6b7280;
}

.register-link a {
  color: #409EFF;
  text-decoration: none;
  font-weight: 500;
  margin-left: 4px;
}

.register-link a:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .login-container {
    padding: 24px;
  }

  .title {
    font-size: 24px;
  }
}
</style>
