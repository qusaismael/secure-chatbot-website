import { useState, useRef, useEffect } from 'react'
import { processMessage } from '../utils/mockBackend'
import './Chat.css'

const testAttacks = [
  { label: 'XSS Script', value: '<script>alert("XSS")</script>' },
  { label: 'XSS Event', value: '<img onerror="alert(1)" src=x>' },
  { label: 'XSS URL', value: 'javascript:alert(document.cookie)' },
  { label: 'SQL Drop', value: "'; DROP TABLE users; --" },
  { label: 'SQL Union', value: "' UNION SELECT * FROM passwords --" },
  { label: 'Template Injection', value: '${process.env.SECRET}' },
  { label: 'Path Traversal', value: '../../etc/passwd' },
  { label: 'Empty', value: '   ' },
]

function Chat({ onFlowUpdate }) {
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: "Hello! I can help with shipping, returns, warranty, and support questions.", timestamp: new Date() }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const updateFlow = async (status, failedAt = null) => {
    const steps = ['frontend', 'gateway', 'rate_limiter', 'input_validation', 'logger', 'llm_api', 'knowledge_base', 'response']
    
    if (status === 'processing') {
      for (let i = 0; i < steps.length; i++) {
        onFlowUpdate?.({ currentStep: steps[i], status: 'processing', completedSteps: steps.slice(0, i) })
        await new Promise(r => setTimeout(r, 150))
      }
      onFlowUpdate?.({ currentStep: null, status: 'complete', completedSteps: steps })
    } else if (status === 'error' && failedAt) {
      const failedIndex = steps.indexOf(failedAt)
      onFlowUpdate?.({ currentStep: failedAt, status: 'error', completedSteps: steps.slice(0, failedIndex), failedAt })
    }
  }

  const sendMessage = async (messageText) => {
    const text = messageText || input
    if (!text.trim() || isLoading) return

    const userMessage = { id: Date.now(), role: 'user', content: text.trim(), timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    onFlowUpdate?.({ currentStep: 'frontend', status: 'processing', completedSteps: [] })

    try {
      const data = await processMessage(userMessage.content)

      if (!data.success) {
        await updateFlow('error', data.failedAt || 'gateway')
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          role: 'error', 
          content: data.error || 'Request failed',
          failedAt: data.failedAt,
          timestamp: new Date() 
        }])
      } else {
        await updateFlow('processing')
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          role: 'assistant', 
          content: data.data.response, 
          metadata: data.data.metadata,
          timestamp: new Date() 
        }])
      }
    } catch (err) {
      await updateFlow('error', 'llm_api')
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        role: 'error', 
        content: 'Processing failed',
        failedAt: 'llm_api',
        timestamp: new Date() 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="chat">
      <div className="chat-header">
        <span className="status-dot"></span>
        <span>AI Assistant</span>
      </div>

      <div className="test-panel">
        <span className="test-label">Test Attacks:</span>
        <div className="test-buttons">
          {testAttacks.map((attack) => (
            <button
              key={attack.label}
              className="test-btn"
              onClick={() => sendMessage(attack.value)}
              disabled={isLoading}
              title={attack.value}
            >
              {attack.label}
            </button>
          ))}
        </div>
      </div>

      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-content">
              {msg.content}
              {msg.failedAt && (
                <span className="failed-badge">Failed at: {msg.failedAt.replace('_', ' ')}</span>
              )}
            </div>
            {msg.metadata && (
              <div className="message-meta">{msg.metadata.processingTimeMs}ms</div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="message assistant">
            <div className="message-content loading">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about shipping, returns, warranty..."
          disabled={isLoading}
        />
        <button onClick={() => sendMessage()} disabled={!input.trim() || isLoading}>
          Send
        </button>
      </div>
    </div>
  )
}

export default Chat
