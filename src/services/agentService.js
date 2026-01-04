class AgentService {
  constructor() {
    this.storageKey = 'agent_platform_agents'
    this.initDefaultAgents()
  }

  initDefaultAgents() {
    const existing = this.getAgentsFromStorage()
    if (existing.length === 0) {
      // 如果没有智能体，可以设置一些示例数据
      const defaultAgents = [
        {
          id: '1',
          name: '招投标助手',
          description: '专业的招投标咨询助手，提供招投标流程、政策法规、投标技巧等咨询服务',
          apiUrl: '',
          apiKey: '',
          icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM0MDlFRkYiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI4IiB5PSI4Ij4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+',
          questions: [
            '什么是招投标？',
            '招投标的基本流程是什么？',
            '如何提高中标率？'
          ]
        }
      ]
      this.saveAgentsToStorage(defaultAgents)
    }
  }

  async getAgents() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const agents = this.getAgentsFromStorage()
        resolve(agents)
      }, 100)
    })
  }

  async getAgentById(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const agents = this.getAgentsFromStorage()
        const agent = agents.find(a => a.id === id)
        if (agent) {
          resolve(agent)
        } else {
          reject(new Error('智能体不存在'))
        }
      }, 100)
    })
  }

  async addAgent(agentData) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const agents = this.getAgentsFromStorage()
          
          // 检查名称是否重复
          if (agents.some(a => a.name === agentData.name)) {
            reject(new Error('智能体名称已存在'))
            return
          }
          
          // 如果没有图标，使用默认图标
          const defaultIcon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM0MDlFRkYiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI4IiB5PSI4Ij4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+'
          
          const newAgent = {
            ...agentData,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            icon: agentData.icon || defaultIcon
          }
          
          agents.push(newAgent)
          this.saveAgentsToStorage(agents)
          resolve(newAgent)
        } catch (error) {
          reject(error)
        }
      }, 200)
    })
  }

  async updateAgent(id, updateData) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const agents = this.getAgentsFromStorage()
          const index = agents.findIndex(a => a.id === id)
          
          if (index === -1) {
            reject(new Error('智能体不存在'))
            return
          }
          
          // 检查名称是否重复（排除当前智能体）
          if (updateData.name && agents.some(a => a.name === updateData.name && a.id !== id)) {
            reject(new Error('智能体名称已存在'))
            return
          }
          
          agents[index] = { ...agents[index], ...updateData }
          this.saveAgentsToStorage(agents)
          resolve(agents[index])
        } catch (error) {
          reject(error)
        }
      }, 200)
    })
  }

  async deleteAgent(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const agents = this.getAgentsFromStorage()
          const filteredAgents = agents.filter(a => a.id !== id)
          
          if (filteredAgents.length === agents.length) {
            reject(new Error('智能体不存在'))
            return
          }
          
          this.saveAgentsToStorage(filteredAgents)
          resolve()
        } catch (error) {
          reject(error)
        }
      }, 200)
    })
  }

  getAgentsFromStorage() {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('读取本地存储失败:', error)
      return []
    }
  }

  saveAgentsToStorage(agents) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(agents))
    } catch (error) {
      console.error('保存到本地存储失败:', error)
      throw new Error('保存失败')
    }
  }

  // 获取Mock模式状态
  isMockMode() {
    return localStorage.getItem('mockMode') === 'true'
  }

  // 切换Mock模式
  setMockMode(enabled) {
    localStorage.setItem('mockMode', enabled ? 'true' : 'false')
  }
}

export const agentService = new AgentService()