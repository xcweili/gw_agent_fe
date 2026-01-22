<template>
  <div class="main-content">
    <div class="chat-container">
      <div v-if="!selectedAgent" class="empty-state-chat">
        <div class="empty-state-content">
          <div class="empty-illustration">
            <svg width="240" height="240" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="80" fill="#409EFF" opacity="0.1"/>
              <circle cx="100" cy="100" r="60" fill="#409EFF" opacity="0.2"/>
              <circle cx="100" cy="100" r="25" fill="#409EFF"/>
              <rect x="70" y="75" width="60" height="50" rx="8" fill="#409EFF" opacity="0.8"/>
              <circle cx="85" cy="90" r="5" fill="white"/>
              <circle cx="115" cy="90" r="5" fill="white"/>
              <rect x="90" y="105" width="20" height="4" rx="2" fill="white"/>
              <path d="M100 135L100 150L85 145L100 135L115 145Z" stroke="#409EFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h2 class="empty-title">欢迎使用智能体对话系统</h2>
          <p class="empty-description">从左侧选择一个智能体，或点击下方快捷方式开始对话</p>
          <div class="quick-start-cards">
            <div class="quick-start-card" v-for="agent in recentAgents" :key="agent.id" @click="selectAgent(agent)">
              <div class="quick-start-icon-wrapper">
                <img :src="agent.icon || defaultIcon" :alt="agent.name" class="quick-start-icon" />
              </div>
              <span class="quick-start-name">{{ agent.name }}</span>
              <span class="quick-start-desc">{{ agent.description }}</span>
            </div>
          </div>
        </div>
      </div>

      <template v-else>
        <div class="chat-header">
          <div class="chat-header-info">
            <div class="agent-avatar-large">
              <div class="avatar-container">
                <img :src="selectedAgent.icon || defaultIcon" :alt="selectedAgent.name" />
                <div class="avatar-status"></div>
              </div>
            </div>
            <div class="agent-details">
              <div class="agent-name-row">
                <h3 class="agent-name-large">{{ selectedAgent.name }}</h3>
                <el-tag class="agent-status-tag" size="small" type="success">在线</el-tag>
              </div>
              <p class="agent-description-large">{{ selectedAgent.description }}</p>
            </div>
          </div>
          <div class="chat-header-actions">
            <el-button 
              class="new-chat-btn"
              type="primary"
              size="small"
              @click="startNewChat"
            >
              开启新对话
            </el-button>
          </div>
        </div>

        <div class="chat-messages-area" ref="chatMessages">
          <div class="messages-inner">
            <div v-if="messages.length === 0 && selectedAgent.questions && selectedAgent.questions.length > 0" class="welcome-message">
              <div class="welcome-content">
                <h4 class="welcome-title">猜你想问</h4>
                <div class="suggested-questions">
                  <div class="suggested-tags">
                    <div
                      v-for="question in selectedAgent.questions.slice(0, 5)"
                      :key="question"
                      class="suggested-tag"
                      @click="sendQuickQuestion(question)"
                    >
                      <span class="question-arrow">→</span>
                      <span>{{ question }}</span>
                    </div>
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
                      <div class="think-content" :class="{ collapsed: !thinkExpanded[message.id] }" v-html="renderMarkdown(message.think)">
                      </div>
                    </div>

                  <div v-if="message.retrieverResources && message.retrieverResources.length > 0" class="retriever-resources">
                    <div class="retriever-header" @click="toggleRetriever(message.id)">
                      <el-icon><Document /></el-icon>
                      <span>知识检索结果 ({{ message.retrieverResources.length }}) {{ retrieverExpanded[message.id] ? '▲' : '▼' }}</span>
                    </div>
                    <div class="retriever-content" :class="{ collapsed: !retrieverExpanded[message.id] }">
                      <div v-for="(resource, index) in message.retrieverResources" :key="index" class="retriever-item">
                        <div class="retriever-item-title">{{ resource.title || `来源 ${index + 1}` }}</div>
                        <div class="retriever-item-content" v-html="renderMarkdown(resource.content)"></div>
                      </div>
                    </div>
                  </div>

                  <div v-if="message.files && message.files.length > 0" class="message-files">
                    <div v-for="file in message.files" :key="file.name" class="file-item">
                      <div v-if="file.url" class="file-url-container">
                        <div v-if="file.type === 'image'" class="image-preview-container">
                          <img :src="file.url" :alt="file.name" class="image-preview" />
                        </div>
                        <div v-else class="file-preview-container">
                          <el-icon><Document /></el-icon>
                        </div>
                        <div class="file-info">
                          <span class="file-name">{{ file.name }}</span>
                          <a :href="file.url" target="_blank" class="file-url-link">
                            <el-icon><Link /></el-icon>
                            打开链接
                          </a>
                        </div>
                      </div>
                      <div v-else class="file-local-container">
                        <div v-if="file.type && (file.type.startsWith('image/') || file.type === 'image')" class="image-preview-container">
                          <img v-if="file.preview" :src="file.preview" :alt="file.name" class="image-preview" />
                          <el-icon v-else><Document /></el-icon>
                        </div>
                        <div v-else class="file-preview-container">
                          <el-icon><Document /></el-icon>
                        </div>
                        <span class="file-name">{{ file.name }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="message-text-container">
                    <div class="message-text" v-html="renderMarkdown(message.content)"></div>
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


          </div>
        </div>

        <div class="chat-input-section">
          <div class="input-container">
            <!-- 已上传文件预览 -->
            <div class="uploaded-files-preview" v-if="uploadedFiles.length > 0">
              <div v-for="(file, index) in uploadedFiles" :key="index" class="uploaded-file-item" :class="{ 'has-url': file.url }">
                <template v-if="file.url">
                  <div v-if="file.type === 'image'" class="image-preview-container">
                    <img :src="file.url" :alt="file.name" class="image-preview" />
                  </div>
                  <div v-else class="file-preview-container">
                    <el-icon><Document /></el-icon>
                  </div>
                  <div class="file-info">
                    <span class="file-name">{{ file.name }}</span>
                    <span class="file-url-text">{{ truncateUrl(file.url) }}</span>
                    <el-tag size="small" type="info" class="file-tag">URL</el-tag>
                  </div>
                </template>
                <template v-else-if="file.file">
                  <div v-if="file.type && (file.type.startsWith('image/') || file.type === 'image')" class="image-preview-container">
                    <img :src="file.preview || (file.file ? URL.createObjectURL(file.file) : '')" :alt="file.name" class="image-preview" />
                  </div>
                  <div v-else class="file-preview-container">
                    <el-icon><Document /></el-icon>
                  </div>
                  <span class="file-name">{{ file.name }}</span>
                  <el-tag size="small" type="success" class="file-tag">本地</el-tag>
                </template>
                <el-icon class="remove-file" @click="removeFile(index)"><Close /></el-icon>
              </div>
            </div>
            
            <div class="chat-input-wrapper" @click="focusInput" @paste="handlePaste">
              <!-- 新增按钮（文件上传） -->
              <div class="input-actions-left">
                <el-dropdown trigger="click" @command="handleFileAction">
                  <div class="input-action-btn" @click.stop>
                    <el-icon><Plus /></el-icon>
                  </div>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="upload">
                        <el-icon><Upload /></el-icon>
                        上传本地文件
                      </el-dropdown-item>
                      <el-dropdown-item command="url">
                        <el-icon><Link /></el-icon>
                        添加远程 URL
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>

              <!-- 中间输入框 -->
              <el-input
                v-model="inputMessage"
                type="textarea"
                :rows="1"
                :autosize="{ minRows: 1, maxRows: 4 }"
                placeholder="   请输入问题"
                class="chat-input-textarea"
                @keydown.enter.exact.prevent="sendMessage"
                @keydown.enter.shift.prevent="handleShiftEnter"
                ref="messageInput"
              />
            </div>
          </div>

          <!-- 底部提示信息 -->
          <div class="input-footer">
            <span class="footer-hint">内容由AI生成，仅供参考</span>
          </div>
        </div>
      </template>
    </div>

    <input ref="fileInput" type="file" style="display: none" @change="handleFileUpload" multiple accept=".txt,.md,.json,.csv,.xlsx,.doc,.docx,.pdf,image/*" />
    
    <el-dialog
      v-model="showUrlDialog"
      title="添加远程 URL"
      width="500px"
    >
      <el-form label-position="top">
        <el-form-item label="文件 URL">
          <el-input
            v-model="remoteFileUrl"
            placeholder="请输入文件的远程 URL 地址"
          />
        </el-form-item>
        <el-form-item label="文件类型">
          <el-select v-model="remoteFileType" placeholder="选择文件类型" style="width: 100%;">
            <el-option label="图片" value="image" />
            <el-option label="文档" value="document" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUrlDialog = false">取消</el-button>
        <el-button type="primary" @click="addRemoteFile">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {
  View,
  Document,
  CopyDocument,
  Refresh,
  Plus,
  Close,
  Upload,
  Link
} from '@element-plus/icons-vue'
import { chatService } from '../services/chatService'
import { backendService } from '../services/backendService'
import { marked } from 'marked'

export default {
  name: 'ChatArea',
  components: {
    View,
    Document,
    CopyDocument,
    Refresh,
    Plus,
    Close,
    Upload,
    Link
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
      retrieverExpanded: {},
      uploadedFiles: [],
      recentAgents: [],
      defaultIcon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iIzQwOUVGRiIvPjxwYXRoIGQ9Ik0xMiAyTDEzLjA5IDguMjZMMjAgOUwxMy4wOSAxNS43NEwxMiAyMkwxMC45MSAxNS43NEw0IDlMMTAuOTEgOC4yNkwxMiAyWiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=',
      showUrlDialog: false,
      remoteFileUrl: '',
      remoteFileType: 'image'
    }
  },
  computed: {
    lastAssistantMessageId() {
      const assistantMessages = this.messages.filter(m => m.role === 'assistant')
      return assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1].id : null
    },
    canSend() {
      return this.selectedAgent && (this.inputMessage.trim() || this.uploadedFiles.length > 0)
    }
  },
  watch: {
    selectedAgent: {
      handler(newAgent, oldAgent) {
        if (newAgent) {
          this.loadRecentAgents()
          if (oldAgent && oldAgent.id !== newAgent.id) {
            chatService.resetChatflowConversation()
          }
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
          // 权限过滤：管理员可以看到所有智能体，其他用户只能看到自己创建的智能体
          const userData = localStorage.getItem('currentUser')
          const user = userData ? JSON.parse(userData) : null
          let agents = result.data
          
          if (user && user.role !== 'admin') {
            agents = agents.filter(agent => agent.createdBy === user.username)
          }
          
          this.recentAgents = agents.slice(0, 4)
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
      this.retrieverExpanded = {}
      this.uploadedFiles = []
      chatService.resetChatflowConversation()
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
      
      // 立即设置加载状态，防止重复发送请求
      this.isLoading = true
      
      const userMessage = this.inputMessage.trim()
      const files = [...this.uploadedFiles]

      this.inputMessage = ''
      this.uploadedFiles = []

      const messageId = Date.now()
      // 准备文件信息用于显示，保留完整的文件信息
      const messageFiles = files.length > 0 ? files.map(f => {
        const fileData = {
          name: f.name,
          size: f.size,
          type: f.type
        }
        
        // 保留预览信息
        if (f.preview) {
          fileData.preview = f.preview
        }
        if (f.url) {
          fileData.url = f.url
        }
        
        return fileData
      }) : null

      this.messages.push({
        id: messageId,
        role: 'user',
        content: userMessage,
        think: null,
        files: messageFiles,
        timestamp: new Date().toISOString()
      })

      const assistantMessageId = messageId + 1
      this.messages.push({
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        think: null,
        retrieverResources: [],
        timestamp: new Date().toISOString()
      })

      this.$nextTick(() => this.scrollToBottom())

      try {
        // 直接传递文件对象，chatService 会处理上传逻辑
        chatService.sendMessage({
          agent: this.selectedAgent,
          messages: this.messages.filter(m => m.id !== assistantMessageId),
          userInput: userMessage,
          files: files,
          options: {
            responseMode: 'streaming',
            onChunk: (chunk) => {
              // 收到第一个chunk后，立即停止loading
              if (this.isLoading) {
                this.isLoading = false;
              }
              
              // 找到对应的助手消息
              const messageIndex = this.messages.findIndex(m => m.id === assistantMessageId)
              if (messageIndex !== -1) {
                // Vue 3 不需要 $set，直接赋值即可触发响应式更新
                this.messages[messageIndex].content = chunk.content;
                this.messages[messageIndex].think = chunk.think;
                
                // 处理知识检索结果
                if (chunk.retrieverResources && chunk.retrieverResources.length > 0) {
                  this.messages[messageIndex].retrieverResources = chunk.retrieverResources;
                }
                
                // 滚动到底部
                this.$nextTick(() => {
                  this.scrollToBottom()
                })
              }
            }
          }
        }).catch(error => {
          console.error('发送消息失败:', error)
          const assistantMessage = this.messages.find(m => m.id === assistantMessageId)
          if (assistantMessage) {
            assistantMessage.content = '抱歉，出现了一些问题，请稍后再试。'
          }
          this.isLoading = false
        })
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

    toggleThink(messageId) {
      this.thinkExpanded[messageId] = !this.thinkExpanded[messageId]
    },

    toggleRetriever(messageId) {
      this.retrieverExpanded[messageId] = !this.retrieverExpanded[messageId]
    },

    copyMessage(content) {
      navigator.clipboard.writeText(content)
    },

    renderMarkdown(content) {
      if (!content) return ''
      // 配置marked选项，优化Markdown渲染
      marked.setOptions({
        breaks: true, // 支持换行
        gfm: true, // 支持GitHub风格的Markdown
        headerIds: true, // 为标题添加id
        mangle: false, // 不混淆邮箱
        sanitize: false // 不清理HTML，允许自定义标签
      })
      return marked(content)
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

    handleFileAction(command) {
      if (command === 'upload') {
        this.triggerFileUpload()
      } else if (command === 'url') {
        this.showUrlDialog = true
        this.remoteFileUrl = ''
        this.remoteFileType = 'image'
      }
    },

    addRemoteFile() {
      if (!this.remoteFileUrl.trim()) {
        this.$message.warning('请输入文件 URL')
        return
      }

      try {
        new URL(this.remoteFileUrl)
      } catch {
        this.$message.error('请输入有效的 URL')
        return
      }

      const url = this.remoteFileUrl.trim()
      const fileName = url.split('/').pop() || 'remote-file'
      
      this.uploadedFiles.push({
        name: fileName,
        type: this.remoteFileType,
        url: url
      })

      this.showUrlDialog = false
      this.remoteFileUrl = ''
    },

    handleFileUpload(event) {
      const files = Array.from(event.target.files)
      files.forEach(file => {
        if (file.type && file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (e) => {
            this.uploadedFiles.push({
              name: file.name,
              size: file.size,
              type: file.type,
              file: file,
              preview: e.target.result
            })
          }
          reader.readAsDataURL(file)
        } else {
          this.uploadedFiles.push({
            name: file.name,
            size: file.size,
            type: file.type,
            file: file
          })
        }
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
    },

    focusInput() {
      if (this.$refs.messageInput) {
        this.$refs.messageInput.focus()
      }
    },

    handlePaste(event) {
      const items = event.clipboardData.items
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile()
          if (file) {
            console.log('粘贴的图片文件:', {
              name: file.name,
              type: file.type,
              size: file.size
            })
            this.handlePastedImage(file)
          }
        }
      }
    },

    handlePastedImage(file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const fileData = {
          name: file.name || 'pasted-image.jpg',
          size: file.size,
          type: file.type,
          file: file,
          preview: e.target.result
        }
        console.log('添加到 uploadedFiles:', fileData)
        this.uploadedFiles.push(fileData)
      }
      reader.readAsDataURL(file)
    },

    truncateUrl(url) {
      if (!url) return ''
      return url.length > 10 ? url.substring(0, 10) + '...' : url
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
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.empty-state-content {
  text-align: center;
  max-width: 700px;
  animation: fadeInUp 0.6s ease-out;
}

.empty-illustration {
  width: 240px;
  height: 240px;
  margin: 0 auto 40px;
  opacity: 0.9;
  filter: drop-shadow(0 10px 30px rgba(64, 158, 255, 0.2));
  animation: float 3s ease-in-out infinite;
}

.empty-title {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 16px;
  letter-spacing: -0.5px;
}

.empty-description {
  font-size: 16px;
  color: #606266;
  margin-bottom: 40px;
  line-height: 1.6;
}

.quick-start-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  justify-content: center;
  margin: 0 auto;
  max-width: 800px;
}

.quick-start-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 20px;
  background: #fff;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.quick-start-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #409EFF 0%, #67C23A 100%);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.quick-start-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(64, 158, 255, 0.25);
}

.quick-start-card:hover::before {
  transform: scaleX(1);
}

.quick-start-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, #f0f5ff 0%, #e6f2ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.quick-start-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  object-fit: cover;
}

.quick-start-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.quick-start-desc {
  font-size: 13px;
  color: #909399;
  text-align: center;
  line-height: 1.5;
  max-width: 180px;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-15px);
  }
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 150px 20px 32px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.chat-header-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.agent-avatar-large {
  position: relative;
  width: 72px;
  height: 72px;
}

.avatar-container {
  width: 100%;
  height: 100%;
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  background: linear-gradient(135deg, #409EFF 0%, #67C23A 100%);
  transition: transform 0.3s ease;
}

.avatar-container:hover {
  transform: scale(1.05);
}

.agent-avatar-large img {
  width: 100%;
  height: 100%;
  border-radius: 20px;
  object-fit: cover;
}

.avatar-status {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  background: #67C23A;
  border: 3px solid #fff;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.5);
  animation: pulse 2s infinite;
}

.agent-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.agent-name-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.agent-name-large {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  margin: 0;
  letter-spacing: -0.3px;
}

.agent-status-tag {
  font-size: 12px;
  font-weight: 500;
}

.agent-description-large {
  font-size: 14px;
  color: #606266;
  margin: 0;
  line-height: 1.5;
  max-width: 500px;
}

.chat-header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.new-chat-btn {
    border-radius: 24px;
    padding: 8px 22px;
    font-size: 15px;
    font-weight: 600;
    transition: all 0.3s ease;
    background: linear-gradient(135deg, #409EFF 0%, #67C23A 100%);
    border: none;
    color: #fff;
  }

  .new-chat-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(64, 158, 255, 0.4);
  }

  .new-chat-btn:active {
    transform: translateY(0);
  }

.header-btn {
  color: #909399;
  width: 36px;
  height: 36px;
  transition: all 0.3s ease;
}

.header-btn:hover {
  color: #409EFF;
  background: rgba(64, 158, 255, 0.1);
  transform: translateY(-1px);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
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

.welcome-content {
  width: 100%;
  max-width: 800px;
  text-align: left;
}

.welcome-content h4 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px;
}

.suggested-questions {
  margin-top: 0;
}

.suggested-tags {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggested-tag {
    cursor: pointer;
    font-size: 14px;
    padding: 8px 16px;
    border-radius: 8px;
    background: #f5f7fa;
    color: #303133;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: background-color 0.2s ease;
  }

  .suggested-tag:hover {
    background: #e9ecef;
  }

  .question-arrow {
    color: #409EFF;
    font-size: 12px;
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
    animation: fadeInUp 0.3s ease forwards;
  }

  .message-bubble.user {
    background: #409EFF;
    color: #fff;
    border-bottom-right-radius: 4px;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
  }

  .message-bubble.assistant {
    background: #fff;
    color: #303133;
    border-bottom-left-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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

.retriever-resources {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #ebeef5;
}

.retriever-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #909399;
  cursor: pointer;
  padding: 8px 0;
}

.retriever-content {
  font-size: 13px;
  color: #606266;
  line-height: 1.8;
  background: #f4f4f5;
  padding: 12px;
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
  transition: all 0.3s ease;
}

.retriever-content.collapsed {
  max-height: 0;
  padding: 0 12px;
  overflow: hidden;
}

.retriever-item {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.retriever-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.retriever-item-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
}

.retriever-item-content {
  font-size: 12px;
  color: #606266;
  line-height: 1.6;
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

.file-url-container,
.file-local-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-url-container {
  flex-direction: column;
  align-items: flex-start;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.file-url-link {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 4px;
  color: #409EFF;
  text-decoration: none;
  font-size: 12px;
  transition: all 0.3s;
}

.file-url-link:hover {
  background: rgba(64, 158, 255, 0.2);
}

.file-tag {
  margin-left: auto;
}

.uploaded-file-item .file-tag {
  margin-left: 4px;
}

.file-url-text {
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
  word-break: break-all;
}

.message-text {
  /* white-space: pre-wrap; */
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
    padding: 16px 24px 20px;
    box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.04);
  }

  .input-container {
    max-width: 900px;
    margin: 0 auto;
  }

  .chat-input-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #fff;
    border-radius: 28px;
    padding: 12px 20px;
    border: 2px solid transparent;
    transition: all 0.3s ease;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    position: relative;
  }

  .chat-input-wrapper:focus-within {
    border-color: #409EFF;
    background: #fff;
    box-shadow: 0 4px 20px rgba(64, 158, 255, 0.15);
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
  min-width: 0;
  margin: 0;
}

.chat-input-textarea :deep(.el-textarea) {
    margin: 0;
    width: 100%;
    border: none !important;
    box-shadow: none !important;
    background: transparent;
  }

.chat-input-textarea :deep(.el-textarea__inner) {
    border: none !important;
    background: transparent !important;
    resize: none;
    font-size: 15px;
    line-height: 1.7;
    padding: 10px 12px;
    min-height: 40px;
    color: #303133;
    border-radius: 0;
    width: 100%;
    outline: none !important;
    box-shadow: none !important;
  }

  .chat-input-textarea :deep(.el-textarea__inner:focus) {
    box-shadow: none !important;
    outline: none !important;
    border-color: transparent !important;
    background: transparent !important;
  }

  .chat-input-textarea :deep(.el-textarea) {
    border: none !important;
    background: transparent;
    box-shadow: none !important;
  }

  .chat-input-textarea :deep(.el-textarea:focus-within) {
    box-shadow: none !important;
    border-color: transparent !important;
    background: transparent;
  }

  .chat-input-textarea :deep(.el-textarea__inner::placeholder) {
    color: #c0c4cc;
  }

  /* 新增包装器样式重置 */
  .chat-input-textarea :deep(.el-textarea__wrapper) {
    border: none !important;
    box-shadow: none !important;
    background: transparent;
  }

  .chat-input-textarea :deep(.el-textarea__wrapper:focus-within) {
    border: none !important;
    box-shadow: none !important;
    background: transparent;
  }

  /* 新增input内部样式重置 */
  .chat-input-textarea :deep(.el-input__inner) {
    border: none !important;
    box-shadow: none !important;
    background: transparent;
  }

  .chat-input-textarea :deep(.el-input__inner:focus) {
    border: none !important;
    box-shadow: none !important;
    background: transparent;
    outline: none !important;
  }



.uploaded-files-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  padding: 0 20px 0 calc(20px + 44px);
  max-width: 900px;
  box-sizing: border-box;
}

.uploaded-file-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f4f4f5;
  border-radius: 6px;
  font-size: 13px;
  min-width: 200px;
}

.uploaded-file-item.has-url {
  flex-direction: column;
  align-items: flex-start;
}

.remove-file {
  cursor: pointer;
  color: #909399;
  margin-left: 4px;
}

.remove-file:hover {
  color: #f56c6c;
}

.image-preview-container {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

  /* Markdown样式优化 */
  .message-text :deep(p) {
    margin: 10px 0;
    line-height: 1.8;
    font-size: 15px;
  }

  .message-text :deep(h1),
  .message-text :deep(h2),
  .message-text :deep(h3),
  .message-text :deep(h4),
  .message-text :deep(h5),
  .message-text :deep(h6) {
    margin: 16px 0 12px;
    font-weight: 600;
    line-height: 1.4;
  }

  .message-text :deep(h1) {
    font-size: 24px;
    border-bottom: 2px solid #e0e0e0;
    padding-bottom: 8px;
  }

  .message-text :deep(h2) {
    font-size: 20px;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 6px;
  }

  .message-text :deep(h3) {
    font-size: 18px;
  }

  .message-text :deep(ul),
  .message-text :deep(ol) {
    margin: 10px 0;
    padding-left: 24px;
  }

  .message-text :deep(li) {
    margin: 6px 0;
    line-height: 1.6;
  }

  .message-text :deep(blockquote) {
    margin: 12px 0;
    padding: 12px 16px;
    border-left: 4px solid #409EFF;
    background-color: #f5f7fa;
    border-radius: 4px;
    font-style: italic;
  }

  .message-text :deep(code) {
    background-color: #f0f0f0;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 14px;
  }

  .message-text :deep(pre) {
    margin: 12px 0;
    padding: 16px;
    background-color: #f5f5f5;
    border-radius: 6px;
    overflow-x: auto;
  }

  .message-text :deep(pre code) {
    background-color: transparent;
    padding: 0;
    font-size: 13px;
  }

  .message-text :deep(a) {
    color: #409EFF;
    text-decoration: none;
  }

  .message-text :deep(a:hover) {
    text-decoration: underline;
  }

  .message-text :deep(strong) {
    font-weight: 600;
  }

  .message-text :deep(em) {
    font-style: italic;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .main-content {
      margin-left: 0;
    }

    .chat-header {
      padding: 16px 20px;
    }

    .chat-messages-area {
      padding: 16px;
    }

    .chat-input-section {
      padding: 12px 16px 16px;
    }

    .message-wrapper {
      gap: 8px;
    }

    .message-content-wrapper {
      max-width: 85%;
    }

    .quick-start-cards {
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
    }
  }

  @media (max-width: 480px) {
    .empty-state-chat {
      padding: 20px;
    }

    .empty-illustration {
      width: 180px;
      height: 180px;
      margin-bottom: 30px;
    }

    .empty-title {
      font-size: 24px;
    }

    .quick-start-cards {
      grid-template-columns: 1fr;
    }

    .message-content-wrapper {
      max-width: 90%;
    }

    .chat-input-wrapper {
      padding: 8px 16px;
    }

    .send-btn {
      width: 40px;
      height: 40px;
    }
  }
</style>
