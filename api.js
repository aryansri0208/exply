// exply - API Module
// Thin client that calls backend API (API key handled server-side)

(function() {
  'use strict';

  // Backend API Configuration
  // TODO: Update this to your deployed backend URL
  // For development: http://localhost:3000
  // For production: https://your-backend-domain.com
  const BACKEND_URL = 'https://exply.vercel.app'; // Change this to your backend URL (no trailing slash)
  const BACKEND_ENDPOINT = `${BACKEND_URL}/explain`;

  // Storage key for Supabase access token cached from the website
  const TOKEN_STORAGE_KEY = 'exply_supabase_token';

  // In-memory cache of the Supabase token so we don't hit storage on every request
  let cachedSupabaseToken = null;

  // Load token from chrome.storage (if available) on startup
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    try {
      chrome.storage.sync.get([TOKEN_STORAGE_KEY], (result) => {
        if (result && typeof result[TOKEN_STORAGE_KEY] === 'string' && result[TOKEN_STORAGE_KEY].length > 0) {
          cachedSupabaseToken = result[TOKEN_STORAGE_KEY];
          console.log('[Exply] Loaded Supabase token from storage (length):', cachedSupabaseToken.length);
        }
      });
    } catch (e) {
      // Ignore storage errors; we'll just require the user to log in again
      console.warn('[Exply] Failed to load Supabase token from storage:', e);
    }
  }

  // Listen for Supabase token broadcasts from the Exply website.
  // The website (auth.js) posts messages like:
  //   { source: 'exply-web', type: 'SUPABASE_TOKEN', token: '...' }
  window.addEventListener('message', (event) => {
    if (!event || !event.data) return;

    const { source, type, token } = event.data;
    if (source === 'exply-web' && type === 'SUPABASE_TOKEN') {
      const hasToken = typeof token === 'string' && token.length > 0;
      console.log('[Exply] Received Supabase token broadcast from website - hasToken:', hasToken);

      cachedSupabaseToken = hasToken ? token : null;

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        try {
          chrome.storage.sync.set({ [TOKEN_STORAGE_KEY]: cachedSupabaseToken || '' }, () => {
            if (chrome.runtime && chrome.runtime.lastError) {
              console.warn('[Exply] Failed to save Supabase token to storage:', chrome.runtime.lastError.message);
            }
          });
        } catch (e) {
          console.warn('[Exply] Error saving Supabase token to storage:', e);
        }
      }
    }
  });

  // Language name mapping (for reference, not used in API calls)
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
   * NOTE: Legacy helper (no longer used).
   * We now rely on the website broadcasting SUPABASE_TOKEN messages
   * which are cached by this content script.
   */
  function getSupabaseTokenFromPage(timeoutMs = 3000) {
    return new Promise((resolve) => {
      let resolved = false;

      function handleMessage(event) {
        if (!event || !event.data) return;
        const { source, type, token } = event.data;
        if (source === 'exply-web' && type === 'SUPABASE_TOKEN') {
          resolved = true;
          window.removeEventListener('message', handleMessage);
          const hasToken = typeof token === 'string' && token.length > 0;
          console.log('[Exply] Bridge response from page - hasToken:', hasToken);
          resolve(hasToken ? token : null);
        }
      }

      window.addEventListener('message', handleMessage);

      // Ask the page for the token
      try {
        console.log('[Exply] Requesting Supabase token from page via postMessage');
        window.postMessage({ source: 'exply-extension', type: 'GET_SUPABASE_TOKEN' }, '*');
      } catch (e) {
        console.warn('[Exply] Failed to request Supabase token from page:', e);
      }

      // Fallback if no response within timeout
      setTimeout(() => {
        if (!resolved) {
          window.removeEventListener('message', handleMessage);
          resolve(null);
        }
      }, timeoutMs);
    });
  }

  /**
   * Call backend API for explanation
   * @param {Object} context - Context object with highlighted text and surrounding content
   * @param {string} followUpQuestion - Optional follow-up question
   * @param {string} mode - Explanation mode: 'explain', 'simplify', or 'implication'
   * @param {string} language - Language code for response (e.g., 'en', 'es', 'fr')
   * @returns {Promise<string>} Explanation text from the backend
   */
  async function getExplanation(context, followUpQuestion = null, mode = 'explain', language = 'en') {
    try {
      const token = cachedSupabaseToken;

      // Authentication is mandatory - check if token is available
      if (!token) {
        console.warn('[Exply] No Supabase token available. User may not be logged in on the Exply website.');
        throw new Error('Please log in to your Exply account on the official website once, then try again.');
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      console.log('[Exply] Sending /explain request with Authorization header length:', headers['Authorization']?.length || 0);

      const response = await fetch(BACKEND_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text: context.highlightedText,
          mode: mode,
          context: context,
          target_language: language,
          followUpQuestion: followUpQuestion || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Exply] Backend error status:', response.status, 'body:', errorData);
        
        if (response.status === 400) {
          throw new Error(errorData.message || 'Invalid request. Please check your input.');
        } else if (response.status === 401) {
          // Clear cached token on auth failure so the user is asked to log in again
          cachedSupabaseToken = null;
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            try {
              chrome.storage.sync.set({ [TOKEN_STORAGE_KEY]: '' }, () => {
                if (chrome.runtime && chrome.runtime.lastError) {
                  console.warn('[Exply] Failed to clear Supabase token from storage:', chrome.runtime.lastError.message);
                }
              });
            } catch (e) {
              console.warn('[Exply] Error clearing Supabase token from storage:', e);
            }
          }
          throw new Error(errorData.message || 'Please log in to your account to use explanations.');
        } else if (response.status === 500) {
          throw new Error(errorData.message || 'Server error. Please try again later.');
        } else {
          throw new Error(errorData.message || 'An error occurred while processing your request');
        }
      }

      const data = await response.json();
      
      if (!data.result) {
        throw new Error('Invalid response format from server');
      }
      
      return data.result;
    } catch (error) {
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      console.error('Error fetching explanation:', error);
      throw error;
    }
  }

  // Export API functions (attach to window for content script access)
  window.ExplyAPI = {
    getExplanation,
    LANGUAGE_NAMES
  };

})();
