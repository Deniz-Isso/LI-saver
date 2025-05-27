// API Key Settings für Professional Post Saver
// Verwaltet die OpenAI API-Schlüssel Einstellungen

import * as AIService from '../utils/ai-service.js';

let openaiApiKeyInput;
let toggleApiKeyBtn;
let saveApiKeyBtn;
let clearApiKeyBtn;
let apiKeyStatus;
let apiKeyStatusIndicator;
let tabSettings;

// Initialize DOM elements
function initElements() {
  openaiApiKeyInput = document.getElementById('openai-api-key');
  toggleApiKeyBtn = document.getElementById('toggle-api-key');
  saveApiKeyBtn = document.getElementById('save-api-key');
  clearApiKeyBtn = document.getElementById('clear-api-key');
  apiKeyStatus = document.getElementById('api-key-status');
  apiKeyStatusIndicator = document.getElementById('api-key-status-indicator');
  tabSettings = document.getElementById('tab-settings');
}

function setupApiKeySettings() {
  if (!saveApiKeyBtn || !clearApiKeyBtn || !openaiApiKeyInput) return;

  // Save API Key Event
  saveApiKeyBtn.addEventListener('click', async () => {
    const apiKey = openaiApiKeyInput.value.trim();
    
    if (!apiKey) {
      showApiKeyStatus('error', 'Bitte geben Sie einen API-Schlüssel ein.');
      return;
    }
    
    try {
      if (AIService && typeof AIService.setApiKey === 'function') {
        await AIService.setApiKey(apiKey);
      } else {
        // Fallback: Direkt im Chrome Storage speichern
        await chrome.storage.local.set({ openaiApiKey: apiKey });
      }
      
      showApiKeyStatus('success', 'API-Schlüssel erfolgreich gespeichert!');
      updateApiKeyStatusIndicator(true);
      
      // Verstecke den API Key nach dem Speichern
      openaiApiKeyInput.type = 'password';
      if (toggleApiKeyBtn) {
        toggleApiKeyBtn.innerHTML = '<span class="material-icons-round">visibility</span>';
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      showApiKeyStatus('error', 'Fehler beim Speichern des API-Schlüssels: ' + error.message);
    }
  });

  // Clear API Key Event
  clearApiKeyBtn.addEventListener('click', async () => {
    if (confirm('Möchten Sie den gespeicherten API-Schlüssel wirklich löschen?')) {
      try {
        await chrome.storage.local.remove(['openaiApiKey']);
        openaiApiKeyInput.value = '';
        showApiKeyStatus('info', 'API-Schlüssel wurde gelöscht.');
        updateApiKeyStatusIndicator(false);
      } catch (error) {
        console.error('Error clearing API key:', error);
        showApiKeyStatus('error', 'Fehler beim Löschen des API-Schlüssels.');
      }
    }
  });

  // Toggle API Key Visibility
  if (toggleApiKeyBtn) {
    toggleApiKeyBtn.addEventListener('click', () => {
      if (openaiApiKeyInput.type === 'password') {
        openaiApiKeyInput.type = 'text';
        toggleApiKeyBtn.innerHTML = '<span class="material-icons-round">visibility_off</span>';
      } else {
        openaiApiKeyInput.type = 'password';
        toggleApiKeyBtn.innerHTML = '<span class="material-icons-round">visibility</span>';
      }
    });
  }
}

async function loadSavedApiKey() {
  try {
    const result = await chrome.storage.local.get(['openaiApiKey']);
    const hasApiKey = !!result.openaiApiKey;
    
    if (hasApiKey && openaiApiKeyInput) {
      openaiApiKeyInput.placeholder = '••••••••••••••••';
    }
    
    updateApiKeyStatusIndicator(hasApiKey);
    
    if (hasApiKey) {
      showApiKeyStatus('success', 'API-Schlüssel ist konfiguriert.');
    } else {
      showApiKeyStatus('info', 'Kein API-Schlüssel konfiguriert.');
    }
  } catch (error) {
    console.error('Error loading API key:', error);
    showApiKeyStatus('error', 'Fehler beim Laden der API-Einstellungen.');
  }
}

function showApiKeyStatus(type, message) {
  if (!apiKeyStatus) return;
  
  apiKeyStatus.className = `status-message ${type}`;
  apiKeyStatus.textContent = message;
  apiKeyStatus.style.display = 'block';
  
  // Hide message after 5 seconds for success/error
  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      if (apiKeyStatus) {
        apiKeyStatus.style.display = 'none';
      }
    }, 5000);
  }
}

function updateApiKeyStatusIndicator(hasKey) {
  if (!apiKeyStatusIndicator) return;
  
  if (hasKey) {
    apiKeyStatusIndicator.className = 'status-indicator success';
    apiKeyStatusIndicator.title = 'API-Schlüssel ist konfiguriert';
  } else {
    apiKeyStatusIndicator.className = 'status-indicator error';
    apiKeyStatusIndicator.title = 'Kein API-Schlüssel konfiguriert';
  }
}

async function initApiKeySettings() {
  console.log('Initializing API Key Settings...');
  initElements();
  setupApiKeySettings();
  await loadSavedApiKey();
  console.log('API Key Settings initialized.');
}

// Export functions
window.ApiKeySettings = {
  initApiKeySettings,
  showApiKeyStatus,
  updateApiKeyStatusIndicator,
  loadSavedApiKey
};

export { initApiKeySettings, showApiKeyStatus, updateApiKeyStatusIndicator, loadSavedApiKey };