import { useState, useEffect } from 'react'
import './ArchitectureViewer.css'

const steps = [
  { id: 'frontend', name: 'Frontend', desc: 'Captures user input' },
  { id: 'gateway', name: 'API Gateway', desc: 'HTTPS + CORS' },
  { id: 'rate_limiter', name: 'Rate Limiter', desc: '30 req/min' },
  { id: 'input_validation', name: 'Validation', desc: 'Sanitization' },
  { id: 'logger', name: 'Logger', desc: 'Audit trail' },
  { id: 'llm_api', name: 'LLM API', desc: 'Model inference' },
  { id: 'knowledge_base', name: 'Knowledge Base', desc: 'Data retrieval' },
  { id: 'response', name: 'Response', desc: 'Output format' }
]

function ArchitectureViewer({ flowState }) {
  const [localState, setLocalState] = useState({ completedSteps: [], currentStep: null, status: 'idle', failedAt: null })

  useEffect(() => {
    if (flowState) setLocalState(flowState)
  }, [flowState])

  const runDemo = async () => {
    setLocalState({ completedSteps: [], currentStep: null, status: 'idle', failedAt: null })
    
    for (let i = 0; i < steps.length; i++) {
      setLocalState({ currentStep: steps[i].id, status: 'processing', completedSteps: steps.slice(0, i).map(s => s.id), failedAt: null })
      await new Promise(r => setTimeout(r, 400))
    }
    setLocalState({ currentStep: null, status: 'complete', completedSteps: steps.map(s => s.id), failedAt: null })
  }

  const getStepStatus = (stepId) => {
    if (localState.failedAt === stepId) return 'error'
    if (localState.currentStep === stepId) return 'active'
    if (localState.completedSteps?.includes(stepId)) return 'done'
    return 'pending'
  }

  return (
    <div className="architecture">
      <div className="architecture-header">
        <h2>Request Flow</h2>
        <button onClick={runDemo}>Run Demo</button>
      </div>

      <div className="flow">
        {steps.map((step, i) => (
          <div key={step.id} className="flow-item">
            <div className={`flow-node ${getStepStatus(step.id)}`}>
              <div className="node-number">{i + 1}</div>
              <div className="node-info">
                <div className="node-name">{step.name}</div>
                <div className="node-desc">{step.desc}</div>
              </div>
              {getStepStatus(step.id) === 'error' && <div className="error-indicator">✕</div>}
              {getStepStatus(step.id) === 'done' && <div className="done-indicator">✓</div>}
            </div>
            {i < steps.length - 1 && <div className={`flow-line ${getStepStatus(step.id) === 'done' ? 'done' : ''}`} />}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ArchitectureViewer
