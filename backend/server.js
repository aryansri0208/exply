// exply - Simple Backend Server
// Handles Gemini API calls with server-side API key

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration - Allow all origins for browser extension
app.use(cors({
  origin: '*', // Allow all origins for extension
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false // Set to false when using origin: '*'
}));

// Handle preflight OPTIONS requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(204);
});

app.use(express.json({ limit: '1mb' }));

// Gemini API Configuration
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

if (!GEMINI_API_KEY) {
  console.error('ERROR: GEMINI_API_KEY environment variable is not set');
  process.exit(1);
}

// Language name mapping
const LANGUAGE_NAMES = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian',
  pt: 'Portuguese', zh: 'Chinese', ja: 'Japanese', ko: 'Korean', ru: 'Russian',
  ar: 'Arabic', hi: 'Hindi'
};

/**
 * Build explanation prompt
 */
function buildExplanationPrompt(context, mode = 'explain', language = 'en') {
  const responseLanguage = LANGUAGE_NAMES[language] || 'English';
  
  const baseContext = `Context:
- Domain: ${context.domain}
- Page: ${context.pageTitle}
- Highlighted text: "${context.highlightedText}"
- Sentence containing it: "${context.containingSentence}"
${context.previousParagraph ? `- Previous context: "${context.previousParagraph}"` : ''}
${context.nextParagraph ? `- Following context: "${context.nextParagraph}"` : ''}`;

  let modeInstructions = '';
  
  switch (mode) {
    case 'simplify':
      modeInstructions = `Rewrite the meaning in very plain language in ${responseLanguage}:
- Assume middle-school reading level
- Use short sentences, no jargon
- Make it easy to understand
- Keep it concise (3-5 bullet points)
- Respond entirely in ${responseLanguage}`;
      break;
    
    case 'implication':
      modeInstructions = `Explain why this matters and what it implies in ${responseLanguage}:
- What this suggests or implies
- What a reader should take away
- What to expect next
- Avoid speculation beyond the provided context
- Keep it concise (3-5 bullet points)
- Respond entirely in ${responseLanguage}`;
      break;
    
    case 'explain':
    default:
      modeInstructions = `Explain what this text means IN THIS SPECIFIC CONTEXT in ${responseLanguage}:
- Focus on intent and interpretation
- Avoid generic dictionary definitions
- Mention any ambiguity if present
- Stay neutral and factual
- Format as clean bullet points (3-6 points)
- Respond entirely in ${responseLanguage}`;
      break;
  }

  return `You are helping a user understand text they've highlighted on a webpage. The user wants the response in ${responseLanguage}.

${baseContext}

${modeInstructions}

IMPORTANT: You MUST respond entirely in ${responseLanguage}. Do NOT use any other language, even if the input text is in a different language. If you mention original terms, keep them very short and immediately explain them in ${responseLanguage}.

Do NOT use phrases like "as an AI" or "I am". Respond entirely in ${responseLanguage}.`;
}

/**
 * Call Gemini API
 */
async function callGemini(context, followUpQuestion = null, mode = 'explain', language = 'en') {
  const systemInstruction = 'You are a helpful assistant that explains text in context. Be concise, factual, and context-aware.';
  
  const fullPrompt = followUpQuestion 
    ? `${systemInstruction}\n\nFollow-up question about the previously highlighted text "${context.highlightedText}": ${followUpQuestion}\n\nContext and language requirements:\n${buildExplanationPrompt(context, mode, language)}\n\nAnswer only this specific question briefly, staying within the original context. Respond entirely in ${LANGUAGE_NAMES[language] || 'English'}.`
    : `${systemInstruction}\n\n${buildExplanationPrompt(context, mode, language)}`;

  const url = `${GEMINI_API_ENDPOINT}?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: fullPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || response.statusText;
    
    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication error with AI service');
    } else if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else if (response.status >= 500) {
      throw new Error('AI service is temporarily unavailable. Please try again later.');
    } else {
      throw new Error(`AI service error: ${errorMessage}`);
    }
  }

  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Invalid response format from AI service');
  }

  const candidate = data.candidates[0];
  const parts = candidate.content.parts || [];
  const fullText = parts.map(part => part.text || '').join('');
  
  if (candidate.finishReason === 'MAX_TOKENS') {
    console.warn('Response was truncated due to token limit');
  }
  
  return fullText || 'No explanation provided.';
}

/**
 * POST /explain - Main endpoint
 */
app.post('/explain', async (req, res) => {
  try {
    const { text, mode, context, target_language, followUpQuestion } = req.body;
    
    if (!text && !context?.highlightedText) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required field: text or context.highlightedText'
      });
    }

    const explanationContext = context || {
      highlightedText: text,
      domain: 'unknown',
      pageTitle: 'Unknown Page',
      containingSentence: text,
      previousParagraph: null,
      nextParagraph: null
    };

    const explanationMode = mode || 'explain';
    const targetLang = target_language || 'en';

    const result = await callGemini(
      explanationContext,
      followUpQuestion || null,
      explanationMode,
      targetLang
    );

    res.json({
      result: result
    });

  } catch (error) {
    console.error('Error in /explain:', error.message);
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'An error occurred while processing your request'
    });
  }
});

/**
 * GET /health - Health check
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    gemini_configured: !!GEMINI_API_KEY
  });
});

// Export app for Vercel serverless functions
module.exports = app;

// Start server only if not in Vercel environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`exply backend server running on port ${PORT}`);
    console.log(`Gemini Model: ${GEMINI_MODEL}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}
