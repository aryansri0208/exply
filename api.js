// exply - API Module
// Handles all API interactions with Google Gemini

(function() {
  'use strict';

  // API Configuration
  const GEMINI_MODEL = 'gemini-2.5-flash';
  const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const API_KEY_STORAGE_KEY = 'ai_explainer_api_key';

  // Language name mapping
  const LANGUAGE_NAMES = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    ru: 'Russian',
    ar: 'Arabic',
    hi: 'Hindi'
  };

  /**
   * Build explanation prompt based on context, mode, and language
   * @param {Object} context - Context object with highlighted text and surrounding content
   * @param {string} mode - Explanation mode: 'explain', 'simplify', or 'implication'
   * @param {string} language - Language code (e.g., 'en', 'es', 'fr')
   * @returns {string} Formatted prompt for the API
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
   * Call Google Gemini API for explanation
   * @param {string} apiKey - Google Gemini API key
   * @param {Object} context - Context object with highlighted text and surrounding content
   * @param {string} followUpQuestion - Optional follow-up question
   * @param {string} mode - Explanation mode: 'explain', 'simplify', or 'implication'
   * @param {string} language - Language code for response (e.g., 'en', 'es', 'fr')
   * @returns {Promise<string>} Explanation text from the API
   */
  async function getExplanation(apiKey, context, followUpQuestion = null, mode = 'explain', language = 'en') {
    if (!apiKey) {
      throw new Error('API key is required');
    }

    const systemInstruction = 'You are a helpful assistant that explains text in context. Be concise, factual, and context-aware.';
    
    const prompt = followUpQuestion 
      ? `Follow-up question about the previously highlighted text "${context.highlightedText}": ${followUpQuestion}\n\nContext and language requirements:\n${buildExplanationPrompt(context, mode, language)}\n\nAnswer only this specific question briefly, staying within the original context. Respond entirely in ${LANGUAGE_NAMES[language] || 'English'}.`
      : buildExplanationPrompt(context, mode, language);

    const fullPrompt = `${systemInstruction}\n\n${prompt}`;

    try {
      const url = `${API_ENDPOINT}?key=${encodeURIComponent(apiKey)}`;
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
        throw new Error(`API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response format from API');
      }

      const candidate = data.candidates[0];
      const parts = candidate.content.parts || [];
      const fullText = parts.map(part => part.text || '').join('');
      
      // Check if response was cut off
      if (candidate.finishReason === 'MAX_TOKENS') {
        console.warn('Response was truncated due to token limit');
      }
      
      return fullText || 'No explanation provided.';
    } catch (error) {
      console.error('Error fetching explanation:', error);
      throw error;
    }
  }

  /**
   * Get API key from Chrome storage
   * @returns {Promise<string|null>} API key or null if not set
   */
  async function getApiKey() {
    return new Promise((resolve) => {
      chrome.storage.sync.get([API_KEY_STORAGE_KEY], (result) => {
        resolve(result[API_KEY_STORAGE_KEY] || null);
      });
    });
  }

  /**
   * Save API key to Chrome storage
   * @param {string} apiKey - API key to save
   * @returns {Promise<void>}
   */
  async function saveApiKey(apiKey) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({ [API_KEY_STORAGE_KEY]: apiKey }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  // Export API functions (attach to window for content script access)
  window.ExplyAPI = {
    getExplanation,
    buildExplanationPrompt,
    getApiKey,
    saveApiKey,
    API_KEY_STORAGE_KEY,
    LANGUAGE_NAMES
  };

})();
