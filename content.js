// exply - Content Script
// Handles text selection, UI display, and API integration

(function() {
  'use strict';

  // Detect if we're in a PDF viewer context
  function isPDFViewer() {
    try {
      // Check for Chrome's PDF viewer or PDF.js
      return window.location.protocol === 'chrome-extension:' ||
             document.querySelector('embed[type="application/pdf"]') !== null ||
             document.querySelector('object[type="application/pdf"]') !== null ||
             window.location.href.toLowerCase().endsWith('.pdf') ||
             document.contentType === 'application/pdf' ||
             document.querySelector('#viewer') !== null || // PDF.js viewer
             document.querySelector('.pdfViewer') !== null || // PDF.js
             window.location.href.includes('pdfjs') ||
             (window.parent !== window && (() => {
               try {
                 return window.parent.location.href.toLowerCase().endsWith('.pdf');
               } catch (e) {
                 // Cross-origin iframe - can't access parent location
                 return false;
               }
             })());
    } catch (e) {
      // If we can't access location, assume not a PDF viewer
      return false;
    }
  }

  // Skip if we're in an iframe that's not the main frame (unless it's a PDF viewer)
  if (window.self !== window.top && !isPDFViewer()) {
    return; // Don't run in non-PDF iframes
  }

  // Configuration
  const MIN_SELECTION_LENGTH = 8;
  const LANGUAGE_STORAGE_KEY = 'ai_explainer_language';
  
  // API module should be loaded before this script (via manifest.json)
  if (!window.ExplyAPI) {
    // no-op
  }

  let selectedText = '';
  let selectionRange = null;
  let floatingButton = null;
  let explanationCard = null;
  let cachedContext = null; // Store context for mode switching
  let currentMode = 'explain'; // Current explanation mode
  let translationObserver = null; // MutationObserver to prevent auto-translation
  let currentLanguage = 'en'; // Current UI/response language
  let isUpdatingLanguage = false; // Flag to prevent concurrent language updates
  let translationPreventionInterval = null; // Store interval reference for cleanup
  
  // UI text translations
  const UI_TEXTS = {
    en: {
      title: 'What this means here',
      explain: 'Explain',
      simplify: 'Simplify',
      implication: 'So what?',
      loading: 'Analyzing...',
      followupPlaceholder: 'Ask a follow-up (optional)',
      ask: 'Ask',
      close: '×',
      button: 'Exply\'s Explanation'
    },
    es: {
      title: 'Qué significa esto aquí',
      explain: 'Explicar',
      simplify: 'Simplificar',
      implication: '¿Y qué?',
      loading: 'Analizando...',
      followupPlaceholder: 'Haz una pregunta de seguimiento (opcional)',
      ask: 'Preguntar',
      close: '×',
      button: 'Explicación de Exply'
    },
    fr: {
      title: 'Ce que cela signifie ici',
      explain: 'Expliquer',
      simplify: 'Simplifier',
      implication: 'Et alors?',
      loading: 'Analyse en cours...',
      followupPlaceholder: 'Poser une question de suivi (optionnel)',
      ask: 'Demander',
      close: '×',
      button: 'Explication d\'Exply'
    },
    de: {
      title: 'Was das hier bedeutet',
      explain: 'Erklären',
      simplify: 'Vereinfachen',
      implication: 'Na und?',
      loading: 'Analysiere...',
      followupPlaceholder: 'Eine Nachfrage stellen (optional)',
      ask: 'Fragen',
      close: '×',
      button: 'Explys Erklärung'
    },
    it: {
      title: 'Cosa significa qui',
      explain: 'Spiegare',
      simplify: 'Semplificare',
      implication: 'E quindi?',
      loading: 'Analisi in corso...',
      followupPlaceholder: 'Fai una domanda di follow-up (opzionale)',
      ask: 'Chiedi',
      close: '×',
      button: 'Spiegazione di Exply'
    },
    pt: {
      title: 'O que isso significa aqui',
      explain: 'Explicar',
      simplify: 'Simplificar',
      implication: 'E daí?',
      loading: 'Analisando...',
      followupPlaceholder: 'Faça uma pergunta de acompanhamento (opcional)',
      ask: 'Perguntar',
      close: '×',
      button: 'Explicação do Exply'
    },
    zh: {
      title: '这里的意思',
      explain: '解释',
      simplify: '简化',
      implication: '那又怎样？',
      loading: '分析中...',
      followupPlaceholder: '提出后续问题（可选）',
      ask: '提问',
      close: '×',
      button: 'Exply的解释'
    },
    ja: {
      title: 'ここでの意味',
      explain: '説明',
      simplify: '簡略化',
      implication: 'だから何？',
      loading: '分析中...',
      followupPlaceholder: 'フォローアップの質問をする（オプション）',
      ask: '質問',
      close: '×',
      button: 'Explyの説明'
    },
    ko: {
      title: '여기서의 의미',
      explain: '설명',
      simplify: '단순화',
      implication: '그래서 뭐?',
      loading: '분석 중...',
      followupPlaceholder: '후속 질문하기 (선택사항)',
      ask: '질문',
      close: '×',
      button: 'Exply의 설명'
    },
    ru: {
      title: 'Что это здесь означает',
      explain: 'Объяснить',
      simplify: 'Упростить',
      implication: 'И что?',
      loading: 'Анализ...',
      followupPlaceholder: 'Задать уточняющий вопрос (необязательно)',
      ask: 'Спросить',
      close: '×',
      button: 'Объяснение Exply'
    },
    ar: {
      title: 'ماذا يعني هذا هنا',
      explain: 'شرح',
      simplify: 'تبسيط',
      implication: 'إذن ماذا؟',
      loading: 'جارٍ التحليل...',
      followupPlaceholder: 'اطرح سؤالاً متابعة (اختياري)',
      ask: 'اسأل',
      close: '×',
      button: 'شرح Exply'
    },
    hi: {
      title: 'यहाँ इसका क्या अर्थ है',
      explain: 'समझाएँ',
      simplify: 'सरल बनाएँ',
      implication: 'तो क्या?',
      loading: 'विश्लेषण कर रहे हैं...',
      followupPlaceholder: 'एक अनुवर्ती प्रश्न पूछें (वैकल्पिक)',
      ask: 'पूछें',
      close: '×',
      button: 'Exply का स्पष्टीकरण'
    }
  };

  // Get UI text for current language
  function getUIText(key) {
    return UI_TEXTS[currentLanguage]?.[key] || UI_TEXTS.en[key] || key;
  }

  // Initialize: Load language from storage
  // Set default language immediately to prevent issues
  currentLanguage = 'en';
  
  chrome.storage.sync.get([LANGUAGE_STORAGE_KEY], (result) => {
    currentLanguage = result[LANGUAGE_STORAGE_KEY] || 'en';
    updateUIForLanguage();
  });

  // Listen for language changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes[LANGUAGE_STORAGE_KEY]) {
      currentLanguage = changes[LANGUAGE_STORAGE_KEY].newValue || 'en';
      updateUIForLanguage();
    }
  });

  // Update UI elements for current language
  function updateUIForLanguage() {
    // Update floating button if it exists
    if (floatingButton) {
      const icon = document.createTextNode('💡 ');
      const text = document.createTextNode(getUIText('button'));
      floatingButton.innerHTML = '';
      floatingButton.setAttribute('lang', currentLanguage);
      floatingButton.appendChild(icon);
      floatingButton.appendChild(text);
    }
    
    // Update explanation card if it exists
    if (explanationCard) {
      explanationCard.setAttribute('lang', currentLanguage);
      explanationCard.setAttribute('data-lang', currentLanguage);
      
      const title = explanationCard.querySelector('h3');
      if (title) {
        title.textContent = getUIText('title');
        title.setAttribute('lang', currentLanguage);
      }
      
      const modeButtons = explanationCard.querySelectorAll('.mode-btn');
      modeButtons.forEach(btn => {
        const mode = btn.getAttribute('data-mode');
        if (mode) {
          btn.textContent = getUIText(mode);
          btn.setAttribute('lang', currentLanguage);
        }
      });
      
      const loading = explanationCard.querySelector('.loading');
      if (loading) {
        loading.textContent = getUIText('loading');
        loading.setAttribute('lang', currentLanguage);
      }
      
      const input = explanationCard.querySelector('.followup-input');
      if (input) {
        input.placeholder = getUIText('followupPlaceholder');
        input.setAttribute('lang', currentLanguage);
      }
      
      const submitBtn = explanationCard.querySelector('.followup-submit');
      if (submitBtn) {
        submitBtn.textContent = getUIText('ask');
        submitBtn.setAttribute('lang', currentLanguage);
      }
      
      const langSelect = explanationCard.querySelector('#ui-language');
      if (langSelect) {
        langSelect.value = currentLanguage;
        langSelect.setAttribute('lang', 'en'); // Language codes should always be in English
        langSelect.setAttribute('data-lang', 'en');
        // Restore option texts if they were translated (EN, ES, FR, etc. should never be translated)
        const options = langSelect.querySelectorAll('option');
        options.forEach(option => {
          const langCode = option.value;
          const correctLabel = langCode.toUpperCase();
          if (option.textContent !== correctLabel) {
            option.textContent = correctLabel;
          }
          option.setAttribute('translate', 'no');
          option.setAttribute('data-translate', 'no');
          option.setAttribute('lang', 'en');
        });
      }
    }
    
    // Don't call preventChromeTranslation here - it's already set up when card is created
    // Calling it multiple times creates duplicate observers/intervals causing hangs
  }
  
  // Aggressively prevent Chrome auto-translation
  function preventChromeTranslation(element) {
    if (!element) return;
    
    // Store correct texts
    const correctTexts = {
      title: getUIText('title'),
      explain: getUIText('explain'),
      simplify: getUIText('simplify'),
      implication: getUIText('implication'),
      loading: getUIText('loading'),
      followupPlaceholder: getUIText('followupPlaceholder'),
      ask: getUIText('ask'),
      close: getUIText('close')
    };
    
    // Function to restore correct texts
    const restoreTexts = () => {
      if (!document.body.contains(element)) return;
      
      const title = element.querySelector('h3');
      if (title && title.textContent !== correctTexts.title) {
        title.textContent = correctTexts.title;
      }
      
      const modeButtons = element.querySelectorAll('.mode-btn');
      modeButtons.forEach(btn => {
        const mode = btn.getAttribute('data-mode');
        const correctText = correctTexts[mode];
        if (correctText && btn.textContent !== correctText) {
          btn.textContent = correctText;
        }
      });
      
      const loading = element.querySelector('.loading');
      if (loading && loading.textContent !== correctTexts.loading) {
        loading.textContent = correctTexts.loading;
      }
      
      const input = element.querySelector('.followup-input');
      if (input && input.placeholder !== correctTexts.followupPlaceholder) {
        input.placeholder = correctTexts.followupPlaceholder;
      }
      
      const submitBtn = element.querySelector('.followup-submit');
      if (submitBtn && submitBtn.textContent !== correctTexts.ask) {
        submitBtn.textContent = correctTexts.ask;
      }
      
      // Restore language selector options (EN, ES, FR, etc. should never be translated)
      const langSelect = element.querySelector('#ui-language');
      if (langSelect) {
        const options = langSelect.querySelectorAll('option');
        options.forEach(option => {
          const langCode = option.value;
          const correctLabel = langCode.toUpperCase();
          if (option.textContent !== correctLabel) {
            option.textContent = correctLabel;
          }
        });
      }
    };
    
    // Restore immediately
    restoreTexts();
    
    // Set up MutationObserver to detect and revert translations
    const observer = new MutationObserver((mutations) => {
      let shouldRestore = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          shouldRestore = true;
        }
      });
      if (shouldRestore) {
        restoreTexts();
      }
    });
    
    observer.observe(element, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    // Also restore periodically (aggressive approach)
    const interval = setInterval(() => {
      if (!document.body.contains(element)) {
        clearInterval(interval);
        observer.disconnect();
        return;
      }
      restoreTexts();
    }, 200); // Check every 200ms
    
    // Clean up when element is removed
    const cleanupObserver = new MutationObserver(() => {
      if (!document.body.contains(element)) {
        clearInterval(interval);
        observer.disconnect();
        cleanupObserver.disconnect();
      }
    });
    cleanupObserver.observe(document.body, { childList: true, subtree: true });
  }

  // Extract bounded context around selection
  function extractContext(range) {
    const selectedText = range.toString().trim();
    
    // Get containing element
    const container = range.commonAncestorContainer;
    const containerElement = container.nodeType === Node.TEXT_NODE 
      ? container.parentElement 
      : container;

    // Get full text of container
    const containerText = containerElement.innerText || containerElement.textContent || '';

    // Find sentence boundaries
    const selectedIndex = containerText.indexOf(selectedText);
    const beforeText = containerText.substring(0, selectedIndex);
    const afterText = containerText.substring(selectedIndex + selectedText.length);

    // Extract sentence (simple heuristic: text between sentence-ending punctuation)
    const lastDot = beforeText.lastIndexOf('. ');
    const lastExcl = beforeText.lastIndexOf('! ');
    const lastQuest = beforeText.lastIndexOf('? ');
    const sentenceStart = Math.max(0, lastDot, lastExcl, lastQuest) + 1;
    
    const nextDot = afterText.indexOf('. ');
    const nextExcl = afterText.indexOf('! ');
    const nextQuest = afterText.indexOf('? ');
    const nextPunctIndexes = [nextDot, nextExcl, nextQuest].filter(idx => idx !== -1);
    const sentenceEnd = nextPunctIndexes.length > 0
      ? Math.min(...nextPunctIndexes) + selectedIndex + selectedText.length
      : containerText.length;
    
    const containingSentence = containerText.substring(sentenceStart, sentenceEnd).trim() || selectedText;

    // Get paragraph text (use container or parent)
    let paragraphElement = containerElement;
    while (paragraphElement && !['P', 'DIV', 'ARTICLE', 'SECTION'].includes(paragraphElement.tagName)) {
      paragraphElement = paragraphElement.parentElement;
    }
    const paragraphText = paragraphElement ? (paragraphElement.innerText || paragraphElement.textContent || '') : '';

    // Split paragraph into before/after
    const paraIndex = paragraphText.indexOf(selectedText);
    const prevParagraph = paragraphText.substring(0, paraIndex).trim();
    const nextParagraph = paragraphText.substring(paraIndex + selectedText.length).trim();

    // Safely get domain (may fail in some edge cases)
    let domain = 'unknown';
    try {
      domain = window.location.hostname || 'unknown';
    } catch (e) {
      // Cross-origin or other security restriction
      domain = 'unknown';
    }

    return {
      highlightedText: selectedText,
      containingSentence: containingSentence,
      previousParagraph: prevParagraph.split('\n').slice(-1)[0] || '', // Last line before selection
      nextParagraph: nextParagraph.split('\n')[0] || '', // First line after selection
      pageTitle: document.title,
      domain: domain
    };
  }

  // Get position for floating button near selection
  function getSelectionPosition() {
    if (!selectionRange || selectionRange.collapsed) return null;

    const rect = selectionRange.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY + 5,
      left: rect.left + window.scrollX,
      right: rect.right + window.scrollX,
      bottom: rect.bottom + window.scrollY,
      rect: rect // Include full rect for smart positioning
    };
  }

  // Smart positioning for explanation card to stay within viewport
  function getCardPosition(pos, cardElement) {
    // Fallback if we don't have a position or card element (e.g. card was closed)
    if (!pos || !cardElement) {
      return {
        top: pos ? pos.top : window.scrollY + 20,
        left: pos ? pos.left : window.scrollX + 20
      };
    }

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    
    // Estimate card dimensions (will be adjusted after render).
    // Guard against cases where the element has been detached.
    const cardHeight = (cardElement.offsetHeight || 400);
    const cardWidth = (cardElement.offsetWidth || 400);
    
    // Default: position below selection
    let top = pos.top;
    let left = pos.left;
    
    // Check if card would go off bottom of viewport
    const spaceBelow = viewportHeight - (pos.rect.bottom - scrollY);
    const spaceAbove = pos.rect.top - scrollY;
    
    if (spaceBelow < cardHeight && spaceAbove > spaceBelow) {
      // Position above selection instead
      top = pos.rect.top + scrollY - cardHeight - 5;
      // Ensure it doesn't go above viewport
      if (top < scrollY) {
        top = scrollY + 10;
      }
    } else {
      // Position below, but ensure it doesn't go off bottom
      const maxTop = scrollY + viewportHeight - cardHeight - 10;
      if (top > maxTop) {
        top = maxTop;
      }
    }
    
    // Check horizontal boundaries
    if (left + cardWidth > scrollX + viewportWidth) {
      // Shift left to fit
      left = scrollX + viewportWidth - cardWidth - 10;
    }
    if (left < scrollX + 10) {
      left = scrollX + 10;
    }
    
    return { top, left };
  }

  // Create floating button
  function createFloatingButton() {
    if (floatingButton) return;

    // Ensure currentLanguage is initialized
    if (!currentLanguage) {
      currentLanguage = 'en';
    }

    floatingButton = document.createElement('div');
    floatingButton.id = 'ai-explainer-button';
    floatingButton.setAttribute('translate', 'no'); // Prevent browser auto-translation
    floatingButton.setAttribute('lang', currentLanguage);
    floatingButton.setAttribute('data-translate', 'no'); // Additional prevention
    // Use textContent instead of innerHTML to prevent translation
    const icon = document.createTextNode('💡 ');
    const buttonText = getUIText('button') || 'Exply\'s Explanation';
    const text = document.createTextNode(buttonText);
    floatingButton.appendChild(icon);
    floatingButton.appendChild(text);
    
    // Use capture phase and multiple event types for better compatibility
    floatingButton.addEventListener('click', handleExplainClick, true);
    floatingButton.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    }, true);
    
    // Ensure button is on top
    floatingButton.style.zIndex = '999999';
    
    document.body.appendChild(floatingButton);
  }

  // Position and show floating button
  function showFloatingButton() {
    try {
      const pos = getSelectionPosition();
      if (!pos) {
        hideFloatingButton();
        return;
      }

      if (!floatingButton) {
        createFloatingButton();
      }

      if (!floatingButton) {
        // no-op
        return;
      }

      floatingButton.style.top = `${pos.top}px`;
      floatingButton.style.left = `${pos.left}px`;
      floatingButton.classList.add('visible');
    } catch (error) {
      // no-op
    }
  }

  // Hide floating button
  function hideFloatingButton() {
    if (floatingButton) {
      floatingButton.classList.remove('visible');
    }
  }


  // Trigger explanation (reusable for both click and keyboard shortcut)
  async function triggerExplanation() {

    // Check if we have a valid current selection
    const selection = window.getSelection();
    let currentRange = null;
    
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const text = range.toString().trim();
      if (text.length >= MIN_SELECTION_LENGTH) {
        currentRange = range.cloneRange();
        selectedText = text;
        selectionRange = currentRange;
      }
    }
    
    // If no valid current selection, check if we have a cached one
    if (!currentRange && selectionRange) {
      currentRange = selectionRange;
    }
    
    // If still no valid range, do nothing
    if (!currentRange) {
      return;
    }

    hideFloatingButton();
    
    const context = extractContext(currentRange);
    await showExplanationCard(context);
  }

  // Handle explain button click
  async function handleExplainClick(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    try {
      await triggerExplanation();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  // Wrapper function to get explanation using API module
  async function getExplanation(context, followUpQuestion = null, mode = 'explain') {
    return await window.ExplyAPI.getExplanation(
      context,
      followUpQuestion,
      mode,
      currentLanguage
    );
  }

  // Prevent and revert Chrome auto-translation
  function preventTranslation(element) {
    if (!element) return;
    
    // Create MutationObserver to detect and revert translations
    if (translationObserver) {
      translationObserver.disconnect();
    }
    
    translationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          const target = mutation.target;
          
          // Restore title text
          if (target.tagName === 'H3' && target.hasAttribute('data-original-text')) {
            const original = target.getAttribute('data-original-text');
            if (target.textContent !== original && target.textContent !== UI_TEXTS.title) {
              target.textContent = UI_TEXTS.title;
            }
          }
          
          // Restore button text
          if (target.tagName === 'BUTTON' && target.hasAttribute('data-mode')) {
            const mode = target.getAttribute('data-mode');
            const expectedText = UI_TEXTS[mode] || '';
            if (expectedText && target.textContent !== expectedText) {
              target.textContent = expectedText;
            }
          }
          
          // Restore loading text
          if (target.classList.contains('loading') && target.textContent !== UI_TEXTS.loading) {
            const original = target.getAttribute('data-original-text');
            if (original && target.textContent !== original) {
              target.textContent = original;
            }
          }
          
          // Restore submit button text
          if (target.classList.contains('followup-submit') && target.textContent !== UI_TEXTS.ask) {
            target.textContent = UI_TEXTS.ask;
          }
          
          // Restore input placeholder
          if (target.tagName === 'INPUT' && target.classList.contains('followup-input')) {
            if (target.placeholder !== UI_TEXTS.followupPlaceholder) {
              target.placeholder = UI_TEXTS.followupPlaceholder;
            }
          }
        }
      });
    });
    
    translationObserver.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: false
    });
    
    // Periodically restore text (aggressive approach)
    const restoreInterval = setInterval(() => {
      if (!document.body.contains(element)) {
        clearInterval(restoreInterval);
        if (translationObserver) {
          translationObserver.disconnect();
        }
        return;
      }
      
      // Restore title
      const title = element.querySelector('h3');
      if (title && title.textContent !== UI_TEXTS.title) {
        title.textContent = UI_TEXTS.title;
      }
      
      // Restore mode buttons
      const modeButtons = element.querySelectorAll('.mode-btn');
      modeButtons.forEach(btn => {
        const mode = btn.getAttribute('data-mode');
        const expectedText = UI_TEXTS[mode] || '';
        if (expectedText && btn.textContent !== expectedText) {
          btn.textContent = expectedText;
        }
      });
      
      // Restore loading text
      const loading = element.querySelector('.loading');
      if (loading && loading.textContent !== UI_TEXTS.loading) {
        const original = loading.getAttribute('data-original-text');
        if (original && loading.textContent !== original) {
          loading.textContent = original;
        } else if (!original) {
          loading.textContent = UI_TEXTS.loading;
        }
      }
      
      // Restore submit button
      const submitBtn = element.querySelector('.followup-submit');
      if (submitBtn && submitBtn.textContent !== UI_TEXTS.ask) {
        submitBtn.textContent = UI_TEXTS.ask;
      }
      
      // Restore input placeholder
      const input = element.querySelector('.followup-input');
      if (input && input.placeholder !== UI_TEXTS.followupPlaceholder) {
        input.placeholder = UI_TEXTS.followupPlaceholder;
      }
    }, 100); // Check every 100ms
    
    // Clean up interval when card is removed
    const cleanup = () => {
      clearInterval(restoreInterval);
      if (translationObserver) {
        translationObserver.disconnect();
      }
    };
    
    // Use MutationObserver to detect removal
    const removalObserver = new MutationObserver((mutations) => {
      if (!document.body.contains(element)) {
        cleanup();
        removalObserver.disconnect();
      }
    });
    
    removalObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Create explanation card
  function createExplanationCard() {
    const card = document.createElement('div');
    card.id = 'ai-explainer-card';
    card.setAttribute('translate', 'no');
    card.setAttribute('lang', currentLanguage);
    card.setAttribute('data-translate', 'no');
    card.setAttribute('data-lang', currentLanguage);
    
    // Build card using DOM methods
    const header = document.createElement('div');
    header.className = 'explainer-header';
    header.setAttribute('translate', 'no');
    header.setAttribute('lang', currentLanguage);
    
    const title = document.createElement('h3');
    title.textContent = getUIText('title');
    title.setAttribute('translate', 'no');
    title.setAttribute('lang', currentLanguage);
    
    const headerRight = document.createElement('div');
    headerRight.className = 'header-right';
    
    // Language selector
    const langSelect = document.createElement('select');
    langSelect.className = 'language-select';
    langSelect.id = 'ui-language';
    langSelect.setAttribute('translate', 'no');
    langSelect.setAttribute('data-translate', 'no');
    langSelect.setAttribute('lang', 'en'); // Always use English for language codes
    langSelect.setAttribute('data-lang', 'en');
    const languages = [
      {value: 'en', label: 'EN'},
      {value: 'es', label: 'ES'},
      {value: 'fr', label: 'FR'},
      {value: 'de', label: 'DE'},
      {value: 'it', label: 'IT'},
      {value: 'pt', label: 'PT'},
      {value: 'zh', label: 'ZH'},
      {value: 'ja', label: 'JA'},
      {value: 'ko', label: 'KO'},
      {value: 'ru', label: 'RU'},
      {value: 'ar', label: 'AR'},
      {value: 'hi', label: 'HI'}
    ];
    languages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.value;
      option.textContent = lang.label;
      option.selected = lang.value === currentLanguage;
      option.setAttribute('translate', 'no');
      option.setAttribute('data-translate', 'no');
      option.setAttribute('lang', 'en'); // Language codes should always be in English
      option.setAttribute('data-lang', 'en');
      langSelect.appendChild(option);
    });
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-button';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.setAttribute('translate', 'no');
    closeBtn.setAttribute('lang', currentLanguage);
    closeBtn.textContent = getUIText('close');
    
    headerRight.appendChild(langSelect);
    headerRight.appendChild(closeBtn);
    header.appendChild(title);
    header.appendChild(headerRight);
    
    const modes = document.createElement('div');
    modes.className = 'explainer-modes';
    modes.setAttribute('translate', 'no');
    modes.setAttribute('lang', currentLanguage);
    
    const modeButtons = [
      {mode: 'explain', active: true},
      {mode: 'simplify', active: false},
      {mode: 'implication', active: false}
    ];
    
    modeButtons.forEach(btn => {
      const button = document.createElement('button');
      button.className = `mode-btn${btn.active ? ' active' : ''}`;
      button.setAttribute('data-mode', btn.mode);
      button.setAttribute('translate', 'no');
      button.setAttribute('lang', currentLanguage);
      button.textContent = getUIText(btn.mode);
      modes.appendChild(button);
    });
    
    const content = document.createElement('div');
    content.className = 'explainer-content';
    content.setAttribute('translate', 'no');
    content.setAttribute('lang', currentLanguage);
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.setAttribute('translate', 'no');
    loading.setAttribute('lang', currentLanguage);
    loading.textContent = getUIText('loading');
    content.appendChild(loading);
    
    const followup = document.createElement('div');
    followup.className = 'explainer-followup';
    followup.style.display = 'none';
    followup.setAttribute('translate', 'no');
    followup.setAttribute('lang', currentLanguage);
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'followup-input';
    input.placeholder = getUIText('followupPlaceholder');
    input.setAttribute('translate', 'no');
    input.setAttribute('lang', currentLanguage);
    
    const submitBtn = document.createElement('button');
    submitBtn.className = 'followup-submit';
    submitBtn.setAttribute('translate', 'no');
    submitBtn.setAttribute('lang', currentLanguage);
    submitBtn.textContent = getUIText('ask');
    
    followup.appendChild(input);
    followup.appendChild(submitBtn);
    
    card.appendChild(header);
    card.appendChild(modes);
    card.appendChild(content);
    card.appendChild(followup);
    
    return card;
  }

  // Show explanation card
  async function showExplanationCard(context, followUpQuestion = null, mode = 'explain') {
    // Store context for mode switching
    if (!followUpQuestion) {
      cachedContext = context;
      currentMode = mode;
    }

    // Remove existing card if present (only if it's a new explanation, not a mode switch)
    if (explanationCard && followUpQuestion === null && mode === 'explain') {
      explanationCard.remove();
      explanationCard = null;
    }

    // Create card if it doesn't exist
    if (!explanationCard) {
      explanationCard = createExplanationCard();
      // Ensure card is on top (higher than WhatsApp Web's z-index)
      explanationCard.style.zIndex = '999999';
      document.body.appendChild(explanationCard);

      // Position card near selection with smart positioning
      const pos = getSelectionPosition();
      if (pos) {
        // Initial positioning
        const cardPos = getCardPosition(pos, explanationCard);
        explanationCard.style.top = `${cardPos.top}px`;
        explanationCard.style.left = `${cardPos.left}px`;
        
        // Adjust position after card is rendered and we know its actual size
        setTimeout(() => {
          if (!explanationCard) return; // Card was removed
          const actualCardPos = getCardPosition(pos, explanationCard);
          if (actualCardPos && explanationCard) {
            explanationCard.style.top = `${actualCardPos.top}px`;
            explanationCard.style.left = `${actualCardPos.left}px`;
          }
        }, 0);
      }

      // Close button handler
      const closeBtn = explanationCard.querySelector('.close-button');
      closeBtn.addEventListener('click', () => {
        explanationCard.remove();
        explanationCard = null;
        cachedContext = null;
      });

      // Click outside to close
      setTimeout(() => {
        document.addEventListener('click', function closeOnOutsideClick(e) {
          if (explanationCard && !explanationCard.contains(e.target) && !floatingButton?.contains(e.target)) {
            explanationCard.remove();
            explanationCard = null;
            cachedContext = null;
            document.removeEventListener('click', closeOnOutsideClick);
          }
        });
      }, 100);

      // Setup mode toggle handlers
      setupModeToggle();
      
      // Setup language selector
      setupLanguageSelector();
      
      // Set up translation prevention once when card is created
      preventChromeTranslation(explanationCard);
      
      // Force UI update to ensure correct language is displayed
      setTimeout(() => {
        updateUIForLanguage();
      }, 0);
      
      // Show follow-up section if not already a follow-up
      if (!followUpQuestion) {
        setupFollowUp(context);
      }
    } else {
      // Update mode buttons if card already exists
      updateModeButtons(mode);
      // Force UI update
      setTimeout(() => {
        updateUIForLanguage();
      }, 0);
    }

    // Get explanation
    const contentDiv = explanationCard.querySelector('.explainer-content');
    try {
      const loadingDiv = contentDiv.querySelector('.loading');
      if (loadingDiv) {
        loadingDiv.textContent = getUIText('loading');
      } else {
        const loading = document.createElement('div');
        loading.className = 'loading';
        loading.setAttribute('translate', 'no');
        loading.setAttribute('lang', currentLanguage);
        loading.textContent = getUIText('loading');
        contentDiv.innerHTML = '';
        contentDiv.appendChild(loading);
      }
      const explanation = await getExplanation(context, followUpQuestion, mode);
      contentDiv.innerHTML = formatExplanation(explanation);
      
      // Reposition card after content is loaded to ensure it stays visible
      const pos = getSelectionPosition();
      if (pos) {
        setTimeout(() => {
          if (!explanationCard) return; // Card was removed
          const actualCardPos = getCardPosition(pos, explanationCard);
          if (actualCardPos && explanationCard) {
            explanationCard.style.top = `${actualCardPos.top}px`;
            explanationCard.style.left = `${actualCardPos.left}px`;
          }
        }, 50);
      }
    } catch (error) {
      contentDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
  }

  // Setup language selector
  function setupLanguageSelector() {
    const langSelect = explanationCard.querySelector('#ui-language');
    if (!langSelect) return;
    
    // Set current value
    langSelect.value = currentLanguage;
    
    // Remove any existing listeners by cloning the element
    const newLangSelect = langSelect.cloneNode(true);
    langSelect.parentNode.replaceChild(newLangSelect, langSelect);
    
    // Set value again after cloning
    newLangSelect.value = currentLanguage;
    
    newLangSelect.addEventListener('change', async (e) => {
      const newLang = e.target.value;
      if (newLang === currentLanguage || isUpdatingLanguage) return;
      
      // Prevent concurrent updates
      isUpdatingLanguage = true;
      
      try {
        // Update current language immediately (before saving)
        currentLanguage = newLang;
        
        // Update UI elements directly (don't call updateUIForLanguage which triggers preventChromeTranslation)
        const title = explanationCard.querySelector('h3');
        if (title) title.textContent = getUIText('title');
        
        const modeButtons = explanationCard.querySelectorAll('.mode-btn');
        modeButtons.forEach(btn => {
          const mode = btn.getAttribute('data-mode');
          if (mode) btn.textContent = getUIText(mode);
        });
        
        const input = explanationCard.querySelector('.followup-input');
        if (input) input.placeholder = getUIText('followupPlaceholder');
        
        const submitBtn = explanationCard.querySelector('.followup-submit');
        if (submitBtn) submitBtn.textContent = getUIText('ask');
        
        // Save language preference to storage (this will persist for future sessions)
      chrome.storage.sync.set({ [LANGUAGE_STORAGE_KEY]: newLang }, () => {
        // If there's cached context, re-run explanation with new language
        // Use setTimeout to avoid blocking and allow UI to update first
        if (cachedContext && explanationCard) {
          setTimeout(async () => {
            try {
              // Only update the content, don't recreate the card
              const contentDiv = explanationCard.querySelector('.explainer-content');
              if (contentDiv) {
                contentDiv.innerHTML = '<div class="loading">' + getUIText('loading') + '</div>';
                const explanation = await getExplanation(cachedContext, null, currentMode);
                contentDiv.innerHTML = formatExplanation(explanation);
              }
            } catch (error) {
              const contentDiv = explanationCard.querySelector('.explainer-content');
              if (contentDiv) {
                contentDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
              }
            } finally {
              isUpdatingLanguage = false;
            }
          }, 100);
        } else {
          isUpdatingLanguage = false;
        }
      });
      } catch (error) {
        isUpdatingLanguage = false;
      }
    });
  }

  // Setup mode toggle functionality
  function setupModeToggle() {
    const modeButtons = explanationCard.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const newMode = e.target.dataset.mode;
        if (newMode === currentMode || !cachedContext) return;

        currentMode = newMode;
        updateModeButtons(newMode);
        
        // Re-run explanation with new mode using cached context
        await showExplanationCard(cachedContext, null, newMode);
      });
    });
  }

  // Update mode button active states
  function updateModeButtons(activeMode) {
    const modeButtons = explanationCard.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
      if (btn.dataset.mode === activeMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Format explanation text (convert markdown to HTML)
  function formatExplanation(text) {
    if (!text || !text.trim()) {
      return '<p>No explanation available.</p>';
    }

    // Helper to escape HTML (for security)
    const escapeHtml = (str) => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };

    // Process line by line
    const lines = text.split('\n').filter(line => line.trim());
    
    // Check if it's a list
    const isList = lines.some(line => {
      const trimmed = line.trim();
      return /^[-•*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed);
    });
    
    function processLine(line) {
      // Convert markdown bold (**text**) to HTML
      // Use a placeholder to protect our HTML tags during escaping
      const placeholders = [];
      let processed = line.replace(/\*\*(.+?)\*\*/g, (match, content) => {
        const placeholder = `__PLACEHOLDER_${placeholders.length}__`;
        placeholders.push(`<strong>${escapeHtml(content)}</strong>`);
        return placeholder;
      });
      
      // Escape remaining HTML
      processed = escapeHtml(processed);
      
      // Restore placeholders
      placeholders.forEach((html, index) => {
        processed = processed.replace(`__PLACEHOLDER_${index}__`, html);
      });
      
      return processed;
    }
    
    if (isList) {
      const listItems = lines.map(line => {
        const trimmed = line.trim();
        // Remove list marker (*, -, •, or number)
        let content = trimmed.replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, '');
        content = processLine(content);
        return `<li>${content}</li>`;
      });
      return `<ul>${listItems.join('')}</ul>`;
    } else {
      const paragraphs = lines.map(line => {
        const content = processLine(line);
        return `<p>${content}</p>`;
      });
      return paragraphs.join('');
    }
  }

  // Setup follow-up question functionality
  function setupFollowUp(context) {
    const followupDiv = explanationCard.querySelector('.explainer-followup');
    const input = followupDiv.querySelector('.followup-input');
    const submitBtn = followupDiv.querySelector('.followup-submit');
    
    followupDiv.style.display = 'block';

    const handleFollowUp = async () => {
      const question = input.value.trim();
      if (!question) return;

      input.disabled = true;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Asking...';

      const contentDiv = explanationCard.querySelector('.explainer-content');
      contentDiv.innerHTML = '<div class="loading">Analyzing follow-up...</div>';

      try {
        const answer = await getExplanation(context, question, currentMode);
        contentDiv.innerHTML = formatExplanation(answer);
        input.value = '';
        // Keep follow-up input visible for multiple questions
      } catch (error) {
        contentDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
      } finally {
        input.disabled = false;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Ask';
      }
    };

    submitBtn.addEventListener('click', handleFollowUp);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleFollowUp();
      }
    });
  }

  // Handle text selection
  function handleSelection() {
    try {
      const selection = window.getSelection();
      
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        hideFloatingButton();
        return;
      }

      const range = selection.getRangeAt(0);
      const text = range.toString().trim();

      if (text.length >= MIN_SELECTION_LENGTH) {
        selectedText = text;
        selectionRange = range.cloneRange();
        showFloatingButton();
      } else {
        hideFloatingButton();
      }
    } catch (error) {
      hideFloatingButton();
    }
  }

  // Handle keyboard shortcut
  function handleKeyboardShortcut(e) {
    // Detect platform: macOS uses Meta (Cmd), Windows/Linux use Ctrl
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifierKey = isMac ? e.metaKey : e.ctrlKey;
    
    // Check for Cmd+Shift+E (macOS) or Ctrl+Shift+E (Windows/Linux)
    // Use toLowerCase() to handle both 'e' and 'E'
    if (modifierKey && e.shiftKey && e.key.toLowerCase() === 'e') {
      // Don't trigger in input fields, textareas, or contenteditable elements
      const target = e.target;
      const isEditable = target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || 
                        target.isContentEditable;
      
      if (isEditable) {
        return; // Don't trigger in editable fields
      }
      
      e.preventDefault();
      e.stopPropagation();
      triggerExplanation();
    }
  }

  // Event listeners
  document.addEventListener('mouseup', handleSelection);
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Meta') {
      handleSelection();
    }
  });
  document.addEventListener('keydown', handleKeyboardShortcut);
  
  // Additional listener for PDF viewer compatibility
  // PDF.js uses selectionchange events for text selection
  document.addEventListener('selectionchange', () => {
    // Use a small delay to allow PDF viewer to update selection
    setTimeout(handleSelection, 50);
  });

  // For PDF viewers, also listen on the viewer element specifically
  if (isPDFViewer()) {
    // Wait for PDF viewer to be ready
    const setupPDFListeners = () => {
      const viewerElement = document.querySelector('#viewer') || 
                            document.querySelector('.pdfViewer') ||
                            document.querySelector('embed[type="application/pdf"]') ||
                            document.querySelector('body');
      
      if (viewerElement) {
        viewerElement.addEventListener('mouseup', handleSelection, true);
        viewerElement.addEventListener('selectionchange', () => {
          setTimeout(handleSelection, 100);
        }, true);
      }
    };
    
    // Try immediately and also after a delay
    setupPDFListeners();
    setTimeout(setupPDFListeners, 500);
    setTimeout(setupPDFListeners, 1500);
    
    // Also listen for PDF.js ready event
    document.addEventListener('pagesinit', setupPDFListeners, { once: true });
  }

  // Cleanup on scroll (hide button)
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    hideFloatingButton();
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(handleSelection, 150);
  });

})();
