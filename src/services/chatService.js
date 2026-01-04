import axios from 'axios'
import { agentService } from './agentService'

class ChatService {
  constructor() {
    this.currentConversation = []
  }

  async sendMessage({ agent, messages, userInput }) {
    // 检查是否为Mock模式
    if (agentService.isMockMode()) {
      return this.getMockResponse(userInput, messages)
    }

    if (!agent.apiUrl || !agent.apiKey) {
      throw new Error('智能体配置不完整，请检查API地址和API Key')
    }

    try {
      // 构建OpenAI格式的消息
      const openaiMessages = this.buildOpenAIMessages(messages, userInput)
      
      // 发送请求到智能体API
      const response = await axios.post(agent.apiUrl, {
        messages: openaiMessages,
        stream: true
      }, {
        headers: {
          'Authorization': `Bearer ${agent.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      })

      // 处理流式响应
      const fullResponse = await this.processStreamResponse(response.data)
      return fullResponse
    } catch (error) {
      console.error('发送消息失败:', error)
      throw new Error(`API请求失败: ${error.message}`)
    }
  }

  buildOpenAIMessages(messages, userInput) {
    const openaiMessages = []
    
    // 添加系统消息（如果需要）
    openaiMessages.push({
      role: 'system',
      content: `你是一个专业的招投标助手，名称为"${messages.find(m => m.role === 'assistant')?.content || '智能助手'}"。请用专业、友好的方式回答用户关于招投标的问题。`
    })
    
    // 添加历史消息
    messages.forEach(message => {
      if (message.role !== 'assistant' || message.content) {
        openaiMessages.push({
          role: message.role,
          content: message.content
        })
      }
    })
    
    return openaiMessages
  }

  async processStreamResponse(streamData) {
    return new Promise((resolve) => {
      let fullContent = ''
      let thinkContent = ''
      
      // 模拟流式处理
      const lines = streamData.split('\n')
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          
          if (data === '[DONE]') {
            break
          }
          
          try {
            const parsed = JSON.parse(data)
            if (parsed.choices && parsed.choices[0]) {
              const delta = parsed.choices[0].delta
              if (delta.content) {
                fullContent += delta.content
              }
              if (delta.think) {
                thinkContent += delta.think
              }
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
      
      resolve({
        content: fullContent || '抱歉，我无法生成合适的回答。',
        think: thinkContent || null
      })
    })
  }

  async getMockResponse(userInput, messages) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    const responses = this.getMockResponses(userInput)
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)]
    
    return {
      content: selectedResponse.content,
      think: selectedResponse.think
    }
  }

  getMockResponses(userInput) {
    const input = userInput.toLowerCase()
    
    if (input.includes('招投标') || input.includes('招标') || input.includes('投标')) {
      return [
        {
          content: '招投标是招标人公开或邀请潜在投标人，按照规定程序和要求提交投标文件，并按照规定标准从中择优选定中标人的交易方式。',
          think: '用户询问招投标的基本概念，我需要提供准确、专业的定义，并解释其核心要素和特点。'
        },
        {
          content: '招投标流程主要包括：招标公告或投标邀请书、投标人资格审查、发放招标文件、投标、开标、评标、中标通知和合同签订等环节。',
          think: '用户询问招投标流程，我应该按照实际业务流程的顺序，详细说明每个环节的具体内容和注意事项。'
        },
        {
          content: '提高中标率的关键在于：充分理解项目需求、制定合理的报价策略、完善技术方案、提供优质服务、建立良好的企业信誉等。',
          think: '用户关心如何提高中标率，这是一个实用性问题，我需要从多个维度提供具体的建议和策略。'
        }
      ]
    }
    
    if (input.includes('流程') || input.includes('步骤')) {
      return [
        {
          content: '招投标的基本流程如下：1.招标人发布招标公告；2.投标人购买招标文件；3.编制投标文件；4.提交投标文件；5.开标评标；6.确定中标人；7.签订合同。每个环节都有严格的时间要求和标准。',
          think: '用户询问具体的招投标步骤，我需要按照时间顺序详细列出每个环节，并强调时间节点的重要性。'
        }
      ]
    }
    
    if (input.includes('中标') || input.includes('成功率')) {
      return [
        {
          content: '提高中标率的方法包括：深入研究招标文件、准确理解技术要求、合理制定报价策略、完善投标文件编制、加强与招标人的沟通、积累行业经验等。同时要关注市场动态和竞争对手情况。',
          think: '用户关注中标率问题，这是投标企业最关心的话题。我需要从策略、技术、商务等多个角度提供实用建议。'
        }
      ]
    }
    
    return [
      {
        content: '我是招投标智能助手，专门为您提供招投标相关的咨询服务。您可以询问关于招投标流程、法规政策、投标技巧等方面的问题。',
        think: '用户提出了一个比较宽泛的问题，我需要简洁地介绍自己的能力，并引导用户提出更具体的问题。'
      },
      {
        content: '感谢您的提问！招投标涉及面很广，建议您可以具体询问某个环节的问题，比如"如何编制投标文件"、"评标标准是什么"等，我会为您提供更详细的解答。',
        think: '用户的问题不够具体，我应该引导用户提出更明确的问题，并提供一些示例。'
      }
    ]
  }

  // 清除当前对话历史
  clearConversation() {
    this.currentConversation = []
  }

  // 获取当前对话历史
  getConversation() {
    return this.currentConversation
  }

  // 设置当前对话历史
  setConversation(messages) {
    this.currentConversation = messages
  }
}

export const chatService = new ChatService()