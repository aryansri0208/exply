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
   * Call backend API for explanation
   * @param {Object} context - Context object with highlighted text and surrounding content
   * @param {string} followUpQuestion - Optional follow-up question
   * @param {string} mode - Explanation mode: 'explain', 'simplify', or 'implication'
   * @param {string} language - Language code for response (e.g., 'en', 'es', 'fr')
   * @returns {Promise<string>} Explanation text from the backend
   */
  async function getExplanation(context, followUpQuestion = null, mode = 'explain', language = 'en') {
    try {
      const response = await fetch(BACKEND_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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
