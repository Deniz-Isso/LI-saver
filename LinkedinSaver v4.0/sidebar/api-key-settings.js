// API Key Settings für Professional Post Saver
// Verwaltet die OpenAI API-Schlüssel Einstellungen

import * as AIService from '../utils/ai-service.js'; // Hinzugefügt

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
      // Korrekte Verwendung des importierten AIService
      await AIService.setApiKey(apiKey);
      showApiKeyStatus('success', 'API-Schlüssel erfolgreich gespeichert.');
      updateApiKeyStatusIndicator(true);
    } catch (error) {
      console.error('Error saving API key:', error);
      showApiKeyStatus('error', 'Fehler beim Speichern des API-Schlüssels: ' + error.message);
    }
  });

  // Clear API key
  clearApiKeyBtn.addEventListener('click', async () => {
    openaiApiKeyInput.value = '';
    try {
      // Korrekte Verwendung des importierten AIService
      await AIService.setApiKey(null);
      showApiKeyStatus('info', 'API-Schlüssel wurde gelöscht.');
      updateApiKeyStatusIndicator(false);
    } catch (error) {
      console.error('Error clearing API key:', error);
      showApiKeyStatus('error', 'Fehler beim Löschen des API-Schlüssels: ' + error.message);
    }
  });
}

async function loadSavedApiKey() {
  try {
    const result = await chrome.storage.local.get(['openaiApiKey']);
    const apiKey = result.openaiApiKey;
    if (openaiApiKeyInput) {
      openaiApiKeyInput.value = apiKey || '';
      updateApiKeyStatusIndicator(!!apiKey);
    }
    if (apiKey) {
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
// Exportiere nur die initApiKeySettings Funktion
export {
  initApiKeySettings
};