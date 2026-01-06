# exply Backend Server

Simple backend server that handles Gemini API calls. The API key is stored server-side, so users don't need to provide it.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Add your Gemini API key to `.env`:
```env
GEMINI_API_KEY=your_actual_gemini_api_key
```

4. Start server:
```bash
npm start
```

## Deployment

Deploy to any Node.js hosting service:
- **Heroku**: `git push heroku main`
- **Railway**: Connect GitHub repo
- **Render**: Connect GitHub repo
- **Vercel**: `vercel`
- **Fly.io**: `fly deploy`

Make sure to set `GEMINI_API_KEY` as an environment variable on your hosting platform.

## API Endpoint

### POST /explain

**Request:**
```json
{
  "text": "highlighted text",
  "mode": "explain|simplify|implication",
  "context": {
    "highlightedText": "text",
    "domain": "example.com",
    "pageTitle": "Page Title",
    "containingSentence": "sentence",
    "previousParagraph": "previous",
    "nextParagraph": "next"
  },
  "target_language": "en",
  "followUpQuestion": "optional question"
}
```

**Response:**
```json
{
  "result": "explanation text"
}
```
