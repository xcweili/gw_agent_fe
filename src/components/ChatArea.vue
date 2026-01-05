<template>
  <div class="main-content">
    <div class="chat-container">
      <div v-if="!selectedAgent" class="empty-state-chat">
        <div class="empty-state-content">
          <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSI4MCIgZmlsbD0iIzQwOUVGRiIgb3BhY2l0eT0iMC4xMiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNjAiIGZpbGw9IiM0MDlFRkYiIG9wYWNpdHk9IjAuMiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iMjUiIGZpbGw9IiM0MDlFRkYiLz48cmVjdCB4PSI3MCIgeT0iNzUiIHdpZHRoPSI2MCIgaGVpZ2h0PSI1MCIgcng9IjgiIGZpbGw9IiM0MDlFRkYiIG9wYWNpdHk9IjAuOCIvPjxjaXJjbGUgY3g9Ijg1IiBjeT0iOTAiIHI9IjUiIGZpbGw9IndoaXRlIi8+PGNpcmNsZSBjeD0iMTE1IiBjeT0iOTAiIHI9IjUiIGZpbGw9IndoaXRlIi8+PHJlY3QgeD0iOTAiIHk9IjEwNSIgd2lkdGg9IjIwIiBoZWlnaHQ9IjQiIHJ4PSIyIiBmaWxsPSJ3aGl0ZSIvPjxwYXRoIGQ9Ik0xMDAgMTM1TDEwMCAxNTBMODUgMTQ1TDEwMCAxMzVMMTE1IDE0NSIgc3Ryb2tlPSIjNDA5RUZGIiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==" class="empty-img" />
          <h2 class="empty-title">选择智能体开始对话</h2>
          <p class="empty-description">从左侧选择一个智能体，开始您的智能对话体验</p>
          <div class="quick-start-cards">
            <div class="quick-start-card" v-for="agent in recentAgents" :key="agent.id" @click="selectAgent(agent)">
              <img :src="agent.icon" :alt="agent.name" class="quick-start-icon" />
              <span class="quick-start-name">{{ agent.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <template v-else>
        <div class="chat-header">
          <div class="chat-header-info">
            <div class="agent-avatar-large">
              <img :src="selectedAgent.icon || defaultIcon" :alt="selectedAgent.name" />
            </div>
            <div class="agent-details">
              <h3 class="agent-name-large">{{ selectedAgent.name }}</h3>
              <p class="agent-description-large">{{ selectedAgent.description }}</p>
            </div>
          </div>
          <div class="chat-header-actions">
            <el-tooltip content="开启新对话" placement="bottom">
              <el-button class="header-btn" circle @click="startNewChat">
                <el-icon><Plus /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="清空对话历史" placement="bottom">
              <el-button class="header-btn" circle @click="confirmClearChat">
                <el-icon><Delete /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>

        <div class="chat-messages-area" ref="chatMessages">
          <div class="messages-inner">
            <div v-if="messages.length === 0" class="welcome-message">
              <div class="welcome-avatar">
                <img :src="selectedAgent.icon || defaultIcon" :alt="selectedAgent.name" />
              </div>
              <div class="welcome-content">
                <h4>你好！我是 {{ selectedAgent.name }}</h4>
                <p>{{ selectedAgent.description }}</p>
                <div v-if="selectedAgent.questions && selectedAgent.questions.length > 0" class="suggested-questions">
                  <p class="suggested-title">你可以问我：</p>
                  <div class="suggested-tags">
                    <el-tag
                      v-for="question in selectedAgent.questions.slice(0, 4)"
                      :key="question"
                      class="suggested-tag"
                      @click="sendQuickQuestion(question)"
                    >
                      {{ question }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-for="message in messages"
              :key="message.id"
              class="message-wrapper"
              :class="message.role"
            >
              <div class="message-avatar">
                <el-avatar v-if="message.role === 'user'" :size="36">
                  {{ currentUser?.username?.charAt(0)?.toUpperCase() || 'U' }}
                </el-avatar>
                <div v-else class="agent-avatar-small">
                  <img :src="selectedAgent.icon || defaultIcon" :alt="selectedAgent.name" />
                </div>
              </div>

              <div class="message-content-wrapper">
                <div class="message-role-name">
                  {{ message.role === 'user' ? (currentUser?.username || '你') : selectedAgent.name }}
                </div>

                <div class="message-bubble" :class="message.role">
                  <div v-if="message.think" class="think-section">
                    <div class="think-header" @click="toggleThink(message.id)">
                      <el-icon><View /></el-icon>
                      <span>思考过程 {{ thinkExpanded[message.id] ? '▲' : '▼' }}</span>
                    </div>
                    <div class="think-content" :class="{ collapsed: !thinkExpanded[message.id] }">
                      {{ message.think }}
                    </div>
                  </div>

                  <div v-if="message.files && message.files.length > 0" class="message-files">
                    <div v-for="file in message.files" :key="file.name" class="file-item">
                      <el-icon><Document /></el-icon>
                      <span>{{ file.name }}</span>
                    </div>
                  </div>

                  <div class="message-text">
                    {{ message.content }}
                    <span v-if="isLoading && message.id === lastAssistantMessageId" class="typing-indicator">
                      <span></span><span></span><span></span>
                    </span>
                  </div>
                </div>

                <div class="message-actions">
                  <el-button size="small" text @click="copyMessage(message.content)">
                    <el-icon><CopyDocument /></el-icon>
                  </el-button>
                  <el-button size="small" text @click="regenerateMessage(message)">
                    <el-icon><Refresh /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>

            <div v-if="isLoading" class="message-wrapper assistant">
              <div class="message-avatar">
                <div class="agent-avatar-small">
                  <img :src="selectedAgent.icon || defaultIcon" :alt="selectedAgent.name" />
                </div>
              </div>
              <div class="message-content-wrapper">
                <div class="message-role-name">{{ selectedAgent.name }}</div>
                <div class="message-bubble assistant loading">
                  <div class="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-input-section">
          <div class="input-container">
            <div class="quick-questions-bar" v-if="messages.length === 0 && selectedAgent.questions?.length > 0">
              <div class="quick-questions-scroll">
                <el-tag
                  v-for="question in selectedAgent.questions"
                  :key="question"
                  class="quick-question-tag"
                  @click="sendQuickQuestion(question)"
                >
                  {{ question }}
                </el-tag>
              </div>
            </div>

            <div class="chat-input-wrapper">
              <div class="input-actions-left">
                <el-tooltip content="上传文件" placement="top">
                  <div class="input-action-btn" @click="triggerFileUpload">
                    <el-icon><DocumentAdd /></el-icon>
                  </div>
                </el-tooltip>
              </div>

              <el-input
                v-model="inputMessage"
                type="textarea"
                :rows="1"
                :autosize="{ minRows: 1, maxRows: 4 }"
                placeholder="输入消息，按 Enter 发送，Shift+Enter 换行..."
                class="chat-input-textarea"
                @keydown.enter.exact.prevent="sendMessage"
                @keydown.enter.shift.prevent="handleShiftEnter"
                ref="messageInput"
              />

              <div class="input-actions-right">
                <el-tooltip content="发送消息" placement="top">
                  <el-button
                    type="primary"
                    class="send-btn"
                    :loading="isLoading"
                    @click="sendMessage"
                    :disabled="!canSend"
                  >
                    <el-icon><Promotion /></el-icon>
                  </el-button>
                </el-tooltip>
              </div>
            </div>

            <div class="uploaded-files-preview" v-if="uploadedFiles.length > 0">
              <div v-for="(file, index) in uploadedFiles" :key="index" class="uploaded-file-item">
                <el-icon><Document /></el-icon>
                <span class="file-name">{{ file.name }}</span>
                <el-icon class="remove-file" @click="removeFile(index)"><Close /></el-icon>
              </div>
            </div>
          </div>

          <div class="input-footer">
            <span class="footer-hint">按 Enter 发送，Shift + Enter 换行</span>
          </div>
        </div>
      </template>
    </div>

    <input ref="fileInput" type="file" style="display: none" @change="handleFileUpload" multiple accept=".txt,.md,.json,.csv,.xlsx,.doc,.docx,.pdf" />
  </div>
</template>

<script>
import {
  DocumentAdd,
  Promotion,
  View,
  Document,
  CopyDocument,
  Refresh,
  Delete,
  Plus,
  Close
} from '@element-plus/icons-vue'
import { chatService } from '../services/chatService'
import { backendService } from '../services/backendService'
import { ElMessageBox } from 'element-plus'

export default {
  name: 'ChatArea',
  components: {
    DocumentAdd,
    Promotion,
    View,
    Document,
    CopyDocument,
    Refresh,
    Delete,
    Plus,
    Close
  },
  inject: {
    currentUser: { default: null }
  },
  props: {
    selectedAgent: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      messages: [],
      inputMessage: '',
      isLoading: false,
      thinkExpanded: {},
      uploadedFiles: [],
      recentAgents: [],
      defaultIcon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iIzQwOUVGRiIvPjxzd2VyIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4PSI4IiB5PSI4Ij48cGF0aCBkPSJNMTIgMkwxMy4wOSA4LjI2TDIwIDlMMTMuMDkgMTUuNzRMMTIgMjJMTAuOTEgMTUuNzRMNCA5TDEwLjA5IDguMjZMMTIgMloiIGZpbGw9IndoaXRlIi8+PC9zdmc+PC9zdmc+'
    }
  },
  computed: {
    lastAssistantMessageId() {
      const assistantMessages = this.messages.filter(m => m.role === 'assistant' && m.content)
      return assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1].id : null
    },
    canSend() {
      return this.selectedAgent && (this.inputMessage.trim() || this.uploadedFiles.length > 0)
    }
  },
  watch: {
    selectedAgent: {
      handler(newAgent) {
        if (newAgent) {
          this.loadRecentAgents()
          this.startNewChat()
        }
      },
      immediate: true
    }
  },
  async mounted() {
    await this.loadRecentAgents()
  },
  methods: {
    async loadRecentAgents() {
      try {
        const result = await backendService.getAgents()
        if (result.success && result.data) {
          this.recentAgents = result.data.slice(0, 4)
        }
      } catch (error) {
        console.error('加载智能体列表失败:', error)
      }
    },

    selectAgent(agent) {
      this.$emit('agent-selected', agent)
    },

    startNewChat() {
      this.messages = []
      this.inputMessage = ''
      this.thinkExpanded = {}
      this.uploadedFiles = []
    },

    confirmClearChat() {
      ElMessageBox.confirm('确定要清空当前对话吗？', '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.startNewChat()
      }).catch(() => {})
    },

    handleShiftEnter(event) {
      const start = event.target.selectionStart
      const end = event.target.selectionEnd
      this.inputMessage = this.inputMessage.substring(0, start) + '\n' + this.inputMessage.substring(end)
      this.$nextTick(() => {
        event.target.selectionStart = event.target.selectionEnd = start + 1
      })
    },

    async sendMessage() {
      if (!this.canSend || this.isLoading) return

      const userMessage = this.inputMessage.trim()
      const files = [...this.uploadedFiles]

      this.inputMessage = ''
      this.uploadedFiles = []

      const messageId = Date.now()
      this.messages.push({
        id: messageId,
        role: 'user',
        content: userMessage,
        think: null,
        files: files.length > 0 ? files.map(f => ({ name: f.name, size: f.size })) : null,
        timestamp: new Date().toISOString()
      })

      const assistantMessageId = messageId + 1
      this.messages.push({
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        think: null,
        timestamp: new Date().toISOString()
      })

      this.isLoading = true
      this.$nextTick(() => this.scrollToBottom())

      try {
        const response = await chatService.sendMessage({
          agent: this.selectedAgent,
          messages: this.messages.filter(m => m.id !== assistantMessageId),
          userInput: userMessage
        })

        const assistantMessage = this.messages.find(m => m.id === assistantMessageId)
        if (assistantMessage) {
          if (response.think) {
            assistantMessage.think = response.think
          }
          this.simulateStreamingResponse(assistantMessage, response.content)
        }
      } catch (error) {
        console.error('发送消息失败:', error)
        const assistantMessage = this.messages.find(m => m.id === assistantMessageId)
        if (assistantMessage) {
          assistantMessage.content = '抱歉，出现了一些问题，请稍后再试。'
        }
        this.isLoading = false
      }
    },

    sendQuickQuestion(question) {
      this.inputMessage = question
      this.sendMessage()
    },

    simulateStreamingResponse(message, fullContent) {
      let index = 0
      const typeText = () => {
        if (index < fullContent.length && this.messages.find(m => m.id === message.id)) {
          const chunkSize = Math.random() > 0.8 ? 3 : (Math.random() > 0.6 ? 2 : 1)
          message.content = fullContent.slice(0, index + chunkSize)
          index += chunkSize

          let delay = 20
          if (fullContent[index - 1] === '，' || fullContent[index - 1] === '，') delay = 80
          else if (fullContent[index - 1] === '。' || fullContent[index - 1] === '！' || fullContent[index - 1] === '？') delay = 120
          else if (Math.random() > 0.9) delay = 60

          this.$nextTick(() => this.scrollToBottom())
          setTimeout(typeText, delay)
        } else {
          message.content = fullContent
          this.isLoading = false
          this.$nextTick(() => this.scrollToBottom())
        }
      }
      typeText()
    },

    toggleThink(messageId) {
      this.$set(this.thinkExpanded, messageId, !this.thinkExpanded[messageId])
    },

    copyMessage(content) {
      navigator.clipboard.writeText(content)
    },

    regenerateMessage(message) {
      const userMessage = this.messages[this.messages.indexOf(message) - 1]
      if (userMessage) {
        this.inputMessage = userMessage.content
        this.messages = this.messages.filter(m => m.id !== message.id)
        this.sendMessage()
      }
    },

    triggerFileUpload() {
      this.$refs.fileInput.click()
    },

    handleFileUpload(event) {
      const files = Array.from(event.target.files)
      files.forEach(file => {
        this.uploadedFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          file: file
        })
      })
      event.target.value = ''
    },

    removeFile(index) {
      this.uploadedFiles.splice(index, 1)
    },

    scrollToBottom() {
      const container = this.$refs.chatMessages
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    }
  }
}
</script>

<style scoped>
.main-content {
  flex: 1;
  height: 100vh;
  background: #f5f7fa;
  margin-left: 280px;
  display: flex;
  flex-direction: column;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.empty-state-chat {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.empty-state-content {
  text-align: center;
  max-width: 600px;
}

.empty-illustration {
  width: 200px;
  height: 200px;
  margin-bottom: 32px;
  opacity: 0.8;
}

.empty-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.empty-description {
  font-size: 15px;
  color: #909399;
  margin-bottom: 32px;
}

.quick-start-cards {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.quick-start-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background: #fff;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.quick-start-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.15);
}

.quick-start-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  object-fit: cover;
}

.quick-start-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
}

.chat-header-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.agent-avatar-large {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  overflow: hidden;
  background: #409EFF;
}

.agent-avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.agent-details {
  display: flex;
  flex-direction: column;
}

.agent-name-large {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.agent-description-large {
  font-size: 13px;
  color: #909399;
  margin: 4px 0 0;
}

.chat-header-actions {
  display: flex;
  gap: 8px;
}

.header-btn {
  color: #909399;
}

.header-btn:hover {
  color: #409EFF;
  background: rgba(64, 158, 255, 0.1);
}

.chat-messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  scroll-behavior: smooth;
}

.messages-inner {
  max-width: 900px;
  margin: 0 auto;
}

.welcome-message {
  display: flex;
  gap: 16px;
  padding: 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.welcome-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  background: #409EFF;
}

.welcome-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.welcome-content h4 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px;
}

.welcome-content p {
  font-size: 14px;
  color: #606266;
  margin: 0;
  line-height: 1.6;
}

.suggested-questions {
  margin-top: 16px;
}

.suggested-title {
  font-size: 13px;
  color: #909399;
  margin: 0 0 8px;
}

.suggested-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggested-tag {
  cursor: pointer;
  transition: all 0.2s ease;
}

.suggested-tag:hover {
  background: #409EFF;
  color: #fff;
}

.message-wrapper {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.message-wrapper.user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.agent-avatar-small {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  overflow: hidden;
  background: #409EFF;
}

.agent-avatar-small img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-content-wrapper {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

.message-role-name {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.message-wrapper.user .message-role-name {
  text-align: right;
}

.message-bubble {
  padding: 14px 18px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.7;
  position: relative;
}

.message-bubble.user {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.message-bubble.assistant {
  background: #fff;
  color: #303133;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.message-bubble.loading {
  display: flex;
  align-items: center;
  padding: 20px;
}

.message-actions {
  display: flex;
  gap: 4px;
  margin-top: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.message-content-wrapper:hover .message-actions {
  opacity: 1;
}

.think-section {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #ebeef5;
}

.think-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #909399;
  cursor: pointer;
  padding: 8px 0;
}

.think-content {
  font-size: 13px;
  color: #606266;
  line-height: 1.8;
  background: #f4f4f5;
  padding: 12px;
  border-radius: 8px;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
  transition: all 0.3s ease;
}

.think-content.collapsed {
  max-height: 0;
  padding: 0 12px;
  overflow: hidden;
}

.message-files {
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  font-size: 13px;
}

.message-bubble.user .file-item {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.message-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.typing-indicator {
  display: inline-flex;
  gap: 4px;
  margin-left: 8px;
  vertical-align: middle;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  background: #909399;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: 0s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.chat-input-section {
  background: #fff;
  border-top: 1px solid #ebeef5;
  padding: 16px 24px 12px;
}

.input-container {
  max-width: 900px;
  margin: 0 auto;
}

.quick-questions-bar {
  margin-bottom: 12px;
}

.quick-questions-scroll {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-question-tag {
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-question-tag:hover {
  background: #409EFF;
  color: #fff;
  border-color: #409EFF;
}

.chat-input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  background: #f5f7fa;
  border-radius: 12px;
  padding: 8px 12px;
  border: 1px solid #ebeef5;
  transition: all 0.2s ease;
}

.chat-input-wrapper:focus-within {
  border-color: #409EFF;
  background: #fff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.input-actions-left,
.input-actions-right {
  display: flex;
  align-items: center;
}

.input-action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: #909399;
  cursor: pointer;
  transition: all 0.2s ease;
}

.input-action-btn:hover {
  background: rgba(64, 158, 255, 0.1);
  color: #409EFF;
}

.chat-input-textarea {
  flex: 1;
}

.chat-input-textarea :deep(.el-textarea__inner) {
  border: none;
  background: transparent;
  resize: none;
  font-size: 14px;
  line-height: 1.6;
  padding: 6px 0;
}

.chat-input-textarea :deep(.el-textarea__inner:focus) {
  box-shadow: none;
}

.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  padding: 0;
}

.uploaded-files-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.uploaded-file-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f4f4f5;
  border-radius: 6px;
  font-size: 13px;
}

.remove-file {
  cursor: pointer;
  color: #909399;
  margin-left: 4px;
}

.remove-file:hover {
  color: #f56c6c;
}

.input-footer {
  text-align: center;
  margin-top: 8px;
}

.footer-hint {
  font-size: 12px;
  color: #c0c4cc;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}
</style>
