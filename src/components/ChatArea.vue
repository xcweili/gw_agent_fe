<template>
  <div class="main-content">
    <div class="chat-area">
      <div v-if="selectedAgent" class="agent-info">
        <div class="agent-name">{{ selectedAgent.name }}</div>
        <div class="agent-description">{{ selectedAgent.description }}</div>
      </div>
      
      <div v-if="selectedAgent && selectedAgent.questions && selectedAgent.questions.length > 0" class="quick-questions">
        <div class="quick-questions-title">快捷问题</div>
        <div class="question-tags">
          <div 
            v-for="question in selectedAgent.questions" 
            :key="question"
            class="question-tag"
            @click="sendQuickQuestion(question)"
          >
            {{ question }}
          </div>
        </div>
      </div>
      
      <div class="chat-messages" ref="chatMessages">
        <div v-if="messages.length === 0" style="text-align: center; color: var(--text-color-secondary); padding: 40px;">
          <div style="margin-bottom: 16px;">欢迎使用招投标智能体平台</div>
          <div>请选择左侧智能体开始对话</div>
        </div>
        
        <div v-for="message in messages" :key="message.id" class="message-bubble" :class="message.role">
          <div v-if="message.think" class="think-section">
            <div class="think-header" @click="toggleThink(message.id)">
              <el-icon><View /></el-icon>
              <span>思考过程 {{ thinkExpanded[message.id] ? '▼' : '▶' }}</span>
            </div>
            <div class="think-content" :class="{ collapsed: !thinkExpanded[message.id] }">
              {{ message.think }}
            </div>
          </div>
          
          <div class="streaming-text-container">
            <span class="streaming-text">{{ message.content }}</span>
            <span v-if="isLoading && message.id === lastAssistantMessageId" class="typing-cursor"></span>
          </div>
        </div>
        
        <div v-if="isLoading" class="message-bubble assistant">
          <div class="streaming-text-container">
            <span class="streaming-text">正在思考...</span>
            <span class="typing-cursor"></span>
          </div>
        </div>
      </div>
      
      <div class="chat-input-area">
        <el-button 
          v-if="messages.length > 0"
          class="new-chat-button"
          @click="startNewChat"
        >
          <el-icon><RefreshLeft /></el-icon>
          开启新对话
        </el-button>
        
        <div class="chat-input-wrapper">
          <div class="file-upload-area" @click="triggerFileUpload">
            <el-icon><DocumentAdd /></el-icon>
          </div>
          <input 
            ref="fileInput"
            type="file" 
            style="display: none"
            @change="handleFileUpload"
            multiple
          />
          
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="2"
            placeholder="请输入您的问题..."
            class="chat-input"
            @keydown.enter.exact="sendMessage"
            @keydown.enter.ctrl="sendMessage"
          />
          
          <el-button 
            type="primary" 
            class="send-button"
            :loading="isLoading"
            @click="sendMessage"
            :disabled="!inputMessage.trim() || !selectedAgent"
          >
            <el-icon><Promotion /></el-icon>
            发送
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { DocumentAdd, Promotion, RefreshLeft, View } from '@element-plus/icons-vue'
import { agentService } from '../services/agentService'
import { chatService } from '../services/chatService'

export default {
  name: 'ChatArea',
  components: {
    DocumentAdd,
    Promotion,
    RefreshLeft,
    View
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
      uploadedFiles: []
    }
  },
  computed: {
    lastAssistantMessageId() {
      const assistantMessages = this.messages.filter(m => m.role === 'assistant')
      return assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1].id : null
    }
  },
  watch: {
    selectedAgent: {
      handler(newAgent) {
        if (newAgent) {
          this.startNewChat()
        }
      },
      immediate: true
    },
    messages: {
      handler() {
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      },
      deep: true
    }
  },
  methods: {
    startNewChat() {
      this.messages = []
      this.inputMessage = ''
      this.thinkExpanded = {}
      this.uploadedFiles = []
    },
    
    async sendMessage() {
      if (!this.inputMessage.trim() || !this.selectedAgent || this.isLoading) return
      
      const userMessage = this.inputMessage.trim()
      this.inputMessage = ''
      
      const messageId = Date.now()
      this.messages.push({
        id: messageId,
        role: 'user',
        content: userMessage,
        think: null,
        files: [...this.uploadedFiles]
      })
      
      this.uploadedFiles = []
      
      const assistantMessageId = messageId + 1
      this.messages.push({
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        think: null
      })
      
      this.isLoading = true
      
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
          assistantMessage.content = '抱歉，出现了一些错误，请稍后再试。'
        }
      } finally {
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
        if (index < fullContent.length) {
          // 每次添加1-3个字符，增加自然感
          const chunkSize = Math.random() > 0.8 ? 3 : (Math.random() > 0.6 ? 2 : 1)
          message.content = fullContent.slice(0, index + chunkSize)
          index += chunkSize
          
          // 动态调整速度，模拟人类输入节奏
          let delay = 20
          if (fullContent[index - 1] === '，' || fullContent[index - 1] === '，') delay = 80
          else if (fullContent[index - 1] === '。' || fullContent[index - 1] === '！' || fullContent[index - 1] === '？') delay = 120
          else if (Math.random() > 0.9) delay = 60
          
          setTimeout(typeText, delay)
        }
      }
      typeText()
    },
    
    toggleThink(messageId) {
      this.$set(this.thinkExpanded, messageId, !this.thinkExpanded[messageId])
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