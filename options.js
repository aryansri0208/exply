// Options page script for settings management

const LANGUAGE_STORAGE_KEY = 'ai_explainer_language';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('options-form');
  const languageSelect = document.getElementById('language');
  const statusDiv = document.getElementById('status');

  // Load saved settings
  chrome.storage.sync.get([LANGUAGE_STORAGE_KEY], (result) => {
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
    
    const language = languageSelect.value;

    chrome.storage.sync.set({ 
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
