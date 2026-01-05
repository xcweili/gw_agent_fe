const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

const DATA_DIR = path.join(__dirname, 'data')

function readJson(filename) {
  try {
    const filePath = path.join(DATA_DIR, filename)
    if (!fs.existsSync(filePath)) {
      return []
    }
    const data = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error(`读取 ${filename} 失败:`, error)
    return []
  }
}

function writeJson(filename, data) {
  try {
    const filePath = path.join(DATA_DIR, filename)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return true
  } catch (error) {
    console.error(`写入 ${filename} 失败:`, error)
    return false
  }
}

function initDefaultAdmin() {
  const accounts = readJson('accounts.json')
  const hasAdmin = accounts.find(acc => acc.username === 'admin')
  if (!hasAdmin) {
    accounts.push({
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      createdAt: '2024-01-01T00:00:00.000Z'
    })
    writeJson('accounts.json', accounts)
  }
}

initDefaultAdmin()

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  const accounts = readJson('accounts.json')

  const account = accounts.find(
    acc => acc.username === username && acc.password === password
  )

  if (!account) {
    return res.status(401).json({ success: false, message: '账号或密码错误' })
  }

  const { password: _, ...safeAccount } = account
  res.json({
    success: true,
    user: safeAccount,
    message: '登录成功'
  })
})

app.post('/api/auth/register', (req, res) => {
  const { username, password, role = 'user' } = req.body

  if (!username || !password) {
    return res.status(400).json({ success: false, message: '账号和密码不能为空' })
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: '密码长度至少6位' })
  }

  const accounts = readJson('accounts.json')

  if (accounts.find(acc => acc.username === username)) {
    return res.status(400).json({ success: false, message: '该账号已被注册' })
  }

  const newAccount = {
    username,
    password,
    role,
    createdAt: new Date().toISOString()
  }

  accounts.push(newAccount)
  writeJson('accounts.json', accounts)

  const { password: _, ...safeAccount } = newAccount
  res.json({
    success: true,
    user: safeAccount,
    message: '注册成功'
  })
})

app.get('/api/accounts', (req, res) => {
  const accounts = readJson('accounts.json')
  const safeAccounts = accounts.map(({ password: _, ...account }) => account)
  res.json(safeAccounts)
})

app.put('/api/accounts/:username/role', (req, res) => {
  const { username } = req.params
  const { role } = req.body

  const validRoles = ['admin', 'user', 'viewer']
  if (!validRoles.includes(role)) {
    return res.status(400).json({ success: false, message: '无效的角色' })
  }

  const accounts = readJson('accounts.json')
  const index = accounts.findIndex(acc => acc.username === username)

  if (index === -1) {
    return res.status(404).json({ success: false, message: '账号不存在' })
  }

  accounts[index].role = role
  writeJson('accounts.json', accounts)

  const { password: _, ...safeAccount } = accounts[index]
  res.json({
    success: true,
    user: safeAccount,
    message: '角色更新成功'
  })
})

app.delete('/api/accounts/:username', (req, res) => {
  const { username } = req.params

  if (username === 'admin') {
    return res.status(400).json({ success: false, message: '不能删除管理员账号' })
  }

  const accounts = readJson('accounts.json')
  const index = accounts.findIndex(acc => acc.username === username)

  if (index === -1) {
    return res.status(404).json({ success: false, message: '账号不存在' })
  }

  accounts.splice(index, 1)
  writeJson('accounts.json', accounts)

  res.json({ success: true, message: '账号删除成功' })
})

app.get('/api/agents', (req, res) => {
  const userRole = req.headers['x-user-role']
  const username = req.headers['x-username']

  let agents = readJson('agents.json')

  if (userRole !== 'admin') {
    agents = agents.filter(agent => {
      if (agent.createdBy === username) {
        return true
      }
      const visibleRoles = agent.visibleRoles || []
      if (typeof visibleRoles === 'string') {
        return visibleRoles === 'all' || visibleRoles.includes(userRole)
      }
      return visibleRoles.length === 0 || visibleRoles.includes(userRole)
    })
  }

  res.json(agents)
})

app.get('/api/agents/:id', (req, res) => {
  const { id } = req.params
  const userRole = req.headers['x-user-role']
  const username = req.headers['x-username']

  const agents = readJson('agents.json')
  const agent = agents.find(a => a.id === id)

  if (!agent) {
    return res.status(404).json({ success: false, message: '智能体不存在' })
  }

  if (userRole !== 'admin' && agent.createdBy !== username) {
    const visibleRoles = agent.visibleRoles || []
    const isVisible =
      visibleRoles === 'all' ||
      (Array.isArray(visibleRoles) && visibleRoles.includes(userRole))
    if (!isVisible) {
      return res.status(403).json({ success: false, message: '无权访问此智能体' })
    }
  }

  res.json(agent)
})

app.post('/api/agents', (req, res) => {
  const username = req.headers['x-username']
  const userRole = req.headers['x-user-role']

  if (!username) {
    return res.status(401).json({ success: false, message: '请先登录' })
  }

  const agents = readJson('agents.json')

  const newAgent = {
    ...req.body,
    id: Date.now().toString(),
    createdBy: username,
    createdByRole: userRole,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  agents.push(newAgent)
  writeJson('agents.json', agents)

  res.json(newAgent)
})

app.put('/api/agents/:id', (req, res) => {
  const { id } = req.params
  const username = req.headers['x-username']
  const userRole = req.headers['x-user-role']

  const agents = readJson('agents.json')
  const index = agents.findIndex(a => a.id === id)

  if (index === -1) {
    return res.status(404).json({ success: false, message: '智能体不存在' })
  }

  if (userRole !== 'admin' && agents[index].createdBy !== username) {
    return res.status(403).json({ success: false, message: '无权修改此智能体' })
  }

  agents[index] = {
    ...agents[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  }

  writeJson('agents.json', agents)

  res.json(agents[index])
})

app.delete('/api/agents/:id', (req, res) => {
  const { id } = req.params
  const username = req.headers['x-username']
  const userRole = req.headers['x-user-role']

  const agents = readJson('agents.json')
  const index = agents.findIndex(a => a.id === id)

  if (index === -1) {
    return res.status(404).json({ success: false, message: '智能体不存在' })
  }

  if (userRole !== 'admin' && agents[index].createdBy !== username) {
    return res.status(403).json({ success: false, message: '无权删除此智能体' })
  }

  agents.splice(index, 1)
  writeJson('agents.json', agents)

  res.json({ success: true, message: '删除成功' })
})

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`)
})
