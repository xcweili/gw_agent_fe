const API_BASE = '/api'

class AuthService {
  constructor() {
    this.currentUser = null
  }

  async login(username, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.message)
    }

    this.currentUser = result.user
    localStorage.setItem('currentUser', JSON.stringify(result.user))

    return result
  }

  async register(username, password, role = 'user') {
    if (!username || !password) {
      throw new Error('账号和密码不能为空')
    }

    if (password.length < 6) {
      throw new Error('密码长度至少6位')
    }

    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.message)
    }

    return result
  }

  async getAllAccounts() {
    const response = await fetch(`${API_BASE}/accounts`)
    return await response.json()
  }

  async updateAccountRole(username, newRole) {
    const validRoles = ['admin', 'user', 'viewer']
    if (!validRoles.includes(newRole)) {
      throw new Error('无效的角色')
    }

    const response = await fetch(`${API_BASE}/accounts/${username}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole })
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.message)
    }

    return result
  }

  async deleteAccount(username) {
    if (username === 'admin') {
      throw new Error('不能删除管理员账号')
    }

    const response = await fetch(`${API_BASE}/accounts/${username}`, {
      method: 'DELETE'
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.message)
    }

    return result
  }

  logout() {
    this.currentUser = null
    localStorage.removeItem('currentUser')
  }

  getCurrentUser() {
    if (!this.currentUser) {
      const userData = localStorage.getItem('currentUser')
      if (userData) {
        this.currentUser = JSON.parse(userData)
      }
    }
    return this.currentUser
  }

  isLoggedIn() {
    return this.getCurrentUser() !== null
  }

  isAdmin() {
    const user = this.getCurrentUser()
    return user?.role === 'admin'
  }

  getUserRole() {
    const user = this.getCurrentUser()
    return user?.role || 'guest'
  }

  isValidRole(role) {
    return ['admin', 'user', 'viewer'].includes(role)
  }
}

export const authService = new AuthService()
