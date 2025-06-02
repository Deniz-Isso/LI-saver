// ES-Modul Imports
import * as Storage from '../utils/storage.js';
import * as PostProcessor from '../utils/post-processor.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup loaded with ES modules...');
  // Common elements
  const autoTabBtn = document.getElementById('auto-tab');
  const manualTabBtn = document.getElementById('manual-tab');
  const autoDetectContent = document.getElementById('auto-detect-content');
  const manualUrlContent = document.getElementById('manual-url-content');
  const viewSavedBtn = document.getElementById('view-saved-posts-btn');
  const openSettingsBtn = document.getElementById('open-settings-btn');
  const statusMessageEl = document.getElementById('status-message');
  const firstTimeDialog = document.getElementById('first-time-dialog');
  const setupApiKeyBtn = document.getElementById('setup-api-key');
  const dismissWelcomeBtn = document.getElementById('dismiss-welcome');
  
  // Auto-detect tab elements
  const notLinkedInEl = document.getElementById('not-linkedin');
  const noPostDetectedEl = document.getElementById('no-post-detected');
  const postFormEl = document.getElementById('post-form');
  const postAuthorEl = document.getElementById('auto-post-author');
  const postContentEl = document.getElementById('auto-post-content');
  const postDateEl = document.getElementById('auto-post-date');
  const postImagesEl = document.getElementById('auto-post-images');
  const postLinkEl = document.getElementById('auto-post-link');
  const categoryInputEl = document.getElementById('auto-category-input');
  const selectedCategoriesEl = document.getElementById('auto-selected-categories');
  const categorySuggestionsEl = document.getElementById('auto-category-suggestions');
  const folderSelectEl = document.getElementById('auto-folder-select');
  const addFolderBtn = document.getElementById('auto-add-folder-button');
  const newFolderInputEl = document.getElementById('auto-new-folder-input');
  const notesEl = document.getElementById('auto-notes');
  const savePostBtn = document.getElementById('auto-save-post');
  
  // Manual URL tab elements
  const manualUrlInput = document.getElementById('manual-url');
  const extractBtn = document.getElementById('extract-button');
  const manualExtractStatus = document.getElementById('manual-extract-status');
  const manualPostForm = document.getElementById('manual-post-form');
  const manualPostAuthor = document.getElementById('manual-post-author');
  const manualPostContent = document.getElementById('manual-post-content');
  const manualPostDate = document.getElementById('manual-post-date');
  const manualPostImages = document.getElementById('manual-post-images');
  const manualPostLink = document.getElementById('manual-post-link');
  const manualCategoryInput = document.getElementById('manual-category-input');
  const manualSelectedCategories = document.getElementById('manual-selected-categories');
  const manualCategorySuggestions = document.getElementById('manual-category-suggestions');
  const manualFolderSelect = document.getElementById('manual-folder-select');
  const manualAddFolderBtn = document.getElementById('manual-add-folder-button');
  const manualNewFolderInput = document.getElementById('manual-new-folder-input');
  const manualNotes = document.getElementById('manual-notes');
  const saveManualBtn = document.getElementById('save-manual-post');
  
  // Variables to store post data
  let currentPostData = null;
  let manualPostData = null;
  let selectedCategories = [];
  let manualSelectedCategoriesList = []; // Renamed to avoid conflict with HTML element
  let activeTab = 'auto';
  
  // Check if it's first time use
  const checkFirstTimeUse = async () => {
    const hasUsedBefore = await chrome.storage.local.get('hasUsedBefore');
    if (!hasUsedBefore.hasUsedBefore) {
      firstTimeDialog.classList.remove('hidden');
      await chrome.storage.local.set({ hasUsedBefore: true });
    }
  };
  
  // Initialize the popup
  const initialize = async () => {
    // Get categories and folders for dropdowns
    await updateFolderSelects();
    
    // Check if it's LinkedIn and try to detect post
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (isValidLinkedInUrl(tab.url)) {
      // Valid LinkedIn page
      await extractPostFromCurrentPage(tab);
    } else {
      // Not LinkedIn
      notLinkedInEl.classList.remove('hidden');
    }
    
    // Check if first time use
    await checkFirstTimeUse();
  };
  
  // Event listeners - mit Fehlerbehandlung
  console.log('Registriere Event-Listener...');
  
  // Tab switching
  if (autoTabBtn) {
    autoTabBtn.addEventListener('click', () => {
      console.log('Auto tab clicked');
      switchTab('auto');
    });
    console.log('Auto tab listener registered');
  }
  
  if (manualTabBtn) {
    manualTabBtn.addEventListener('click', () => {
      console.log('Manual tab clicked');
      switchTab('manual');
    });
    console.log('Manual tab listener registered');
  }
  
  // View saved posts
  if (viewSavedBtn) {
    viewSavedBtn.addEventListener('click', () => {
      console.log('View saved posts clicked');
      openSavedPostsView();
    });
  }
  
  // Open settings
  if (openSettingsBtn) {
    openSettingsBtn.addEventListener('click', () => {
      console.log('Settings button clicked');
      openSettings();
    });
  }
  
  // First time dialog buttons
  if (setupApiKeyBtn) {
    setupApiKeyBtn.addEventListener('click', () => {
      openSettings();
      firstTimeDialog.classList.add('hidden');
    });
  }
  
  if (dismissWelcomeBtn) {
    dismissWelcomeBtn.addEventListener('click', () => {
      firstTimeDialog.classList.add('hidden');
    });
  }
  
  // Category input for auto tab
  if (categoryInputEl) {
    categoryInputEl.addEventListener('input', () => {
      const input = categoryInputEl.value.trim();
      if (input) {
        renderCategorySuggestions(input);
      } else {
        categorySuggestionsEl.innerHTML = '';
      }
    });
  }
  
  // Add category button for auto tab
  const addCategoryBtn = document.getElementById('add-category-button');
  if (addCategoryBtn) {
    addCategoryBtn.addEventListener('click', () => {
      console.log('Add category clicked');
      const category = categoryInputEl.value.trim();
      if (category) {
        addCategory(category);
        categoryInputEl.value = '';
        categorySuggestionsEl.innerHTML = '';
      }
    });
  }
  
  // Category input enter key for auto tab
  if (categoryInputEl) {
    categoryInputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const category = categoryInputEl.value.trim();
        if (category) {
          addCategory(category);
          categoryInputEl.value = '';
          categorySuggestionsEl.innerHTML = '';
        }
      }
    });
  }
  
  // Category input for manual tab
  if (manualCategoryInput) {
    manualCategoryInput.addEventListener('input', () => {
      const input = manualCategoryInput.value.trim();
      if (input) {
        renderManualCategorySuggestions(input);
      } else {
        manualCategorySuggestions.innerHTML = '';
      }
    });
    
    // Category input enter key for manual tab
    manualCategoryInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const category = manualCategoryInput.value.trim();
        if (category) {
          addManualCategory(category);
          manualCategoryInput.value = '';
          manualCategorySuggestions.innerHTML = '';
        }
      }
    });
  }
  
  // Add category button for manual tab
  const manualAddCategoryBtn = document.getElementById('manual-add-category-button');
  if (manualAddCategoryBtn) {
    manualAddCategoryBtn.addEventListener('click', () => {
      console.log('Manual add category clicked');
      const category = manualCategoryInput.value.trim();
      if (category) {
        addManualCategory(category);
        manualCategoryInput.value = '';
        manualCategorySuggestions.innerHTML = '';
      }
    });
  }
  
  // Add folder button for auto tab
  if (addFolderBtn) {
    addFolderBtn.addEventListener('click', () => {
      console.log('Add folder clicked');
      document.getElementById('auto-new-folder-section').classList.toggle('show');
      if (newFolderInputEl) newFolderInputEl.focus();
    });
  }
  
  // Save folder button for auto tab
  const saveFolderBtn = document.getElementById('auto-save-folder-button');
  if (saveFolderBtn) {
    saveFolderBtn.addEventListener('click', async () => {
      console.log('Save folder clicked');
      const folderName = document.getElementById('auto-new-folder-input').value.trim();
      if (folderName) {
        await saveFolder(folderName);
        document.getElementById('auto-new-folder-input').value = '';
        document.getElementById('auto-new-folder-section').classList.remove('show');
        await updateFolderSelects();
      }
    });
  }
  
  // Add folder button for manual tab
  if (manualAddFolderBtn) {
    manualAddFolderBtn.addEventListener('click', () => {
      console.log('Manual add folder clicked');
      document.getElementById('manual-new-folder-section').classList.toggle('show');
      if (manualNewFolderInput) manualNewFolderInput.focus();
    });
  }
  
  // Save folder button for manual tab
  const manualSaveFolderBtn = document.getElementById('manual-save-folder-button');
  if (manualSaveFolderBtn) {
    manualSaveFolderBtn.addEventListener('click', async () => {
      console.log('Manual save folder clicked');
      const folderName = manualNewFolderInput.value.trim();
      if (folderName) {
        await saveFolder(folderName);
        manualNewFolderInput.value = '';
        document.getElementById('manual-new-folder-section').classList.remove('show');
        await updateFolderSelects();
      }
    });
  }
  
  // Save post button for auto tab
  if (savePostBtn) {
    savePostBtn.addEventListener('click', () => {
      console.log('Save post clicked');
      saveAutoDetectedPost();
    });
  }
  
  // Extract button for manual tab
  if (extractBtn) {
    extractBtn.addEventListener('click', () => {
      console.log('Extract button clicked');
      extractFromManualUrl();
    });
  }
  
  // Save post button for manual tab
  if (saveManualBtn) {
    saveManualBtn.addEventListener('click', () => {
      console.log('Save manual post clicked');
      saveManualPost();
    });
  }

  // Original post link handler
  if (postLinkEl) {
    postLinkEl.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Verwende immer die aktuelle Tab-URL
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0] && tabs[0].url.includes('linkedin.com')) {
          chrome.tabs.create({ url: tabs[0].url });
          console.log('Opening current LinkedIn tab:', tabs[0].url);
        } else {
          console.warn('Current tab is not LinkedIn');
        }
      });
    });
  }
  
  // Initialize popup
  await initialize();
  
  function switchTab(tab) {
    console.log('Switching to tab:', tab);
    activeTab = tab;
    
    if (tab === 'auto') {
      autoTabBtn.classList.add('active');
      manualTabBtn.classList.remove('active');
      autoDetectContent.classList.remove('hidden');
      manualUrlContent.classList.add('hidden');
    } else {
      autoTabBtn.classList.remove('active');
      manualTabBtn.classList.add('active');
      autoDetectContent.classList.add('hidden');
      manualUrlContent.classList.remove('hidden');
    }
    
    // Hide first time dialog when switching tabs
    firstTimeDialog.classList.add('hidden');
  }
  
  async function getCurrentTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
  }
  
  async function extractPostFromCurrentPage(tab) {
    try {
      // Try to send message to content script to get current post data
      console.log('Sending message to extract post data...');
      chrome.tabs.sendMessage(
        tab.id,
        { action: 'extractCurrentPost' },
        (response) => {
          if (chrome.runtime.lastError) {
            // Content script not ready, execute script
            console.log('Content script not ready, injecting...');
            executeContentScriptAndExtract(tab);
            return;
          }
          
          if (response) {
            console.log('Received post data from content script:', response);
            handleExtractedPostData(response);
          } else {
            console.log('No post detected in content script response');
            noPostDetectedEl.classList.remove('hidden');
          }
        }
      );
    } catch (error) {
      console.error('Error communicating with content script:', error);
      executeContentScriptAndExtract(tab);
    }
  }
  
  async function executeContentScriptAndExtract(tab) {
    // Inject the content script to ensure we have the latest version
    try {
      console.log('Injecting content script...');
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content-scripts/linkedin-post-extractor.js']
      });
      
      // Give the script a moment to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Now try to extract the post again
      console.log('Sending message to extract post after injection...');
      chrome.tabs.sendMessage(tab.id, { action: 'extractCurrentPost' }, (result) => {
        console.log('Received post data after content script injection:', result);
        if (result) {
          handleExtractedPostData(result);
        } else {
          console.log('No post detected after content script injection');
          noPostDetectedEl.classList.remove('hidden');
        }
      });
    } catch (error) {
      console.error('Error during content script execution:', error);
      noPostDetectedEl.classList.remove('hidden');
    }
  }
  
  function handleExtractedPostData(postData) {
    console.log('Processing extracted post data:', postData);
    
    if (!postData) {
      console.log('No post data received');
      noPostDetectedEl.classList.remove('hidden');
      return;
    }
    
    // Auch Posts ohne Content akzeptieren (z.B. nur Bilder)
    if (!postData.content && !postData.images && !postData.author) {
      console.log('Post data has no meaningful content');
      noPostDetectedEl.classList.remove('hidden');
      return;
    }
    
    // Aktuelle Tab-URL für Post-Link verwenden
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const postLink = tabs[0] ? tabs[0].url : 'https://linkedin.com';
      
      // Post-Daten speichern
      currentPostData = {
        id: postData.id || generatePostId(),
        content: postData.content || 'Kein Textinhalt',
        author: postData.author || 'Unbekannter Autor',
        authorHeadline: postData.authorHeadline || '',
        date: postData.date || new Date().toISOString(),
        link: postLink,
        images: postData.images || [],
        timestamp: postData.timestamp || ''
      };
      
      updatePostUI(postData);
    });
  }
  
  function updatePostUI(postData) {
    
    console.log('Processed currentPostData:', currentPostData);
    
    // Update the UI with the post data
    console.log('Updating UI with post data:', postData);
    
    if (postAuthorEl) {
      postAuthorEl.textContent = postData.author || 'Unbekannter Autor';
    }
    
    if (postContentEl) {
      // Show a preview of the content (first 200 characters)
      const content = postData.content || 'Kein Inhalt verfügbar';
      const preview = content.length > 200 ? content.substring(0, 200) + '...' : content;
      postContentEl.textContent = preview;
    }
    
    if (postData.date) {
      postDateEl.textContent = new Date(postData.date).toLocaleDateString();
    } else {
      postDateEl.textContent = 'Unknown Date';
    }
    
    // Setze den Link aus currentPostData
    if (currentPostData && currentPostData.link) {
      postLinkEl.href = currentPostData.link;
      console.log('Setting post link from currentPostData:', currentPostData.link);
    } else {
      postLinkEl.href = '#';
      console.warn('No valid post link available');
    }
    
    if (postData.images && postData.images.length > 0) {
      postImagesEl.innerHTML = '';
      postImagesEl.classList.remove('hidden');
      
      postData.images.forEach(imageUrl => {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Post image';
        postImagesEl.appendChild(img);
      });
    } else {
      postImagesEl.classList.add('hidden');
    }
    
    // Show the post form
    postFormEl.classList.remove('hidden');
    
    // Generate tag suggestions
    if (postData.content) {
      const existingCategories = selectedCategories.map(c => c.toLowerCase());
      generateTagSuggestions(postData.content, existingCategories, categorySuggestionsEl, addCategory);
    }
  }
  
  function isValidLinkedInUrl(url) {
    return url && url.includes('linkedin.com');
  }
  
  async function extractFromManualUrl() {
    const url = manualUrlInput.value.trim();
    if (!url) {
      manualExtractStatus.textContent = 'Please enter a URL';
      manualExtractStatus.style.color = 'red';
      return;
    }
    
    if (!isValidLinkedInUrl(url)) {
      manualExtractStatus.textContent = 'Please enter a valid LinkedIn URL';
      manualExtractStatus.style.color = 'red';
      return;
    }
    
    manualExtractStatus.textContent = 'Extracting...';
    manualExtractStatus.style.color = 'blue';
    
    try {
      // Open the URL in a new tab and extract the post
      const newTab = await chrome.tabs.create({ url, active: false });
      
      // Wait for the page to load - give it more time
      setTimeout(async () => {
        try {
          console.log('Injecting content script into manual URL tab...');
          // Inject content script
          await chrome.scripting.executeScript({
            target: { tabId: newTab.id },
            files: ['content-scripts/linkedin-post-extractor.js']
          });
          
          // Give it a moment to initialize
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Extract the post
          console.log('Sending message to extract post from manual URL...');
          const result = await chrome.tabs.sendMessage(newTab.id, { action: 'extractCurrentPost' });
          console.log('Received post data from manual URL:', result);
          
          // Close the tab
          chrome.tabs.remove(newTab.id);
          
          if (!result || !result.content) {
            manualExtractStatus.textContent = 'No post detected on this page';
            manualExtractStatus.style.color = 'red';
            return;
          }
          
          manualPostData = result;
          
          // Update the UI with the post data
          manualPostAuthor.textContent = result.author || 'Unknown Author';
          manualPostContent.textContent = result.content;
          
          if (result.date) {
            manualPostDate.textContent = new Date(result.date).toLocaleDateString();
          } else {
            manualPostDate.textContent = 'Unknown Date';
          }
          
          if (result.link) {
            manualPostLink.href = result.link;
          }
          
          if (result.images && result.images.length > 0) {
            manualPostImages.innerHTML = '';
            manualPostImages.classList.remove('hidden');
            
            result.images.forEach(imageUrl => {
              const img = document.createElement('img');
              img.src = imageUrl;
              img.alt = 'Post image';
              manualPostImages.appendChild(img);
            });
          } else {
            manualPostImages.classList.add('hidden');
          }
          
          // Show the post form
          manualPostForm.classList.remove('hidden');
          manualExtractStatus.textContent = 'Post extracted successfully';
          manualExtractStatus.style.color = 'green';
          
          // Generate tag suggestions
          if (result.content) {
            const existingCategories = manualSelectedCategoriesList.map(c => c.toLowerCase());
            generateTagSuggestions(result.content, existingCategories, manualCategorySuggestions, addManualCategory);
          }
        } catch (error) {
          console.error('Error extracting post:', error);
          manualExtractStatus.textContent = 'Error extracting post';
          manualExtractStatus.style.color = 'red';
          
          // Close the tab
          chrome.tabs.remove(newTab.id);
        }
      }, 3000); // Wait for 3 seconds
    } catch (error) {
      console.error('Error opening URL:', error);
      manualExtractStatus.textContent = 'Error opening URL';
      manualExtractStatus.style.color = 'red';
    }
  }
  
  function addCategory(category) {
    if (!selectedCategories.includes(category)) {
      selectedCategories.push(category);
      renderSelectedCategories();
      saveCategory(category);
    }
  }
  
  function removeCategory(category) {
    selectedCategories = selectedCategories.filter(c => c !== category);
    renderSelectedCategories();
  }
  
  function addManualCategory(category) {
    if (!manualSelectedCategoriesList.includes(category)) {
      manualSelectedCategoriesList.push(category);
      renderManualSelectedCategories();
      saveCategory(category);
    }
  }
  
  function removeManualCategory(category) {
    manualSelectedCategoriesList = manualSelectedCategoriesList.filter(c => c !== category);
    renderManualSelectedCategories();
  }
  
  function renderSelectedCategories() {
    selectedCategoriesEl.innerHTML = '';
    
    selectedCategories.forEach(category => {
      const tag = document.createElement('div');
      tag.className = 'tag';
      
      const tagText = document.createElement('span');
      tagText.textContent = category;
      tag.appendChild(tagText);
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'tag-remove';
      removeBtn.innerHTML = '&times;';
      removeBtn.addEventListener('click', () => removeCategory(category));
      tag.appendChild(removeBtn);
      
      selectedCategoriesEl.appendChild(tag);
    });
  }
  
  function renderManualSelectedCategories() {
    manualSelectedCategories.innerHTML = '';
    
    manualSelectedCategoriesList.forEach(category => {
      const tag = document.createElement('div');
      tag.className = 'tag';
      
      const tagText = document.createElement('span');
      tagText.textContent = category;
      tag.appendChild(tagText);
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'tag-remove';
      removeBtn.innerHTML = '&times;';
      removeBtn.addEventListener('click', () => removeManualCategory(category));
      tag.appendChild(removeBtn);
      
      manualSelectedCategories.appendChild(tag);
    });
  }
  
  function renderCategorySuggestions(input) {
    Storage.getCategories().then(categories => {
      const filteredCategories = categories
        .filter(cat => cat.toLowerCase().includes(input.toLowerCase()))
        .filter(cat => !selectedCategories.includes(cat))
        .slice(0, 5);
      
      categorySuggestionsEl.innerHTML = '';
      
      filteredCategories.forEach(category => {
        const suggestion = document.createElement('div');
        suggestion.className = 'suggestion-item';
        suggestion.textContent = category;
        suggestion.addEventListener('click', () => {
          addCategory(category);
          categoryInputEl.value = '';
          categorySuggestionsEl.innerHTML = '';
        });
        categorySuggestionsEl.appendChild(suggestion);
      });
    });
  }
  
  function renderManualCategorySuggestions(input) {
    Storage.getCategories().then(categories => {
      const filteredCategories = categories
        .filter(cat => cat.toLowerCase().includes(input.toLowerCase()))
        .filter(cat => !manualSelectedCategoriesList.includes(cat))
        .slice(0, 5);
      
      manualCategorySuggestions.innerHTML = '';
      
      filteredCategories.forEach(category => {
        const suggestion = document.createElement('div');
        suggestion.className = 'suggestion-item';
        suggestion.textContent = category;
        suggestion.addEventListener('click', () => {
          addManualCategory(category);
          manualCategoryInput.value = '';
          manualCategorySuggestions.innerHTML = '';
        });
        manualCategorySuggestions.appendChild(suggestion);
      });
    });
  }
  
  async function saveCategory(category) {
    await Storage.saveCategory(category);
  }
  
  async function saveFolder(folderName) {
    await Storage.saveFolder(folderName);
    updateFolderSelects();
  }
  
  function updateFolderSelects() {
    Storage.getFolders().then(folders => {
      // Auto tab folder select
      folderSelectEl.innerHTML = '<option value="">No Folder</option>';
      folders.forEach(folder => {
        const option = document.createElement('option');
        option.value = folder;
        option.textContent = folder;
        folderSelectEl.appendChild(option);
      });
      
      // Manual tab folder select
      manualFolderSelect.innerHTML = '<option value="">No Folder</option>';
      folders.forEach(folder => {
        const option = document.createElement('option');
        option.value = folder;
        option.textContent = folder;
        manualFolderSelect.appendChild(option);
      });
    });
  }
  
  function generateTagSuggestions(content, existingTags = [], targetElement, callback) {
    // Generate suggestions based on post content
    const suggestions = PostProcessor.suggestCategories(content, existingTags);
    
    targetElement.innerHTML = '';
    
    if (suggestions.length === 0) {
      return;
    }
    
    const suggestionHeader = document.createElement('div');
    suggestionHeader.className = 'suggestion-header';
    suggestionHeader.textContent = 'Vorgeschlagene Kategorien:';
    targetElement.appendChild(suggestionHeader);
    
    const suggestionList = document.createElement('div');
    suggestionList.className = 'suggestion-list';
    targetElement.appendChild(suggestionList);
    
    suggestions.forEach(tag => {
      const suggestion = document.createElement('div');
      suggestion.className = 'suggestion-item';
      suggestion.textContent = tag;
      suggestion.addEventListener('click', () => {
        callback(tag);
        targetElement.innerHTML = '';
      });
      suggestionList.appendChild(suggestion);
    });
  }
  
  async function saveAutoDetectedPost() {
    console.log('Attempting to save post...');
    
    if (!currentPostData) {
      console.log('No current post data available');
      showErrorMessage('Kein Post-Daten zum Speichern verfügbar');
      return;
    }
    
    console.log('Current post data:', currentPostData);
    
    try {
      // Storage ist jetzt als ES-Modul verfügbar
      
      // Einfacher Duplikat-Check
      const postToSave = {
        id: currentPostData.id || generatePostId(),
        content: currentPostData.content || 'Kein Inhalt',
        author: currentPostData.author || 'Unbekannter Autor',
        authorHeadline: currentPostData.authorHeadline || '',
        date: currentPostData.date || new Date().toISOString(),
        link: currentPostData.link || window.location.href,
        images: currentPostData.images || [],
        categories: selectedCategories || [],
        folder: folderSelectEl ? folderSelectEl.value : '',
        notes: notesEl ? notesEl.value : '',
        savedAt: new Date().toISOString()
      };
      
      console.log('Attempting to save post:', postToSave);
      
      // Direkt speichern ohne komplexe Duplikat-Prüfung
      const result = await Storage.savePost(postToSave);
      console.log('Save result:', result);
      
      // Success message
      showSuccessMessage('Post erfolgreich gespeichert!');
      
      // Form zurücksetzen
      selectedCategories = [];
      renderSelectedCategories();
      if (folderSelectEl) folderSelectEl.value = '';
      if (notesEl) notesEl.value = '';
      
    } catch (error) {
      console.error('Detailed error saving post:', error);
      showErrorMessage('Fehler beim Speichern: ' + (error.message || 'Unbekannter Fehler'));
    }
  }
  
  async function saveManualPost() {
    if (!manualPostData) {
      showErrorMessage('No post data to save', 'manual');
      return;
    }
    
    try {
      // Check if post already exists
      const exists = await Storage.postExists(manualPostData);
      if (exists) {
        showErrorMessage('This post has already been saved', 'manual');
        return;
      }
      
      // Prepare the post data
      const postToSave = {
        ...manualPostData,
        categories: manualSelectedCategoriesList,
        folder: manualFolderSelect.value,
        notes: manualNotes.value,
        savedAt: new Date().toISOString(),
        id: manualPostData.id || generatePostId()
      };
      
      // Save the post
      await Storage.savePost(postToSave);
      
      // Show success message
      showSuccessMessage('Post saved successfully', 'manual');
      
      // Reset the form
      manualSelectedCategoriesList = [];
      renderManualSelectedCategories();
      manualFolderSelect.value = '';
      manualNotes.value = '';
      
    } catch (error) {
      console.error('Error saving post:', error);
      showErrorMessage('Error saving post', 'manual');
    }
  }
  
  function showSuccessMessage(message, target = 'auto') {
    const statusEl = target === 'auto' ? statusMessageEl : manualExtractStatus;
    statusEl.textContent = message;
    statusEl.style.color = 'green';
    statusEl.classList.remove('hidden');
    
    // Hide the message after 3 seconds
    setTimeout(() => {
      statusEl.classList.add('hidden');
    }, 3000);
  }
  
  function showErrorMessage(message, target = 'auto') {
    const statusEl = target === 'auto' ? statusMessageEl : manualExtractStatus;
    statusEl.textContent = message;
    statusEl.style.color = 'red';
    statusEl.classList.remove('hidden');
    
    // Hide the message after 3 seconds
    setTimeout(() => {
      statusEl.classList.add('hidden');
    }, 3000);
  }
  
  function openSavedPostsView() {
    console.log("Opening saved posts view");
    chrome.tabs.create({ url: chrome.runtime.getURL('sidebar/sidebar.html') });
  }
  
  function openSettings() {
    console.log("Opening settings view");
    chrome.tabs.create({ url: chrome.runtime.getURL('sidebar/sidebar.html?tab=settings') });
  }
  
  // Generate unique ID for a post
  function generatePostId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
});
