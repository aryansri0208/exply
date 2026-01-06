// Options page script for API key management

const API_KEY_STORAGE_KEY = 'ai_explainer_api_key';
const LANGUAGE_STORAGE_KEY = 'ai_explainer_language';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('options-form');
  const apiKeyInput = document.getElementById('api-key');
  const languageSelect = document.getElementById('language');
  const statusDiv = document.getElementById('status');

  // Load saved settings
  chrome.storage.sync.get([API_KEY_STORAGE_KEY, LANGUAGE_STORAGE_KEY], (result) => {
    if (result[API_KEY_STORAGE_KEY]) {
      apiKeyInput.value = result[API_KEY_STORAGE_KEY];
    }
    if (result[LANGUAGE_STORAGE_KEY]) {
      languageSelect.value = result[LANGUAGE_STORAGE_KEY];
    }
  });

  // Show status message
  function showStatus(message, isError = false) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${isError ? 'error' : 'success'}`;
    statusDiv.style.display = 'block';
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }

  // Handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const apiKey = apiKeyInput.value.trim();
    const language = languageSelect.value;
    
    if (!apiKey) {
      showStatus('Please enter an API key', true);
      return;
    }

    chrome.storage.sync.set({ 
      [API_KEY_STORAGE_KEY]: apiKey,
      [LANGUAGE_STORAGE_KEY]: language
    }, () => {
      if (chrome.runtime.lastError) {
        showStatus('Error saving settings: ' + chrome.runtime.lastError.message, true);
      } else {
        showStatus('Settings saved successfully!');
      }
    });
  });
});
