import axios from 'axios'

class ChatService {
  constructor() {
    this.currentConversation = null
    this.userId = 'user_' + Date.now()
    this.chatflowConversationId = null
  }

  async uploadFile(file, apiKey) {
    const formData = new FormData()
    formData.append('file', file)

    console.log('开始上传文件:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    try {
      const response = await axios.post('http://10.255.216.2:8083/v1/files/upload', formData, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })
      console.log('文件上传成功，返回的文件ID:', response.data.id)
      return response.data.id
    } catch (error) {
      console.error('文件上传失败:', error)
      throw new Error(`文件上传失败: ${error.message}`)
    }
  }

  async sendMessage({ agent, messages, userInput, files = [], options = {} }) {
    const isChatflow = agent.category === 'chatflow'
    
    if (isChatflow) {
      return this.sendChatflowMessage({ agent, userInput, files, options })
    } else {
      return this.sendWorkflowMessage({ agent, messages, userInput, files, options })
    }
  }

  async sendWorkflowMessage({ agent, messages, userInput, files = [], options = {} }) {
    const apiUrl = agent.apiUrl || 'http://10.255.216.2:8083/v1/workflows/run'
    const apiKey = agent.apiKey || 'app-eOFxeRHMBoEZWxX5y2aOVww9'
    const responseMode = options.responseMode || 'streaming'
    const onChunk = options.onChunk

    try {
      const requestBody = this.buildWorkflowRequestBody(userInput, messages, files, options, agent)

      const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }

      if (options.traceId) {
        headers['X-Trace-Id'] = options.traceId
      }

      if (responseMode === 'streaming') {
        this.sendStreamingRequest(apiUrl, requestBody, headers, onChunk)
        return {
          content: '',
          think: null,
          conversation_id: null,
          message_id: null,
          task_id: null,
          usage: null,
          retriever_resources: [],
          response_mode: responseMode
        }
      } else {
        const response = await axios.post(apiUrl, requestBody, {
          headers,
          timeout: options.timeout || 120000
        })
        const fullResponse = {
          content: response.data.content || '抱歉，我无法生成合适的回答。',
          think: response.data.think || null,
          conversation_id: response.data.conversation_id,
          message_id: response.data.message_id,
          task_id: response.data.task_id,
          usage: response.data.usage,
          retriever_resources: response.data.retriever_resources,
          response_mode: responseMode
        }
        
        if (fullResponse.conversation_id) {
          this.currentConversation = fullResponse.conversation_id
        }

        return fullResponse
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      throw new Error(`API请求失败: ${error.message}`)
    }
  }

  async sendChatflowMessage({ agent, userInput, files = [], options = {} }) {
    const apiUrl = agent.apiUrl || 'http://10.255.216.2:8083/v1/chat-messages'
    const apiKey = agent.apiKey || 'app-TvNkNNywLUxZW2iP6to8ORB2'
    const responseMode = options.responseMode || 'streaming'
    const onChunk = options.onChunk

    try {
      const requestBody = await this.buildChatflowRequestBody(userInput, files, options, agent, apiKey)

      const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }

      if (options.traceId) {
        headers['X-Trace-Id'] = options.traceId
      }

      if (responseMode === 'streaming') {
        this.sendStreamingRequest(apiUrl, requestBody, headers, onChunk, true)
        return {
          content: '',
          think: null,
          conversation_id: null,
          message_id: null,
          task_id: null,
          usage: null,
          retriever_resources: [],
          response_mode: responseMode
        }
      } else {
        const response = await axios.post(apiUrl, requestBody, {
          headers,
          timeout: options.timeout || 120000
        })
        const fullResponse = {
          content: response.data.content || '抱歉，我无法生成合适的回答。',
          think: response.data.think || null,
          conversation_id: response.data.conversation_id,
          message_id: response.data.message_id,
          task_id: response.data.task_id,
          usage: response.data.usage,
          retriever_resources: response.data.retriever_resources,
          response_mode: responseMode
        }
        
        if (fullResponse.conversation_id) {
          this.chatflowConversationId = fullResponse.conversation_id
        }

        return fullResponse
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      throw new Error(`API请求失败: ${error.message}`)
    }
  }

  async buildWorkflowRequestBody(userInput, messages, files, options = {}, agent = {}, apiKey) {
    const body = {
      inputs: {
        input: userInput
      },
      response_mode: options.responseMode || 'streaming',
      user: agent.agentIdentifier !== undefined ? agent.agentIdentifier : ''
    }

    return body
  }

  getFileType(mimeType) {
    if (!mimeType) return 'document'
    
    if (mimeType.startsWith('image/')) {
      return 'image'
    }
    
    if (mimeType === 'image') {
      return 'image'
    }
    
    if (mimeType === 'document') {
      return 'document'
    }
    
    return 'document'
  }

  async buildChatflowRequestBody(userInput, files, options = {}, agent = {}, apiKey) {
    const body = {
      response_mode: options.responseMode || 'streaming',
      conversation_id: this.chatflowConversationId || '',
      files: [],
      query: userInput,
      inputs: {},
      parent_message_id: null,
      user: agent.agentIdentifier || this.userId
    }

    const allFiles = [...(files || []), ...(options.images || [])]
    if (allFiles.length > 0) {
      const processedFiles = []
      
      for (const file of allFiles) {
        if (file.file) {
          const fileId = await this.uploadFile(file.file, apiKey)
          processedFiles.push({
            type: this.getFileType(file.type),
            transfer_method: 'local_file',
            url: '',
            upload_file_id: fileId
          })
        } else if (file.url) {
          processedFiles.push({
            type: this.getFileType(file.type),
            transfer_method: 'remote_url',
            url: file.url,
            upload_file_id: ''
          })
        } else if (file.upload_file_id) {
          processedFiles.push({
            type: this.getFileType(file.type),
            transfer_method: 'local_file',
            url: '',
            upload_file_id: file.upload_file_id
          })
        }
      }
      
      if (processedFiles.length > 0) {
        body.inputs.upload_file = processedFiles
      }
    }

    return body
  }

  resetChatflowConversation() {
    this.chatflowConversationId = null
  }

  async sendStreamingRequest(url, body, headers, onChunk, isChatflow = false) {
    // 直接处理流式请求，不返回Promise，确保后台运行
    fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    }).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''
      let thinkContent = ''
      let retrieverResources = []
      let buffer = ''

      const processChunk = async () => {
        try {
          const { done, value } = await reader.read()
          if (done) {
            return
          }

          // 立即解码并处理新数据
          const chunkText = decoder.decode(value, { stream: true })
          
          // 直接将新数据添加到buffer
          buffer += chunkText
          
          // 处理所有可能的格式
          let processed = false
          
          // 1. 尝试处理SSE格式
          if (buffer.includes('data: ')) {
            processed = true
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim()
                if (!dataStr) continue

                try {
                  // 检查数据是否是HTML格式
                  if (dataStr.startsWith('<!DOCTYPE') || dataStr.startsWith('<html')) {
                    console.error('收到HTML响应，可能是服务器错误:', dataStr.substring(0, 100) + '...')
                    // 尝试从HTML中提取错误信息
                    const errorMatch = dataStr.match(/<title>(.*?)<\/title>/i)
                    const errorMessage = errorMatch ? errorMatch[1] : '服务器错误'
                    // 调用onChunk显示错误信息
                    if (onChunk) {
                      onChunk({
                        content: `服务器错误: ${errorMessage}`,
                        think: thinkContent
                      })
                    }
                    return
                  }
                  
                  // 检查数据是否是JSON格式
                  let parsed
                  try {
                    parsed = JSON.parse(dataStr)
                  } catch (e) {
                    console.error('数据不是有效的JSON格式:', dataStr)
                    continue
                  }
                  
                  // 如果是 chatflow 模式，提取 conversation_id
                  if (isChatflow && parsed.conversation_id) {
                    this.chatflowConversationId = parsed.conversation_id
                  }
                  
                  // 使用processStreamData方法处理解析后的数据
                  const updatedContent = this.processStreamData(parsed, fullContent, thinkContent, onChunk)
                  fullContent = updatedContent.fullContent
                  thinkContent = updatedContent.thinkContent
                  retrieverResources = updatedContent.retrieverResources
                } catch (e) {
                  console.error('解析SSE数据失败:', e, dataStr)
                  // 尝试处理非JSON格式的数据
                  if (typeof dataStr === 'string' && dataStr.trim()) {
                    // 检查是否是纯文本
                    if (!dataStr.includes('{') && !dataStr.includes('[')) {
                      // 直接将纯文本添加到fullContent
                      fullContent += dataStr
                      if (onChunk) {
                        onChunk({
                          content: fullContent,
                          think: thinkContent,
                          retrieverResources: retrieverResources
                        })
                      }
                    }
                  }
                }
              }
            }
          }
          
          // 2. 尝试处理JSON数组流（如：[1, 2, 3]）
          if (!processed && buffer.startsWith('[') && buffer.endsWith(']')) {
            processed = true
            try {
              const parsed = JSON.parse(buffer)
              if (Array.isArray(parsed)) {
                for (const item of parsed) {
                  const updatedContent = this.processStreamData(item, fullContent, thinkContent, onChunk)
                  fullContent = updatedContent.fullContent
                  thinkContent = updatedContent.thinkContent
                  retrieverResources = updatedContent.retrieverResources
                }
              }
              buffer = ''
            } catch (e) {
              console.error('解析JSON数组失败:', e, buffer)
            }
          }
          
          // 3. 尝试处理单个JSON对象流（如：{"content": "hello"}）
          if (!processed && buffer.startsWith('{') && buffer.endsWith('}')) {
            processed = true
            try {
              const parsed = JSON.parse(buffer)
              const updatedContent = this.processStreamData(parsed, fullContent, thinkContent, onChunk)
              fullContent = updatedContent.fullContent
              thinkContent = updatedContent.thinkContent
              retrieverResources = updatedContent.retrieverResources
              buffer = ''
            } catch (e) {
              console.error('解析单个JSON失败:', e, buffer)
            }
          }
          
          // 4. 尝试处理多行JSON流（每行一个JSON对象）
          if (!processed && buffer.includes('\n')) {
            processed = true
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.trim()) {
                try {
                  const parsed = JSON.parse(line)
                  const updatedContent = this.processStreamData(parsed, fullContent, thinkContent, onChunk)
                  fullContent = updatedContent.fullContent
                  thinkContent = updatedContent.thinkContent
                  retrieverResources = updatedContent.retrieverResources
                } catch (e) {
                  console.error('解析多行JSON失败:', e, line)
                }
              }
            }
          }
          
          // 5. 尝试处理增量JSON流（如：{"content": "h"}{"content": "e"}{"content": "l"}）
          if (!processed) {
            let cursor = 0
            while (cursor < buffer.length) {
              // 查找下一个JSON对象的开始和结束
              const startIndex = buffer.indexOf('{', cursor)
              if (startIndex === -1) break
              
              // 尝试找到匹配的结束括号
              let depth = 0
              let endIndex = -1
              for (let i = startIndex; i < buffer.length; i++) {
                if (buffer[i] === '{') depth++
                if (buffer[i] === '}') depth--
                if (depth === 0) {
                  endIndex = i + 1
                  break
                }
              }
              
              if (endIndex !== -1) {
                // 提取并解析JSON对象
                const jsonStr = buffer.substring(startIndex, endIndex)
                try {
                  const parsed = JSON.parse(jsonStr)
                  const updatedContent = this.processStreamData(parsed, fullContent, thinkContent, onChunk)
                  fullContent = updatedContent.fullContent
                  thinkContent = updatedContent.thinkContent
                  retrieverResources = updatedContent.retrieverResources
                  
                  // 更新cursor，继续处理剩余数据
                  cursor = endIndex
                } catch (e) {
                  // 解析失败，退出循环
                  console.error('解析增量JSON失败:', e, jsonStr)
                  break
                }
              } else {
                // 没有找到匹配的结束括号，退出循环
                break
              }
            }
            
            // 更新buffer为剩余未处理的数据
            buffer = buffer.substring(cursor)
          }

          // 继续处理下一个chunk
          processChunk()
        } catch (error) {
          console.error('处理流响应出错:', error)
        }
      }

      processChunk()
    }).catch(error => {
      console.error('API请求失败:', error)
    })
  }
  
  // 处理流数据的通用方法，返回更新后的内容对象
  processStreamData(parsed, fullContent, thinkContent, onChunk) {
    // 处理不同格式的响应
    let content = ''
    let thought = ''
    let isContentUpdated = false
    let updatedFullContent = fullContent
    let updatedThinkContent = thinkContent
    let skipOnChunk = false // 标记是否跳过末尾的onChunk调用
    let retrieverResources = [] // 知识检索结果
    
    // 确保parsed是有效的对象
    if (!parsed || typeof parsed !== 'object') {
      console.error('无效的解析数据:', parsed)
      return {
        fullContent: updatedFullContent,
        thinkContent: updatedThinkContent,
        retrieverResources: []
      }
    }
    
    // 1. 处理直接的content或answer字段
    if (parsed.content) {
      content = parsed.content
      isContentUpdated = true
    } else if (parsed.answer) {
      content = parsed.answer
      isContentUpdated = true
    }
    // 2. 处理OpenAI格式的choices字段
    else if (parsed.choices && Array.isArray(parsed.choices) && parsed.choices.length > 0) {
      const choice = parsed.choices[0]
      if (choice && choice.delta?.content) {
        content = choice.delta.content
        isContentUpdated = true
      }
    }
    // 3. 处理事件格式
    else if (parsed.event) {
      switch (parsed.event) {
        // 处理思考过程
        case 'agent_thought':
          if (parsed.thought) {
            thought = `\n[思考 ${parsed.position || ''}] ${parsed.thought}\n`
            isContentUpdated = true
          }
          break
          
        // 处理消息替换
        case 'message_replace':
          if (parsed.answer || parsed.content) {
            updatedFullContent = parsed.answer || parsed.content
            isContentUpdated = true
            skipOnChunk = true // 跳过末尾的onChunk调用，因为这里已经调用了
            // 对于 message_replace 事件，直接调用 onChunk 替换整个内容
            if (onChunk) {
              onChunk({
                content: updatedFullContent,
                think: updatedThinkContent,
                retrieverResources: retrieverResources
              })
            }
          }
          break
          
        // 处理工作流结束事件
        case 'workflow_finished':
          if (parsed.data) {
            // 从data中提取结果
            if (parsed.data.result) {
              updatedFullContent = parsed.data.result
              isContentUpdated = true
            } else if (parsed.data.output) {
              updatedFullContent = parsed.data.output
              isContentUpdated = true
            } else if (parsed.data.content) {
              updatedFullContent = parsed.data.content
              isContentUpdated = true
            } else if (parsed.data.answer) {
              updatedFullContent = parsed.data.answer
              isContentUpdated = true
            } else if (parsed.data.outputs && typeof parsed.data.outputs === 'object') {
              // 遍历outputs，查找可能的结果
              for (const key in parsed.data.outputs) {
                if (parsed.data.outputs.hasOwnProperty(key)) {
                  const outputValue = parsed.data.outputs[key]
                  if (typeof outputValue === 'string') {
                    updatedFullContent = outputValue
                    isContentUpdated = true
                    break
                  } else if (outputValue?.content) {
                    updatedFullContent = outputValue.content
                    isContentUpdated = true
                    break
                  } else if (outputValue?.answer) {
                    updatedFullContent = outputValue.answer
                    isContentUpdated = true
                    break
                  }
                }
              }
            }
            // 对于 workflow_finished 事件，直接调用 onChunk 更新最终内容
            if (isContentUpdated && onChunk) {
              skipOnChunk = true // 跳过末尾的onChunk调用，因为这里已经调用了
              onChunk({
                content: updatedFullContent,
                think: updatedThinkContent,
                retrieverResources: retrieverResources
              })
            }
          }
          break
          
        // 处理其他消息事件
        case 'message':
        case 'agent_message':
          if (parsed.answer || parsed.content) {
            content = parsed.answer || parsed.content
            isContentUpdated = true
          }
          break

        // 处理节点完成事件（知识检索等）
        case 'node_finished':
          if (parsed.data && parsed.data.outputs && parsed.data.outputs.result) {
            const result = parsed.data.outputs.result
            if (Array.isArray(result) && result.length > 0) {
              // 提取知识检索结果中的内容
              retrieverResources = result.map(item => ({
                title: item.title || item.document_name || '',
                content: item.content || ''
              })).filter(r => r.content)
            }
          }
          break

        // 处理文本块事件（流式文本）
        case 'text_chunk':
          if (parsed.data && parsed.data.text) {
            content = parsed.data.text
            isContentUpdated = true
          }
          break
      }
    }
    
    // 更新内容并调用onChunk
    if (isContentUpdated && !skipOnChunk) {
      // 更新fullContent和thinkContent
      if (content) {
        updatedFullContent += content
      }
      if (thought) {
        updatedThinkContent += thought
      }
      
      // 立即调用onChunk回调，更新UI
      if (onChunk) {
        onChunk({
          content: updatedFullContent,
          think: updatedThinkContent,
          retrieverResources: retrieverResources
        })
      }
    } else if (retrieverResources.length > 0 && onChunk) {
      // 如果只有知识检索结果更新，也调用onChunk
      onChunk({
        content: updatedFullContent,
        think: updatedThinkContent,
        retrieverResources: retrieverResources
      })
    }
    
    // 返回更新后的内容
    return {
      fullContent: updatedFullContent,
      thinkContent: updatedThinkContent,
      retrieverResources: retrieverResources
    }
  }
}

export const chatService = new ChatService()
