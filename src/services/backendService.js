const API_BASE = '/api'

class BackendService {
  constructor() {}

  getUserHeaders() {
    const userData = localStorage.getItem('currentUser')
    const user = userData ? JSON.parse(userData) : null
    return {
      'Content-Type': 'application/json',
      'x-username': user?.username || '',
      'x-user-role': user?.role || ''
    }
  }

  async getAgents() {
    const response = await fetch(`${API_BASE}/agents`, {
      headers: this.getUserHeaders()
    })
    return await response.json()
  }

  async getAgentById(id) {
    const response = await fetch(`${API_BASE}/agents/${id}`, {
      headers: this.getUserHeaders()
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || '获取智能体失败')
    }

    return result
  }

  async createAgent(agentData) {
    const response = await fetch(`${API_BASE}/agents`, {
      method: 'POST',
      headers: this.getUserHeaders(),
      body: JSON.stringify(agentData)
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || '创建智能体失败')
    }

    return result
  }

  async updateAgent(id, updateData) {
    const response = await fetch(`${API_BASE}/agents/${id}`, {
      method: 'PUT',
      headers: this.getUserHeaders(),
      body: JSON.stringify(updateData)
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || '更新智能体失败')
    }

    return result
  }

  async deleteAgent(id) {
    const response = await fetch(`${API_BASE}/agents/${id}`, {
      method: 'DELETE',
      headers: this.getUserHeaders()
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || '删除智能体失败')
    }

    return result
  }

  async searchAgents(keyword) {
    const agents = await this.getAgents()
    const lowerKeyword = keyword.toLowerCase()

    return agents.filter(agent =>
      agent.name?.toLowerCase().includes(lowerKeyword) ||
      agent.description?.toLowerCase().includes(lowerKeyword)
    )
  }
}

export const backendService = new BackendService()
