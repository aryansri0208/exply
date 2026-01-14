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
   * Get Supabase JWT from the page via postMessage bridge.
   * The website should listen for:
   *   window.addEventListener('message', (event) => {
   *     if (event.source !== window) return;
   *     if (event.data?.source === 'exply-extension' && event.data?.type === 'GET_SUPABASE_TOKEN') {
   *       const token = /* read from your auth client / session *\/;
   *       window.postMessage({ source: 'exply-web', type: 'SUPABASE_TOKEN', token }, '*');
   *     }
   *   });
   *
   * If no token is available or the bridge is not present, this resolves to null.
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
      const token = await getSupabaseTokenFromPage().catch(() => null);

      // Authentication is mandatory - check if token is available
      if (!token) {
        console.warn('[Exply] No Supabase token received from page. User may not be logged in or bridge script is missing.');
        throw new Error('Please log in to your account to use explanations. Make sure you are logged in on the website where you installed the extension.');
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
