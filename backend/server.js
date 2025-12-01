import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import validator from 'validator';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const app = express();
const PORT = process.env.PORT || 3001;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple())
    })
  ]
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    logger.warn(`CORS blocked: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, error: 'Rate limit exceeded', failedAt: 'rate_limiter' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit: ${req.ip}`);
    res.status(429).json(options.message);
  }
});

app.use('/api/', limiter);
app.use(express.json({ limit: '10kb' }));

app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

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
      logger.warn(`Blocked ${name}: ${message.substring(0, 50)}`);
      return { valid: false, error: `Blocked: ${name}`, failedAt: 'input_validation' };
    }
  }

  return { valid: true, sanitized: validator.escape(validator.stripLow(trimmed, true)) };
}

const responses = {
  returns: "30-day return policy with original receipt.",
  shipping: "Free shipping over $50. Delivery: 3-5 business days.",
  privacy: "We don't share data with third parties.",
  warranty: "1-year warranty on manufacturing defects.",
  support: "Support: Mon-Fri 9AM-6PM EST. Call 1-800-555-0123.",
  default: "I can help with shipping, returns, warranty, and support."
};

async function queryLLM(message) {
  await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
  
  const lower = message.toLowerCase();
  if (lower.includes('return') || lower.includes('refund')) return responses.returns;
  if (lower.includes('ship') || lower.includes('delivery')) return responses.shipping;
  if (lower.includes('privacy') || lower.includes('data')) return responses.privacy;
  if (lower.includes('warranty') || lower.includes('broken')) return responses.warranty;
  if (lower.includes('contact') || lower.includes('support') || lower.includes('help')) return responses.support;
  return responses.default;
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/chat', async (req, res) => {
  const start = Date.now();
  const { message } = req.body;
  
  logger.info(`[${req.requestId}] Chat request`);

  const validation = validateInput(message);
  if (!validation.valid) {
    return res.status(400).json({ success: false, error: validation.error, failedAt: validation.failedAt });
  }

  try {
    const response = await queryLLM(validation.sanitized);
    res.json({
      success: true,
      data: { response, metadata: { requestId: req.requestId, processingTimeMs: Date.now() - start } }
    });
  } catch (error) {
    logger.error(`[${req.requestId}] ${error.message}`);
    res.status(500).json({ success: false, error: 'Processing failed', failedAt: 'llm_api' });
  }
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => res.status(500).json({ error: 'Internal error' }));

app.listen(PORT, () => logger.info(`Server on port ${PORT}`));
