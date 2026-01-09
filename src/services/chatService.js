import axios from 'axios'

class ChatService {
  constructor() {
    this.currentConversation = null
    this.userId = 'user_' + Date.now()
  }

  async sendMessage({ agent, messages, userInput, files = [], options = {} }) {
    if (!agent.apiUrl || !agent.apiKey) {
      throw new Error('智能体配置不完整，请检查API地址和API Key')
    }

    try {
      const requestBody = this.buildRequestBody(userInput, messages, files, options)

      const headers = {
        'Authorization': `Bearer ${agent.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      }

      if (options.traceId) {
        headers['X-Trace-Id'] = options.traceId
      }

      const response = await axios.post(agent.apiUrl, requestBody, {
        headers,
        timeout: options.timeout || 120000,
        responseType: 'stream'
      })

      const fullResponse = await this.processStreamResponse(response.data)
      
      if (fullResponse.conversation_id) {
        this.currentConversation = fullResponse.conversation_id
      }

      return fullResponse
    } catch (error) {
      console.error('发送消息失败:', error)
      throw new Error(`API请求失败: ${error.message}`)
    }
  }

  buildRequestBody(userInput, messages, files, options = {}) {
    const body = {
      query: userInput,
      inputs: options.inputs || {},
      response_mode: options.responseMode || 'streaming',
      user: options.userId || this.userId,
      auto_generate_name: options.autoGenerateName !== false
    }

    if (this.currentConversation) {
      body.conversation_id = this.currentConversation
    }

    if (options.conversationId) {
      body.conversation_id = options.conversationId
    }

    if (options.workflowId) {
      body.workflow_id = options.workflowId
    }

    if (options.traceId) {
      body.trace_id = options.traceId
    }

    if (files && files.length > 0) {
      body.files = files.map(file => ({
        type: file.type,
        transfer_method: file.transfer_method,
        url: file.transfer_method === 'remote_url' ? file.url : undefined,
        upload_file_id: file.transfer_method === 'local_file' ? file.upload_file_id : undefined
      }))
    }

    return body
  }

  async processStreamResponse(streamData) {
    return new Promise((resolve) => {
      let fullContent = ''
      let thinkContent = ''
      let conversationId = null
      let messageId = null
      let taskId = null
      let usage = null
      let retrieverResources = []

      const reader = streamData.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      const processChunk = async () => {
        try {
          const { done, value } = await reader.read()
          if (done) {
            resolve({
              content: fullContent || '抱歉，我无法生成合适的回答。',
              think: thinkContent || null,
              conversation_id: conversationId,
              message_id: messageId,
              task_id: taskId,
              usage: usage,
              retriever_resources: retrieverResources
            })
            return
          }

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim()
              if (!dataStr) continue

              try {
                const parsed = JSON.parse(dataStr)
                this.handleStreamEvent(parsed, {
                  fullContent,
                  thinkContent,
                  conversationId,
                  messageId,
                  taskId,
                  usage,
                  retrieverResources,
                  updateFullContent: (text) => { fullContent += text },
                  updateThinkContent: (text) => { thinkContent += text },
                  setConversationId: (id) => { conversationId = id },
                  setMessageId: (id) => { messageId = id },
                  setTaskId: (id) => { taskId = id },
                  setUsage: (u) => { usage = u },
                  setRetrieverResources: (r) => { retrieverResources = r }
                })
              } catch (e) {
                // 忽略解析错误
              }
            }
          }

          processChunk()
        } catch (error) {
          console.error('处理流响应出错:', error)
          resolve({
            content: fullContent || '处理响应时出错',
            think: thinkContent || null,
            conversation_id: conversationId,
            message_id: messageId,
            task_id: taskId,
            usage: usage,
            retriever_resources: retrieverResources
          })
        }
      }

      processChunk()
    })
  }

  handleStreamEvent(event, state) {
    switch (event.event) {
      case 'message':
      case 'agent_message':
        if (event.answer) {
          state.updateFullContent(event.answer)
        }
        if (event.conversation_id) {
          state.setConversationId(event.conversation_id)
        }
        if (event.message_id) {
          state.setMessageId(event.message_id)
        }
        if (event.task_id) {
          state.setTaskId(event.task_id)
        }
        break

      case 'agent_thought':
        if (event.thought) {
          state.updateThinkContent(`\n[思考 ${event.position || ''}] ${event.thought}\n`)
        }
        if (event.observation) {
          state.updateThinkContent(`[观察] ${event.observation}\n`)
        }
        break

      case 'message_file':
        break

      case 'message_end':
        if (event.metadata) {
          if (event.metadata.usage) {
            state.setUsage(event.metadata.usage)
          }
          if (event.metadata.retriever_resources) {
            state.setRetrieverResources(event.metadata.retriever_resources)
          }
        }
        break

      case 'message_replace':
        if (event.answer) {
          state.fullContent = event.answer
        }
        break

      case 'error':
        console.error('流式响应错误:', event.message)
        break

      case 'ping':
        break
    }
  }


}

export const chatService = new ChatService()
