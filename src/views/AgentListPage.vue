<template>
  <div class="agent-list-page">
    <el-button class="back-btn" @click="$router.push('/')">
      <el-icon><ArrowLeft /></el-icon>
      <span>返回首页</span>
    </el-button>

    <div class="page-header-content">
      <div class="header-info">
        <h1 class="main-title">智能体管理</h1>
        <p class="sub-title">管理和配置您的智能体助手</p>
      </div>
      <div class="header-action" v-if="canManageAgents">
        <el-button type="primary" size="large" @click="showCreateDialog = true" class="create-btn">
          <el-icon><Plus /></el-icon>
          创建智能体
        </el-button>
      </div>
    </div>

    <div class="toolbar-section">
      <div class="toolbar-left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索智能体名称、描述..."
          prefix-icon="Search"
          clearable
          size="large"
          class="search-input"
          @clear="handleSearchClear"
          @keyup.enter="handleSearch"
        />

        <el-select v-model="filterType" placeholder="智能体类型" clearable size="large" class="filter-select">
          <el-option label="全部类型" value="" />
          <el-option label="通用助手" value="general" />
          <el-option label="文档助手" value="document" />
          <el-option label="编程助手" value="coding" />
          <el-option label="数据分析" value="analysis" />
          <el-option label="创意写作" value="creative" />
        </el-select>

        <el-select v-model="sortBy" placeholder="排序方式" size="large" class="sort-select">
          <el-option label="按名称排序" value="name" />
          <el-option label="按创建时间" value="createdAt" />
          <el-option label="按使用次数" value="usageCount" />
        </el-select>
      </div>

      <div class="toolbar-right">
        <el-button-group class="view-toggle">
          <el-button
            :type="viewMode === 'grid' ? 'primary' : 'default'"
            @click="viewMode = 'grid'"
          >
            <el-icon><Grid /></el-icon>
          </el-button>
          <el-button
            :type="viewMode === 'list' ? 'primary' : 'default'"
            @click="viewMode = 'list'"
          >
            <el-icon><List /></el-icon>
          </el-button>
        </el-button-group>

        <span class="agent-count">
          共 {{ filteredAgents.length }} 个智能体
        </span>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="4" animated />
      <div class="loading-cards">
        <el-skeleton-item v-for="n in 4" :key="n" variant="card" style="height: 200px;" />
      </div>
    </div>

    <template v-else>
      <div v-if="filteredAgents.length === 0" class="empty-state">
        <div class="empty-illustration">
          <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSI4MCIgZmlsbD0iIzQwOUVGRiIgb3BhY2l0eT0iMC4xMiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNjAiIGZpbGw9IiM0MDlFRkYiIG9wYWNpdHk9IjAuMiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iMjUiIGZpbGw9IiM0MDlFRkYiLz48cmVjdCB4PSI3MCIgeT0iNzUiIHdpZHRoPSI2MCIgaGVpZ2h0PSI1MCIgcng9IjgiIGZpbGw9IiM0MDlFRkYiIG9wYWNpdHk9IjAuOCIvPjxjaXJjbGUgY3g9Ijg1IiBjeT0iOTAiIHI9IjUiIGZpbGw9IndoaXRlIi8+PGNpcmNsZSBjeD0iMTE1IiBjeT0iOTAiIHI9IjUiIGZpbGw9IndoaXRlIi8+PHJlY3QgeD0iOTAiIHk9IjEwNSIgd2lkdGg9IjIwIiBoZWlnaHQ9IjQiIHJ4PSIyIiBmaWxsPSJ3aGl0ZSIvPjxwYXRoIGQ9Ik0xMDAgMTM1TDEwMCAxNTBMODUgMTQ1TDEwMCAxMzVMMTE1IDE0NSIgc3Ryb2tlPSIjNDA5RUZGIiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==" class="empty-img" />
        </div>
        <div class="empty-content">
          <h3 class="empty-title">{{ searchKeyword || filterType ? '未找到匹配的智能体' : '暂无智能体' }}</h3>
          <p class="empty-description">
            {{ searchKeyword || filterType ? '尝试调整搜索条件或筛选器' : '创建您的第一个智能体助手，开始智能对话之旅' }}
          </p>
          <div class="empty-actions" v-if="canManageAgents && !searchKeyword && !filterType">
            <el-button type="primary" size="large" @click="showCreateDialog = true">
              <el-icon><Plus /></el-icon>
              创建智能体
            </el-button>
            <el-button size="large" @click="handleSearchClear">
              <el-icon><Refresh /></el-icon>
              刷新列表
            </el-button>
          </div>
          <div class="empty-actions" v-else-if="searchKeyword || filterType">
            <el-button size="large" @click="handleSearchClear">
              <el-icon><Close /></el-icon>
              清除筛选
            </el-button>
          </div>
        </div>
      </div>

      <div v-else :class="['agent-container', viewMode]">
        <div
          v-for="agent in filteredAgents"
          :key="agent.id"
          class="agent-card-wrapper"
        >
          <div class="agent-card" :class="{ 'list-mode': viewMode === 'list' }">
            <div class="card-header-bar">
              <div class="agent-type-badge" v-if="agent.type">
                {{ getTypeLabel(agent.type) }}
              </div>
              <div class="card-actions" v-if="canManageAgents">
                <el-dropdown trigger="click" @command="(cmd) => handleCardAction(cmd, agent)">
                  <el-button size="small" type="text" class="more-button">
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit" :disabled="!canEditAgent(agent)">
                        <el-icon><Edit /></el-icon>
                        编辑智能体
                      </el-dropdown-item>
                      <el-dropdown-item command="duplicate" :disabled="!canManageAgents">
                        <el-icon><CopyDocument /></el-icon>
                        复制智能体
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" :disabled="!canDeleteAgent(agent)" divided>
                        <el-icon><Delete /></el-icon>
                        删除智能体
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>

            <div class="card-main" @click="selectAgent(agent)">
              <div class="agent-avatar-large">
                <img :src="agent.icon || defaultIcon" :alt="agent.name" />
                <div class="online-status" v-if="agent.status === 'online'"></div>
              </div>
              <div class="agent-info">
                <h3 class="agent-name">{{ agent.name }}</h3>
                <p class="agent-description">{{ agent.description }}</p>
                <div class="agent-meta">
                  <span class="meta-item" v-if="agent.createdBy">
                    <el-icon><User /></el-icon>
                    {{ agent.createdBy }}
                  </span>
                  <span class="meta-item" v-if="agent.usageCount !== undefined">
                    <el-icon><View /></el-icon>
                    {{ agent.usageCount }} 次使用
                  </span>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <div class="quick-questions" v-if="agent.questions && agent.questions.length > 0">
                <el-tag
                  v-for="(q, idx) in agent.questions.slice(0, 2)"
                  :key="idx"
                  size="small"
                  class="question-tag"
                  @click="askQuickQuestion(agent, q)"
                >
                  {{ q }}
                </el-tag>
                <span v-if="agent.questions.length > 2" class="more-questions">
                  +{{ agent.questions.length - 2 }}
                </span>
              </div>
              <el-button type="primary" size="small" class="start-chat-btn" @click="selectAgent(agent)">
                开始对话
                <el-icon><Right /></el-icon>
              </el-button>
            </div>
          </div>
        </div>

        <div class="create-card-wrapper" v-if="canManageAgents">
          <div class="create-agent-card" @click="showCreateDialog = true">
            <div class="create-icon-wrapper">
              <el-icon class="create-icon"><Plus /></el-icon>
            </div>
            <div class="create-text">创建新智能体</div>
            <div class="create-hint">配置专属的 AI 助手</div>
          </div>
        </div>
      </div>
    </template>

    <el-dialog
      v-model="showCreateDialog"
      :title="isEditing ? '编辑智能体' : '创建智能体'"
      width="720px"
      :before-close="handleCloseDialog"
      class="agent-dialog"
    >
      <el-tabs v-model="activeFormTab" class="form-tabs">
        <el-tab-pane label="基本信息" name="basic">
          <el-form
            ref="agentForm"
            :model="newAgent"
            :rules="agentFormRules"
            label-position="top"
          >
            <div class="icon-upload-section">
              <div class="icon-preview">
                <img :src="newAgent.icon || defaultIcon" :alt="newAgent.name" />
              </div>
              <el-upload
                action="#"
                :show-file-list="false"
                :before-upload="handleIconUpload"
                accept="image/*"
                class="icon-uploader"
              >
                <el-button size="small">
                  <el-icon><Upload /></el-icon>
                  上传图标
                </el-button>
                <template #tip>
                  <p class="upload-tip">支持 JPG、PNG 格式，建议尺寸 200x200</p>
                </template>
              </el-upload>
            </div>

            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="智能体名称" prop="name">
                  <el-input
                    v-model="newAgent.name"
                    placeholder="为您的智能体起一个响亮的名字"
                    maxlength="30"
                    show-word-limit
                  />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="智能体简介" prop="description">
                  <el-input
                    v-model="newAgent.description"
                    type="textarea"
                    :rows="3"
                    placeholder="简要描述智能体的功能和特点"
                    maxlength="200"
                    show-word-limit
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="智能体类型" prop="type">
                  <el-select v-model="newAgent.type" placeholder="选择智能体类型" style="width: 100%;">
                    <el-option label="通用助手" value="general" />
                    <el-option label="文档助手" value="document" />
                    <el-option label="编程助手" value="coding" />
                    <el-option label="数据分析" value="analysis" />
                    <el-option label="创意写作" value="creative" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="状态">
                  <el-switch
                    v-model="newAgent.status"
                    active-value="online"
                    inactive-value="offline"
                    active-text="上线"
                    inactive-text="下线"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="模型配置" name="model">
          <el-form label-position="top">
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="API 地址" prop="apiUrl">
                  <el-input
                    v-model="newAgent.apiUrl"
                    placeholder="https://api.openai.com/v1/chat/completions"
                  >
                    <template #prepend>URL</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="API Key" prop="apiKey">
                  <el-input
                    v-model="newAgent.apiKey"
                    placeholder="sk-..."
                    type="password"
                    show-password
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="模型名称">
                  <el-input v-model="newAgent.model" placeholder="gpt-4" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Temperature">
                  <el-slider v-model="newAgent.temperature" :min="0" :max="2" :step="0.1" :format-tooltip="(val) => val.toFixed(1)" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="最大Tokens">
                  <el-input-number v-model="newAgent.maxTokens" :min="100" :max="32768" :step="100" style="width: 100%;" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="系统提示词">
                  <el-input
                    v-model="newAgent.systemPrompt"
                    type="textarea"
                    :rows="4"
                    placeholder="设定智能体的角色和行为规则..."
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="快捷问题" name="questions">
          <div class="questions-config">
            <p class="section-tip">设置用户可以快速点击的问题，降低使用门槛</p>
            <div class="questions-list">
              <draggable
                v-model="newAgent.questions"
                item-key="index"
                handle=".drag-handle"
                ghost-class="ghost"
              >
                <template #item="{ index }">
                  <div class="question-item">
                    <el-icon class="drag-handle"><Rank /></el-icon>
                    <el-input
                      v-model="newAgent.questions[index]"
                      :placeholder="`快捷问题 #${index + 1}`"
                      maxlength="100"
                      show-word-limit
                    />
                    <el-button
                      size="small"
                      type="danger"
                      circle
                      @click="removeQuestion(index)"
                      :disabled="newAgent.questions.length <= 1"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </template>
              </draggable>
            </div>
            <el-button type="primary" plain @click="addQuestion" class="add-question-btn">
              <el-icon><Plus /></el-icon>
              添加快捷问题
            </el-button>
            <div class="questions-preview">
              <span class="preview-label">预览：</span>
              <el-tag
                v-for="(q, idx) in newAgent.questions.filter(q => q.trim())"
                :key="idx"
                type="info"
                class="preview-tag"
              >
                {{ q }}
              </el-tag>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseDialog" size="large">取消</el-button>
          <el-button type="primary" @click="isEditing ? updateAgent() : createAgent()" :loading="isCreating" size="large">
            <el-icon><Check /></el-icon>
            {{ isEditing ? '保存修改' : '创建智能体' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ArrowLeft, Plus, Delete, MoreFilled, Edit, CopyDocument, Grid, List, Right, Upload, User, View, Rank, Check, Close, Refresh } from '@element-plus/icons-vue'
import { backendService } from '../services/backendService'
import draggable from 'vuedraggable'

export default {
  name: 'AgentListPage',
  components: {
    ArrowLeft,
    Plus,
    Delete,
    MoreFilled,
    Edit,
    CopyDocument,
    Grid,
    List,
    Right,
    Upload,
    User,
    View,
    Rank,
    Check,
    Close,
    Refresh,
    draggable
  },
  inject: {
    currentUser: { default: null },
    isAdmin: { default: false }
  },
  data() {
    return {
      agents: [],
      loading: true,
      showCreateDialog: false,
      isCreating: false,
      isEditing: false,
      editingAgentId: null,
      activeFormTab: 'basic',
      viewMode: 'grid',
      searchKeyword: '',
      filterType: '',
      sortBy: 'createdAt',
      newAgent: {
        name: '',
        description: '',
        type: 'general',
        apiUrl: '',
        apiKey: '',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 4096,
        systemPrompt: '',
        icon: '',
        questions: [''],
        status: 'online'
      },
      agentFormRules: {
        name: [
          { required: true, message: '请输入智能体名称', trigger: 'blur' },
          { min: 2, max: 30, message: '名称长度在 2-30 个字符', trigger: 'blur' }
        ],
        description: [
          { required: true, message: '请输入智能体简介', trigger: 'blur' },
          { min: 5, max: 200, message: '简介长度在 5-200 个字符', trigger: 'blur' }
        ],
        apiUrl: [
          { required: true, message: '请输入API地址', trigger: 'blur' },
          { type: 'url', message: '请输入有效的URL地址', trigger: 'blur' }
        ],
        apiKey: [
          { required: true, message: '请输入API Key', trigger: 'blur' }
        ]
      },
      defaultIcon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iIzQwOUVGRiIvPjxwYXRoIGQ9Ik0xMiAyTDEzLjA5IDguMjZMMjAgOUwxMy4wOSAxNS43NEwxMiAyMkwxMC45MSAxNS43NEw0IDlMMTAuOTEgOC4yNkwxMiAyWiIgZmlsbD0id2hpdGUiLz48L3N2Zz4='
    }
  },
  computed: {
    canManageAgents() {
      return this.isAdmin || (this.currentUser && this.currentUser.username)
    },
    filteredAgents() {
      let result = [...this.agents]
      
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase()
        result = result.filter(agent =>
          agent.name.toLowerCase().includes(keyword) ||
          agent.description.toLowerCase().includes(keyword)
        )
      }
      
      if (this.filterType) {
        result = result.filter(agent => agent.type === this.filterType)
      }
      
      result.sort((a, b) => {
        switch (this.sortBy) {
          case 'name':
            return a.name.localeCompare(b.name, 'zh-CN')
          case 'createdAt':
            return (b.createdAt || 0) - (a.createdAt || 0)
          case 'usageCount':
            return (b.usageCount || 0) - (a.usageCount || 0)
          default:
            return 0
        }
      })
      
      return result
    }
  },
  async mounted() {
    await this.loadAgents()
  },
  methods: {
    async loadAgents() {
      this.loading = true
      try {
        this.agents = await backendService.getAgents()
      } catch (error) {
        console.error('加载智能体列表失败:', error)
        this.$message.error('加载智能体列表失败')
      } finally {
        this.loading = false
      }
    },
    
    selectAgent(agent) {
      this.$router.push('/')
      sessionStorage.setItem('selectedAgentId', agent.id)
    },
    
    handleSearch() {
      this.$forceUpdate()
    },
    
    handleSearchClear() {
      this.searchKeyword = ''
      this.filterType = ''
    },
    
    getTypeLabel(type) {
      const labels = {
        general: '通用',
        document: '文档',
        coding: '编程',
        analysis: '分析',
        creative: '创意'
      }
      return labels[type] || '通用'
    },
    
    canEditAgent(agent) {
      if (!this.canManageAgents) return false
      if (this.isAdmin) return true
      return agent.createdBy === this.currentUser?.username
    },
    
    canDeleteAgent(agent) {
      return this.canEditAgent(agent)
    },
    
    handleCardAction(command, agent) {
      switch (command) {
        case 'edit':
          this.editAgent(agent)
          break
        case 'duplicate':
          this.duplicateAgent(agent)
          break
        case 'delete':
          this.confirmDeleteAgent(agent)
          break
      }
    },
    
    askQuickQuestion(agent, question) {
      this.selectAgent(agent)
      setTimeout(() => {
        const chatInput = document.querySelector('.chat-input-textarea textarea, .chat-input-textarea input')
        if (chatInput) {
          chatInput.value = question
          chatInput.dispatchEvent(new Event('input'))
        }
      }, 100)
    },
    
    handleIconUpload(file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        this.newAgent.icon = e.target.result
      }
      reader.readAsDataURL(file)
      return false
    },
    
    addQuestion() {
      this.newAgent.questions.push('')
    },
    
    removeQuestion(index) {
      if (this.newAgent.questions.length > 1) {
        this.newAgent.questions.splice(index, 1)
      }
    },
    
    handleCloseDialog() {
      this.showCreateDialog = false
      this.isEditing = false
      this.editingAgentId = null
      this.activeFormTab = 'basic'
      this.resetForm()
    },
    
    resetForm() {
      this.newAgent = {
        name: '',
        description: '',
        type: 'general',
        apiUrl: '',
        apiKey: '',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 4096,
        systemPrompt: '',
        icon: '',
        questions: [''],
        status: 'online'
      }
      this.$refs.agentForm?.resetFields()
    },
    
    editAgent(agent) {
      if (!this.canEditAgent(agent)) {
        this.$message.warning('您没有权限编辑此智能体')
        return
      }
      
      this.isEditing = true
      this.editingAgentId = agent.id
      this.newAgent = {
        name: agent.name,
        description: agent.description,
        type: agent.type || 'general',
        apiUrl: agent.apiUrl,
        apiKey: agent.apiKey,
        model: agent.model || 'gpt-4',
        temperature: agent.temperature || 0.7,
        maxTokens: agent.maxTokens || 4096,
        systemPrompt: agent.systemPrompt || '',
        icon: agent.icon,
        questions: [...(agent.questions || [''])],
        status: agent.status || 'online'
      }
      this.showCreateDialog = true
    },
    
    async duplicateAgent(agent) {
      const duplicateData = {
        ...agent,
        name: `${agent.name} (副本)`,
        id: Date.now().toString(),
        createdBy: this.currentUser?.username,
        createdAt: new Date().toISOString(),
        usageCount: 0
      }
      
      try {
        await backendService.createAgent(duplicateData)
        this.$message.success('智能体复制成功')
        await this.loadAgents()
      } catch (error) {
        console.error('复制智能体失败:', error)
        this.$message.error('复制智能体失败')
      }
    },
    
    updateAgent() {
      this.$refs.agentForm.validate(async (valid) => {
        if (valid) {
          this.isCreating = true
          try {
            const agentData = {
              name: this.newAgent.name,
              description: this.newAgent.description,
              type: this.newAgent.type,
              apiUrl: this.newAgent.apiUrl,
              apiKey: this.newAgent.apiKey,
              model: this.newAgent.model,
              temperature: this.newAgent.temperature,
              maxTokens: this.newAgent.maxTokens,
              systemPrompt: this.newAgent.systemPrompt,
              icon: this.newAgent.icon,
              questions: this.newAgent.questions.filter(q => q.trim()),
              status: this.newAgent.status
            }
            
            await backendService.updateAgent(this.editingAgentId, agentData)
            this.$message.success('智能体更新成功')
            this.handleCloseDialog()
            await this.loadAgents()
          } catch (error) {
            console.error('更新智能体失败:', error)
            this.$message.error('更新智能体失败')
          } finally {
            this.isCreating = false
          }
        }
      })
    },
    
    confirmDeleteAgent(agent) {
      if (!this.canDeleteAgent(agent)) {
        this.$message.warning('您没有权限删除此智能体')
        return
      }
      
      this.$confirm(`确定要删除智能体"${agent.name}"吗？此操作不可恢复。`, '删除确认', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }).then(async () => {
        try {
          await backendService.deleteAgent(agent.id)
          this.$message.success('删除成功')
          await this.loadAgents()
        } catch (error) {
          console.error('删除智能体失败:', error)
          this.$message.error('删除智能体失败')
        }
      }).catch(() => {})
    },
    
    createAgent() {
      this.$refs.agentForm.validate(async (valid) => {
        if (valid) {
          this.isCreating = true
          try {
            const agentData = {
              ...this.newAgent,
              id: Date.now().toString(),
              questions: this.newAgent.questions.filter(q => q.trim()),
              createdBy: this.currentUser?.username,
              createdAt: new Date().toISOString(),
              usageCount: 0
            }
            
            await backendService.createAgent(agentData)
            this.$message.success('智能体创建成功')
            this.handleCloseDialog()
            await this.loadAgents()
          } catch (error) {
            console.error('创建智能体失败:', error)
            this.$message.error('创建智能体失败')
          } finally {
            this.isCreating = false
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.agent-list-page {
  padding: 24px 32px;
  max-width: 1600px;
  margin: 0 auto;
  min-height: calc(100vh - 48px);
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}

.page-header {
  margin-bottom: 24px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  margin-right: auto;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  color: #4b5563;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #e5e7eb;
  color: #1f2937;
}

.page-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.header-info {
  color: #fff;
}

.main-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.sub-title {
  margin: 6px 0 0;
  font-size: 14px;
  opacity: 0.9;
}

.header-action {
  flex-shrink: 0;
}

.create-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #fff;
  border: none;
  border-radius: 10px;
  color: #667eea;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toolbar-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.search-input {
  width: 280px;
}

.filter-select,
.sort-select {
  width: 140px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.view-toggle {
  border-radius: 8px;
  overflow: hidden;
}

.agent-count {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.loading-state {
  padding: 20px 0;
}

.loading-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-illustration {
  margin-bottom: 24px;
}

.empty-img {
  width: 200px;
  height: 200px;
  opacity: 0.9;
}

.empty-content {
  max-width: 400px;
}

.empty-title {
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.empty-description {
  margin: 0 0 24px;
  font-size: 15px;
  color: #6b7280;
  line-height: 1.6;
}

.empty-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.agent-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.agent-container.list-mode {
  grid-template-columns: 1fr;
}

.agent-card-wrapper {
  transition: all 0.3s ease;
}

.agent-card-wrapper:hover {
  transform: translateY(-2px);
}

.agent-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid #f1f5f9;
}

.agent-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: #e2e8f0;
}

.agent-card.list-mode {
  flex-direction: row;
  align-items: center;
  padding: 16px 20px;
}

.agent-card.list-mode .card-main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0;
  cursor: pointer;
}

.agent-card.list-mode .card-footer {
  flex-direction: row;
  gap: 12px;
  padding: 12px 0 0;
  border-top: none;
}

.card-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f8fafc;
}

.agent-type-badge {
  font-size: 12px;
  font-weight: 500;
  color: #409EFF;
  background: rgba(64, 158, 255, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
}

.more-button {
  padding: 4px !important;
  color: #9ca3af;
  transition: color 0.2s;
}

.more-button:hover {
  color: #409EFF;
}

.card-main {
  padding: 20px;
  cursor: pointer;
  flex: 1;
}

.agent-avatar-large {
  position: relative;
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
}

.agent-card.list-mode .agent-avatar-large {
  margin: 0;
  width: 48px;
  height: 48px;
}

.agent-avatar-large img {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  object-fit: cover;
  background: linear-gradient(135deg, #409EFF 0%, #67C23A 100%);
}

.online-status {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  background: #67C23A;
  border: 2px solid #ffffff;
  border-radius: 50%;
}

.agent-info {
  text-align: center;
}

.agent-card.list-mode .agent-info {
  text-align: left;
  flex: 1;
}

.agent-name {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agent-description {
  margin: 0 0 12px;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.agent-card.list-mode .agent-description {
  -webkit-line-clamp: 1;
}

.agent-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

.agent-card.list-mode .agent-meta {
  justify-content: flex-start;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #9ca3af;
}

.meta-item .el-icon {
  font-size: 14px;
}

.card-footer {
  padding: 16px 20px;
  border-top: 1px solid #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.question-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.question-tag:hover {
  background: #409EFF;
  color: #ffffff;
  border-color: #409EFF;
}

.more-questions {
  font-size: 12px;
  color: #9ca3af;
}

.start-chat-btn {
  width: 100%;
}

.agent-card.list-mode .start-chat-btn {
  width: auto;
}

.create-card-wrapper {
  min-height: 280px;
}

.create-agent-card {
  height: 100%;
  min-height: 280px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.05) 0%, rgba(103, 194, 58, 0.05) 100%);
  border: 2px dashed rgba(64, 158, 255, 0.2);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  gap: 16px;
}

.create-agent-card:hover {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(103, 194, 58, 0.1) 100%);
  border-color: #409EFF;
  transform: translateY(-2px);
}

.create-icon-wrapper {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #409EFF 0%, #67C23A 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
}

.create-icon {
  font-size: 36px;
  color: #ffffff;
}

.create-text {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.create-hint {
  font-size: 14px;
  color: #6b7280;
}

.agent-dialog :deep(.el-dialog__body) {
  padding: 24px 32px;
}

.form-tabs {
  margin-bottom: 20px;
}

.icon-upload-section {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
}

.icon-preview {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(135deg, #409EFF 0%, #67C23A 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.icon-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.icon-uploader {
  flex: 1;
}

.upload-tip {
  margin: 8px 0 0;
  font-size: 12px;
  color: #9ca3af;
}

.section-tip {
  margin: 0 0 16px;
  font-size: 14px;
  color: #6b7280;
}

.questions-list {
  margin-bottom: 16px;
}

.question-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  transition: all 0.2s;
}

.question-item:hover {
  background: #f1f5f9;
}

.question-item.ghost {
  opacity: 0.5;
  background: #e0f2fe;
}

.drag-handle {
  cursor: grab;
  color: #9ca3af;
  font-size: 16px;
}

.drag-handle:active {
  cursor: grabbing;
  color: #409EFF;
}

.add-question-btn {
  width: 100%;
}

.questions-preview {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.preview-label {
  font-size: 14px;
  color: #6b7280;
}

.preview-tag {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #fafafa;
  border-radius: 0 0 8px 8px;
}

@media (max-width: 768px) {
  .agent-list-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .toolbar-section {
    flex-direction: column;
    gap: 12px;
  }

  .toolbar-left {
    width: 100%;
    flex-wrap: wrap;
  }

  .search-input {
    width: 100%;
  }

  .agent-container {
    grid-template-columns: 1fr;
  }

  .empty-actions {
    flex-direction: column;
    width: 100%;
  }

  .empty-actions .el-button {
    width: 100%;
  }
}
</style>
