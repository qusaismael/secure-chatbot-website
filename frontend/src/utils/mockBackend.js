
// Simulates the server-side validation and LLM responses

const responses = {
  returns: "30-day return policy with original receipt.",
  shipping: "Free shipping over $50. Delivery: 3-5 business days.",
  privacy: "We don't share data with third parties.",
  warranty: "1-year warranty on manufacturing defects.",
  support: "Support: Mon-Fri 9AM-6PM EST. Call 1-800-555-0123.",
  default: "I can help with shipping, returns, warranty, and support."
};

function validateInput(message) {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message is required', failedAt: 'input_validation' };
  }

  const trimmed = message.trim();
  if (trimmed.length < 1) return { valid: false, error: 'Message cannot be empty', failedAt: 'input_validation' };
  if (trimmed.length > 2000) return { valid: false, error: 'Message too long', failedAt: 'input_validation' };

  const patterns = [
    { pattern: /(<script|javascript:|on\w+\s*=)/i, name: 'XSS' },
    { pattern: /(union\s+select|drop\s+table|insert\s+into)/i, name: 'SQL injection' },
    { pattern: /(\$\{|\{\{|<%)/i, name: 'Template injection' },
    { pattern: /\.\.[\/\\]/, name: 'Path traversal' },
  ];

  for (const { pattern, name } of patterns) {
    if (pattern.test(message)) {
      return { valid: false, error: `Blocked: ${name}`, failedAt: 'input_validation' };
    }
  }

  return { valid: true, sanitized: trimmed };
}

function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return str.replace(/[&<>"']/g, c => map[c]);
}

async function queryLLM(message) {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
  
  const lower = message.toLowerCase();
  if (lower.includes('return') || lower.includes('refund')) return responses.returns;
  if (lower.includes('ship') || lower.includes('delivery')) return responses.shipping;
  if (lower.includes('privacy') || lower.includes('data')) return responses.privacy;
  if (lower.includes('warranty') || lower.includes('broken')) return responses.warranty;
  if (lower.includes('contact') || lower.includes('support') || lower.includes('help')) return responses.support;
  return responses.default;
}

// Rate limiter state
const rateLimiter = {
  requests: [],
  windowMs: 60 * 1000,
  maxRequests: 30,
  
  check() {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.windowMs);
    if (this.requests.length >= this.maxRequests) {
      return { allowed: false, error: 'Rate limit exceeded', failedAt: 'rate_limiter' };
    }
    this.requests.push(now);
    return { allowed: true };
  }
};

export async function processMessage(message) {
  const start = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // Check rate limit
  const rateCheck = rateLimiter.check();
  if (!rateCheck.allowed) {
    return { success: false, error: rateCheck.error, failedAt: rateCheck.failedAt };
  }

  // Validate input
  const validation = validateInput(message);
  if (!validation.valid) {
    return { success: false, error: validation.error, failedAt: validation.failedAt };
  }

  try {
    const response = await queryLLM(validation.sanitized);
    return {
      success: true,
      data: {
        response: escapeHtml(response),
        metadata: {
          requestId,
          processingTimeMs: Date.now() - start
        }
      }
    };
  } catch (error) {
    return { success: false, error: 'Processing failed', failedAt: 'llm_api' };
  }
}

