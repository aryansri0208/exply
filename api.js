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
        }
      });
    } catch (e) {
      // Ignore storage errors; we'll just require the user to log in again
      // no-op
    }
  }

  // Helper function to save token to storage
  function saveTokenToStorage(token) {
    cachedSupabaseToken = token;
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      try {
        chrome.storage.sync.set({ [TOKEN_STORAGE_KEY]: token || '' }, () => {
          if (chrome.runtime && chrome.runtime.lastError) {
            // no-op
          }
        });
      } catch (e) {
        // no-op
      }
    }
  }

  // Inject a script into the page context that can access window.explySupabase
  // This script runs in the page's context, not the content script's isolated world
  function injectTokenBridgeScript() {
    // Check if we've already injected the script
    if (document.getElementById('exply-token-bridge-script')) {
      return;
    }

    const script = document.createElement('script');
    script.id = 'exply-token-bridge-script';
    script.textContent = `
      (function() {
        // This code runs in the page context, so it can access window.explySupabase
        function checkAndBroadcastToken() {
          try {
            // Check if Supabase client is available on the page
            const supabase = window.explySupabase || (window.supabase && typeof window.supabase.createClient === 'function' ? null : null);
            
            if (supabase && typeof supabase.auth !== 'undefined') {
              supabase.auth.getSession().then(({ data: { session }, error }) => {
                if (!error && session && session.access_token) {
                  // Post message that content script can receive
                  window.postMessage({
                    source: 'exply-page-bridge',
                    type: 'SUPABASE_TOKEN',
                    token: session.access_token
                  }, '*');
                }
              }).catch(() => {
                // Ignore errors
              });
            }
          } catch (e) {
            // Ignore errors
          }
        }

        // Check immediately
        checkAndBroadcastToken();

        // Also listen for messages from the page's auth.js
        window.addEventListener('message', function(event) {
          if (event.data && event.data.source === 'exply-web' && event.data.type === 'SUPABASE_TOKEN') {
            // Forward to content script
            window.postMessage({
              source: 'exply-page-bridge',
              type: 'SUPABASE_TOKEN',
              token: event.data.token
            }, '*');
          }
        });

        // Periodically check for token (in case user logs in after page load)
        setInterval(checkAndBroadcastToken, 5000);
      })();
    `;
    (document.head || document.documentElement).appendChild(script);
    script.remove(); // Remove the script tag but keep the code running
  }

  // Inject the bridge script
  if (document.head || document.documentElement) {
    injectTokenBridgeScript();
  } else {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectTokenBridgeScript);
    } else {
      setTimeout(injectTokenBridgeScript, 100);
    }
  }

  // Listen for token broadcasts from both the website and the injected bridge script
  window.addEventListener('message', (event) => {
    if (!event || !event.data) return;

    const { source, type, token } = event.data;
    
    // Accept messages from both the website (exply-web) and our injected bridge (exply-page-bridge)
    if ((source === 'exply-web' || source === 'exply-page-bridge') && type === 'SUPABASE_TOKEN') {
      const hasToken = typeof token === 'string' && token.length > 0;
      saveTokenToStorage(hasToken ? token : null);
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
          resolve(hasToken ? token : null);
        }
      }

      window.addEventListener('message', handleMessage);

      // Ask the page for the token
      try {
        window.postMessage({ source: 'exply-extension', type: 'GET_SUPABASE_TOKEN' }, '*');
      } catch (e) {
        // no-op
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
        throw new Error('Please log in to your Exply account on the official website once, then try again.');
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

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
        
        if (response.status === 400) {
          throw new Error(errorData.message || 'Invalid request. Please check your input.');
        } else if (response.status === 401) {
          // Clear cached token on auth failure so the user is asked to log in again
          cachedSupabaseToken = null;
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            try {
              chrome.storage.sync.set({ [TOKEN_STORAGE_KEY]: '' }, () => {
                if (chrome.runtime && chrome.runtime.lastError) {
                  // no-op
                }
              });
            } catch (e) {
              // no-op
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
      
      throw error;
    }
  }

  // Export API functions (attach to window for content script access)
  window.ExplyAPI = {
    getExplanation,
    LANGUAGE_NAMES
  };

})();
