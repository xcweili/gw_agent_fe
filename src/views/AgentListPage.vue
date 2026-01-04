<template>
  <div class="agent-list-page">
    <el-button class="back-button" @click="$router.push('/')">
      <el-icon><ArrowLeft /></el-icon>
      返回首页
    </el-button>
    
    <h1 class="page-title">智能体列表</h1>
    
    <div class="mock-mode-toggle">
      <el-switch 
        v-model="isMockMode" 
        active-text="Mock模式"
        @change="toggleMockMode"
      />
      <span style="color: var(--text-color-secondary); font-size: 12px;">
        开启后使用模拟数据验证对话展示功能
      </span>
    </div>
    
    <div class="agent-grid">
      <div 
        v-for="agent in agents" 
        :key="agent.id"
        class="agent-card"
      >
        <div class="agent-card-content" @click="selectAgent(agent)">
          <div class="agent-card-header">
            <img :src="agent.icon || defaultIcon" :alt="agent.name" class="agent-avatar" />
            <div class="agent-title">{{ agent.name }}</div>
          </div>
          <div class="agent-intro">{{ agent.description }}</div>
          <div v-if="agent.questions && agent.questions.length > 0" style="margin-top: 8px;">
            <el-tag size="small" type="info">
              {{ agent.questions.length }} 个快捷问题
            </el-tag>
          </div>
        </div>
        <div class="card-actions">
          <el-dropdown @click.stop>
            <el-button size="small" type="text" class="more-button">
              <el-icon><More /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="editAgent(agent)">
                  <el-icon><Edit /></el-icon>
                  编辑智能体
                </el-dropdown-item>
                <el-dropdown-item @click="confirmDeleteAgent(agent)" divided>
                  <el-icon><Delete /></el-icon>
                  删除智能体
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      
      <div class="create-agent-card" @click="showCreateDialog = true">
        <el-icon class="el-icon"><Plus /></el-icon>
        <div class="create-agent-text">创建智能体</div>
      </div>
    </div>
    
    <el-dialog
      v-model="showCreateDialog"
      :title="isEditing ? '编辑智能体' : '创建智能体'"
      width="600px"
      :before-close="handleCloseDialog"
    >
      <el-form
        ref="agentForm"
        :model="newAgent"
        :rules="agentFormRules"
        label-width="100px"
      >
        <el-form-item label="智能体图标" prop="icon">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img 
              :src="newAgent.icon || defaultIcon" 
              :alt="newAgent.name" 
              class="agent-avatar"
              style="width: 60px; height: 60px; border-radius: 50%;"
            />
            <el-upload
              action="#"
              :show-file-list="false"
              :before-upload="handleIconUpload"
              accept="image/*"
            >
              <el-button size="small">上传图标</el-button>
            </el-upload>
            <span style="color: var(--text-color-secondary); font-size: 12px;">
              不上传则使用默认图标
            </span>
          </div>
        </el-form-item>
        
        <el-form-item label="智能体名" prop="name">
          <el-input v-model="newAgent.name" placeholder="请输入智能体名称" />
        </el-form-item>
        
        <el-form-item label="智能体简介" prop="description">
          <el-input 
            v-model="newAgent.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入智能体简介"
          />
        </el-form-item>
        
        <el-form-item label="API地址" prop="apiUrl">
          <el-input 
            v-model="newAgent.apiUrl" 
            placeholder="请输入智能体后端API地址"
          />
        </el-form-item>
        
        <el-form-item label="API Key" prop="apiKey">
          <el-input 
            v-model="newAgent.apiKey" 
            placeholder="请输入API Key"
            type="password"
          />
        </el-form-item>
        
        <el-form-item label="快捷问题">
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div v-for="(question, index) in newAgent.questions" :key="index" style="display: flex; gap: 8px;">
              <el-input 
                v-model="newAgent.questions[index]" 
                placeholder="请输入问题"
                style="flex: 1;"
              />
              <el-button 
                size="small" 
                type="danger" 
                @click="removeQuestion(index)"
                style="align-self: center;"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <div style="margin-top: 4px;">
              <el-button size="small" type="primary" plain @click="addQuestion">
                <el-icon><Plus /></el-icon>
                添加问题
              </el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="form-footer">
          <el-button @click="handleCloseDialog">取消</el-button>
          <el-button type="primary" @click="isEditing ? updateAgent() : createAgent()" :loading="isCreating">
            {{ isEditing ? '保存' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ArrowLeft, Plus, Delete, More, Edit } from '@element-plus/icons-vue'
import { agentService } from '../services/agentService'

export default {
  name: 'AgentListPage',
  components: {
    ArrowLeft,
    Plus,
    Delete,
    More,
    Edit
  },
  data() {
    return {
      agents: [],
      showCreateDialog: false,
      isCreating: false,
      isEditing: false,
      editingAgentId: null,
      isMockMode: false,
      newAgent: {
        name: '',
        description: '',
        apiUrl: '',
        apiKey: '',
        icon: '',
        questions: []
      },
      agentFormRules: {
        name: [
          { required: true, message: '请输入智能体名称', trigger: 'blur' }
        ],
        description: [
          { required: true, message: '请输入智能体简介', trigger: 'blur' }
        ],
        apiUrl: [
          { required: true, message: '请输入API地址', trigger: 'blur' },
          { type: 'url', message: '请输入有效的URL地址', trigger: 'blur' }
        ],
        apiKey: [
          { required: true, message: '请输入API Key', trigger: 'blur' }
        ]
      },
      defaultIcon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM0MDlFRkYiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI4IiB5PSI4Ij4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+'
    }
  },
  async mounted() {
    await this.loadAgents()
  },
  methods: {
    async loadAgents() {
      try {
        this.agents = await agentService.getAgents()
      } catch (error) {
        console.error('加载智能体列表失败:', error)
        this.$message.error('加载智能体列表失败')
      }
    },
    
    selectAgent(agent) {
      this.$router.push('/')
      // 这里可以传递选中的智能体信息到首页
      sessionStorage.setItem('selectedAgentId', agent.id)
    },
    
    toggleMockMode(value) {
      localStorage.setItem('mockMode', value ? 'true' : 'false')
      this.$message.info(value ? '已开启Mock模式' : '已关闭Mock模式')
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
      this.newAgent.questions.splice(index, 1)
    },
    
    handleCloseDialog() {
      this.showCreateDialog = false
      this.isEditing = false
      this.editingAgentId = null
      this.resetForm()
    },
    
    resetForm() {
      this.newAgent = {
        name: '',
        description: '',
        apiUrl: '',
        apiKey: '',
        icon: '',
        questions: []
      }
      this.$refs.agentForm?.resetFields()
    },
    
    editAgent(agent) {
      this.isEditing = true
      this.editingAgentId = agent.id
      this.newAgent = {
        name: agent.name,
        description: agent.description,
        apiUrl: agent.apiUrl,
        apiKey: agent.apiKey,
        icon: agent.icon,
        questions: [...(agent.questions || [])]
      }
      this.showCreateDialog = true
    },
    
    updateAgent() {
      this.$refs.agentForm.validate(async (valid) => {
        if (valid) {
          this.isCreating = true
          try {
            const agentData = {
              ...this.newAgent,
              questions: this.newAgent.questions.filter(q => q.trim())
            }
            
            await agentService.updateAgent(this.editingAgentId, agentData)
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
      this.$confirm(`确定要删除智能体"${agent.name}"吗？`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(async () => {
        try {
          await agentService.deleteAgent(agent.id)
          this.$message.success('删除成功')
          await this.loadAgents()
        } catch (error) {
          console.error('删除智能体失败:', error)
          this.$message.error('删除智能体失败')
        }
      }).catch(() => {
        // 用户取消删除操作
      })
    },
    
    createAgent() {
      this.$refs.agentForm.validate(async (valid) => {
        if (valid) {
          this.isCreating = true
          try {
            const agentData = {
              ...this.newAgent,
              id: Date.now().toString(),
              questions: this.newAgent.questions.filter(q => q.trim())
            }
            
            await agentService.addAgent(agentData)
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