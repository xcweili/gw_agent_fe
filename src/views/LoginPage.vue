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

      <el-tabs v-model="activeTab" class="login-tabs">
        <el-tab-pane label="密码登录" name="password">
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
        </el-tab-pane>

        <el-tab-pane label="验证码登录" name="code">
          <el-form
            ref="codeFormRef"
            :model="codeForm"
            :rules="codeRules"
            class="login-form"
          >
            <el-form-item prop="username">
              <el-input
                v-model="codeForm.username"
                placeholder="请输入用户名"
                prefix-icon="User"
                size="large"
                clearable
              />
            </el-form-item>

            <el-form-item prop="code">
              <div class="code-input-wrapper">
                <el-input
                  v-model="codeForm.code"
                  placeholder="请输入验证码"
                  prefix-icon="Key"
                  size="large"
                  class="code-input"
                />
                <el-button
                  size="large"
                  class="send-code-btn"
                  :disabled="countdown > 0"
                  @click="sendCode"
                >
                  {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                </el-button>
              </div>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                class="login-button"
                :loading="isLoading"
                @click="handleCodeLogin"
              >
                登录
              </el-button>
            </el-form-item>

            <div class="register-link">
              还没有账号?
              <router-link to="/register">立即注册</router-link>
            </div>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script>
import { User, Lock, Key } from '@element-plus/icons-vue'
import { authService } from '../services/authService'

export default {
  name: 'LoginPage',
  components: {
    User,
    Lock,
    Key
  },
  data() {
    return {
      activeTab: 'password',
      isLoading: false,
      countdown: 0,
      passwordForm: {
        username: '',
        password: '',
        remember: false
      },
      codeForm: {
        username: '',
        code: ''
      },
      passwordRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
        ]
      },
      codeRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        code: [
          { required: true, message: '请输入验证码', trigger: 'blur' }
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
    },

    sendCode() {
      if (!this.codeForm.username) {
        this.$message.warning('请先输入用户名')
        return
      }

      this.countdown = 60
      const timer = setInterval(() => {
        this.countdown--
        if (this.countdown <= 0) {
          clearInterval(timer)
        }
      }, 1000)

      this.$message.success('验证码已发送')
    },

    handleCodeLogin() {
      this.$message.info('验证码登录功能开发中，请使用密码登录')
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

.login-tabs {
  margin-bottom: 24px;
}

.login-tabs :deep(.el-tabs__nav-scroll) {
  display: flex;
  justify-content: center;
}

.login-tabs :deep(.el-tabs__item) {
  font-size: 16px;
  font-weight: 500;
  color: #6b7280;
  padding: 0 24px;
  height: 50px;
  line-height: 50px;
}

.login-tabs :deep(.el-tabs__item.is-active) {
  color: #409EFF;
  font-weight: 600;
}

.login-tabs :deep(.el-tabs__active-bar) {
  background: #409EFF;
  height: 3px;
  border-radius: 2px;
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

.code-input-wrapper {
  display: flex;
  gap: 12px;
}

.code-input {
  flex: 1;
}

.send-code-btn {
  min-width: 120px;
  height: 48px;
  border-radius: 12px;
  font-weight: 500;
  background: white;
  border: 1px solid #e5e7eb;
  color: #409EFF;
  transition: all 0.3s ease;
}

.send-code-btn:hover:not(:disabled) {
  border-color: #409EFF;
  background: #f0f9ff;
}

.send-code-btn:disabled {
  background: #f3f4f6;
  border-color: #e5e7eb;
  color: #9ca3af;
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

  .login-tabs :deep(.el-tabs__item) {
    padding: 0 16px;
    font-size: 14px;
  }

  .code-input-wrapper {
    flex-direction: column;
  }

  .send-code-btn {
    width: 100%;
  }
}
</style>
