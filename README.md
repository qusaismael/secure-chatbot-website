# SecureChat

Secure AI chatbot demo for educational purposes.

**[Live Demo](https://securebot.qusai.pro)**

## Architecture

```
Frontend → API Gateway → Rate Limiter → Validation → Logger → LLM → Response
```

## Security

- Rate limiting (30 req/min)
- XSS, SQL injection, template injection filtering
- Input sanitization
- Request ID tracking

## Run Locally

```bash
cd frontend && npm install && npm run dev
```

Open http://localhost:5173

## Deploy to GitHub Pages

1. **Push to GitHub** - Push this repo to your GitHub account

2. **Enable GitHub Pages**:
   - Go to repo Settings → Pages
   - Set Source to "GitHub Actions"

3. **Update repo name** (if different from `AI-Agent-Demo`):
   - Edit `frontend/vite.config.js` and update the `base` path
   - Edit `frontend/package.json` and update the `homepage` URL

4. **Deploy** - Push to `main` branch and GitHub Actions will auto-deploy

The workflow file is at `.github/workflows/deploy.yml`

## API (Simulated)

The demo simulates a backend API entirely in the browser. It demonstrates:
- Input validation blocking XSS, SQL injection, template injection
- Rate limiting
- Request flow visualization

Returns `failedAt` on errors to show which layer blocked the request.
