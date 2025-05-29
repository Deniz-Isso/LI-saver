// Background script for the Professional Post Saver extension

// Initialize default categories and folders when extension is installed
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Professional Post Saver extension installed');
  
  try {
    // Initialize with default categories if none exist
    const result = await chrome.storage.local.get(['categories', 'folders']);
    
    if (!result.categories) {
      // Multi-language support - detect browser language
      const browserLang = navigator.language || navigator.userLanguage;
      const isGerman = browserLang.startsWith('de');
      
      const defaultCategories = isGerman ? [
        'Karriereentwicklung', 
        'Branchennews', 
        'Networking', 
        'Jobmöglichkeiten',
        'Technologietrends',
        'Weiterbildung',
        'Inspiration'
      ] : [
        'Career Development', 
        'Industry News', 
        'Networking', 
        'Job Opportunities',
        'Tech Trends',
        'Learning',
        'Inspiration'
      ];
      
      await chrome.storage.local.set({ categories: defaultCategories });
      console.log('Default categories initialized');
    }
    
    if (!result.folders) {
      // Multi-language support
      const browserLang = navigator.language || navigator.userLanguage;
      const isGerman = browserLang.startsWith('de');
      
      const defaultFolders = isGerman ? [
        'Arbeit',
        'Persönliche Entwicklung',
        'Recherche'
      ] : [
        'Work',
        'Personal Development',
        'Research'
      ];
      
      await chrome.storage.local.set({ folders: defaultFolders });
      console.log('Default folders initialized');
    }
    
    // Create context menu items
    chrome.contextMenus.create({
      id: 'save-linkedin-post',
      title: 'Diesen LinkedIn-Post speichern',
      contexts: ['page'],
      documentUrlPatterns: ['*://*.linkedin.com/*']
    });
    
    chrome.contextMenus.create({
      id: 'view-saved-posts',
      title: 'Gespeicherte Posts anzeigen',
      contexts: ['action']
    });
    
  } catch (error) {
    console.error('Error initializing extension:', error);
  }
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message.action);
  
  if (message.action === 'openSidebar') {
    chrome.tabs.create({ url: chrome.runtime.getURL('sidebar/sidebar.html') });
    sendResponse({ success: true });
  } 
  else if (message.action === 'postDataAvailable') {
    // Store the post data temporarily in case popup is opened
    chrome.storage.session.set({ 
      currentPostData: message.postData 
    });
    sendResponse({ success: true });
  }
  else if (message.action === 'savePost') {
    // Handle direct save request from content script
    if (message.postData) {
      // Forward to popup page to handle storage (or import storage.js and handle here)
      // For simplicity, let's use import here
      import('./utils/storage.js').then(async (Storage) => {
        try {
          // Create post object with proper structure
          const post = {
            id: message.postData.id || generatePostId(),
            author: message.postData.author || 'Unbekannter Autor',
            content: message.postData.content || 'Kein Inhalt verfügbar',
            url: message.postData.url || '',
            images: message.postData.images || [],
            savedAt: new Date().toISOString(),
            categories: message.postData.categories || [],
            notes: ''
          };
          
          // If folder specified, include it
          if (message.postData.folder) {
            post.folder = message.postData.folder;
          }
          
          // Save post
          const result = await Storage.savePost(post);
          
          // Send response back
          sendResponse(result);
        } catch (error) {
          console.error('Error saving post:', error);
          sendResponse({ success: false, error: 'storage_error' });
        }
      }).catch(error => {
        console.error('Error importing storage module:', error);
        sendResponse({ success: false, error: 'import_error' });
      });
    } else {
      sendResponse({ success: false, error: 'no_data' });
    }
  }
  
  // Keep the message channel open for async responses
  return true;
});

// Listen for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'save-linkedin-post') {
    // Open the popup when context menu item is clicked
    chrome.action.openPopup();
  } else if (info.menuItemId === 'view-saved-posts') {
    // Open the saved posts page
    chrome.tabs.create({ url: chrome.runtime.getURL('sidebar/sidebar.html') });
  }
});

// When extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  // If we're not on LinkedIn, open a new tab with the saved posts page
  if (!tab.url || !tab.url.includes('linkedin.com')) {
    chrome.tabs.create({ url: chrome.runtime.getURL('sidebar/sidebar.html') });
  } else {
    // On LinkedIn, open the popup
    chrome.action.openPopup();
  }
});

// When a tab is updated (e.g., user navigates to a new page)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only process when the tab has completed loading
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('linkedin.com')) {
    // Tell the content script to start observing if we're on LinkedIn
    chrome.tabs.sendMessage(tabId, { action: 'startObserving' })
      .catch(error => {
        // Likely the content script isn't loaded yet, which is fine
        console.log('Content script not ready yet');
      });
  }
});

// Helper function to generate unique ID for a post (backup for direct saves)
function generatePostId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
