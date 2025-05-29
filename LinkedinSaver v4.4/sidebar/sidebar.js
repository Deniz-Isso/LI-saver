// Professional Post Saver - Sidebar v3.6
// 1:1 Umsetzung des detaillierten Feedbacks ohne Deklarationsfehler

import * as Storage from '../utils/storage.js';
import * as PostProcessor from '../utils/post-processor.js';
import * as AIService from '../utils/ai-service.js';
import * as ApiKeySettings from './api-key-settings.js';

document.addEventListener('DOMContentLoaded', async function() {
  console.log('Sidebar v3.6 loaded - 1:1 Feedback-Implementation');

  // DOM Elements - alle auf einmal ohne Duplikate
  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');
  const timeFilterSelect = document.getElementById('time-filter');
  const customDateContainer = document.getElementById('custom-date-container');
  const dateFromInput = document.getElementById('date-from');
  const dateToInput = document.getElementById('date-to');
  const applyCustomDateBtn = document.getElementById('apply-custom-date');
  const postsContainer = document.getElementById('posts-container');
  const emptyState = document.getElementById('empty-state');
  const noResults = document.getElementById('no-results');
  const clusteringBtn = document.getElementById('clustering-btn');
  
  // Manage Categories/Folders buttons - Füge diese Deklarationen HIER HINZU
  const manageCategoriesBtn = document.getElementById('manage-categories-btn');
  const manageFoldersBtn = document.getElementById('manage-folders-btn');
  
  // Tabs
  const tabCategories = document.getElementById('tab-categories');
  const tabFolders = document.getElementById('tab-folders');
  const tabSettings = document.getElementById('tab-settings');
  const categoriesContent = document.getElementById('categories-content');
  const foldersContent = document.getElementById('folders-content');
  const settingsContent = document.getElementById('settings-content');
  
  // Action buttons - KORRIGIERTE IDs
  const bulkActionsBtn = document.getElementById('bulk-actions-btn'); // OK
  const selectAllBtn = document.getElementById('select-all-btn'); // <-- HIER ÄNDERN
  const bulkDeleteBtn = document.getElementById('delete-selected-btn'); // <-- HIER ÄNDERN
  const bulkCategoriesBtn = document.getElementById('add-categories-btn'); // <-- HIER ÄNDERN
  const bulkFolderBtn = document.getElementById('move-folder-btn'); // <-- HIER ÄNDERN
  const cancelBulkBtn = document.getElementById('cancel-bulk-btn'); // <-- HIER ÄNDERN
  const bulkActionsCount = document.getElementById('bulk-count'); // <-- HIER ÄNDERN
  
  // Alle Modal elements - einmalig deklariert
  const postModal = document.getElementById('post-modal');
  const categoryModal = document.getElementById('category-modal');
  const folderModal = document.getElementById('folder-modal');
  const bulkCategoriesModal = document.getElementById('bulk-categories-modal');
  const bulkFolderModal = document.getElementById('bulk-folder-modal');
  const summaryModal = document.getElementById('summary-modal');
  const exportModal = document.getElementById('export-modal');
  const importModal = document.getElementById('import-modal');
  const settingsModal = document.getElementById('settings-modal');
  
  // Modal Close Buttons - eindeutige IDs
  const postModalCloseBtn = document.getElementById('post-modal-close-btn');
  const categoryModalCloseBtn = document.getElementById('category-modal-close-btn');
  const folderModalCloseBtn = document.getElementById('folder-modal-close-btn');
  const bulkCategoriesModalCloseBtn = document.getElementById('bulk-categories-modal-close-btn');
  const bulkFolderModalCloseBtn = document.getElementById('bulk-folder-modal-close-btn');
  const settingsModalCloseBtn = document.getElementById('settings-modal-close-btn');
  const summaryModalCloseBtn = document.getElementById('summary-modal-close-btn');
  const exportModalCloseBtn = document.getElementById('export-modal-close-btn');
  const importModalCloseBtn = document.getElementById('import-modal-close-btn');
  const modalPostAuthor = document.getElementById('modal-post-author');
  const modalPostContent = document.getElementById('modal-post-content');
  const modalPostDate = document.getElementById('modal-post-date');
  const modalPostImages = document.getElementById('modal-post-images');
  const modalPostLink = document.getElementById('modal-post-link');
  const modalPostCategories = document.getElementById('modal-post-categories');
  const modalPostFolder = document.getElementById('modal-post-folder');
  const modalPostNotes = document.getElementById('modal-post-notes');

  // Category Management Elements
  const addCategoryBtn = document.getElementById('add-category-btn');
  const newCategoryInput = document.getElementById('new-category-input');
  const manageCategoryList = document.getElementById('manage-category-list');

  // Variables to store data and state
  let posts = [];
  let categories = [];
  let folders = [];
  let filteredPosts = [];
  let selectedPostIds = [];
  let isInBulkMode = false;
  let searchTerm = '';
  let activeCategory = '';
  let activeFolder = '';
  let timeFilter = 'all';
  let sortMethod = 'newest';
  let customDateFrom = '';
  let customDateTo = '';

  // Initialize function - aus dem Feedback
  async function initialize() {
    console.log('Starting initialization...');
    
    // Initialize AI Service (optional, with fallback)
    try {
      await AIService.initAIService();
      console.log('AI Service initialized successfully');
    } catch (error) {
      console.error('AI Service initialization failed:', error);
      // Continue without AI - this is expected without API key
    }

    // Initialize API Key Settings
    try {
      await ApiKeySettings.initApiKeySettings();
      console.log('API Key Settings initialized');
    } catch (error) {
      console.error('API Key Settings initialization failed:', error);
      // Continue without API settings
    }

    // Load data - this is critical
    try {
      console.log('Loading posts from storage...');
      posts = await Storage.getSavedPosts() || [];
      categories = await Storage.getCategories() || [];
      folders = await Storage.getFolders() || [];
      
      console.log('Loaded data:', { 
        postsCount: posts.length, 
        categoriesCount: categories.length, 
        foldersCount: folders.length 
      });
      
      filteredPosts = [...posts];
      renderPosts();
      renderCategories();
      renderFolders();
    } catch (error) {
      console.error('Error loading data:', error);
      // Initialize empty arrays as fallback
      posts = [];
      categories = [];
      folders = [];
      filteredPosts = [];
      renderPosts();
      renderCategories();
      renderFolders();
    }
  }

  // Tab switching
  function switchTab(tab) {
    console.log('Switching to tab:', tab);
    
    // Remove active class from all tabs
    [tabCategories, tabFolders, tabSettings].forEach(tabEl => {
      if (tabEl) tabEl.classList.remove('active');
    });
    
    // Hide all content sections
    [categoriesContent, foldersContent, settingsContent].forEach(content => {
      if (content) content.classList.add('hidden');
    });
    
    // Show selected tab and content
    if (tab === 'categories') {
      if (tabCategories) tabCategories.classList.add('active');
      if (categoriesContent) categoriesContent.classList.remove('hidden');
    } else if (tab === 'folders') {
      if (tabFolders) tabFolders.classList.add('active');
      if (foldersContent) foldersContent.classList.remove('hidden');
    } else if (tab === 'settings') {
      if (tabSettings) tabSettings.classList.add('active');
      if (settingsContent) settingsContent.classList.remove('hidden');
    }
  }

  // renderPosts function
  function renderPosts() {
    console.log('Rendering posts:', filteredPosts.length);
    
    if (!postsContainer) {
      console.error('Posts container not found');
      return;
    }

    postsContainer.innerHTML = '';

    if (filteredPosts.length === 0) {
      if (emptyState && posts.length === 0) {
        emptyState.classList.remove('hidden');
      } else if (noResults) {
        noResults.classList.remove('hidden');
      }
      return;
    }

    // Hide empty states
    if (emptyState) emptyState.classList.add('hidden');
    if (noResults) noResults.classList.add('hidden');

    filteredPosts.forEach(post => {
      const postCard = document.createElement('div');
      postCard.className = `post-card ${isInBulkMode ? 'selectable' : ''}`;
      postCard.dataset.postId = post.id;

      postCard.innerHTML = `
        ${isInBulkMode ? `<input type="checkbox" class="post-select-checkbox" data-post-id="${post.id}" ${selectedPostIds.includes(post.id) ? 'checked' : ''}>` : ''}
        <div class="post-header">
          <div class="post-author">${post.author || 'Unbekannter Autor'}</div>
          <div class="post-date">${new Date(post.savedAt || post.date).toLocaleDateString()}</div>
          ${post.folder ? `<div class="post-folder"><span class="material-icons-round">folder</span>${post.folder}</div>` : ''}
        </div>
        <div class="post-content">${post.content ? post.content.substring(0, 150) + '...' : 'Kein Inhalt verfügbar'}</div>
        <div class="post-footer">
          <div class="post-categories">
            ${(post.categories || []).map(cat => `<span class="category-tag">${cat}</span>`).join('')}
          </div>
          <div class="post-actions">
            <button class="post-action view-post-btn" title="View Details" data-post-id="${post.id}">
              <span class="material-icons-round">visibility</span>
            </button>
            <button class="post-action delete-post-btn" title="Delete Post" data-post-id="${post.id}">
              <span class="material-icons-round">delete</span>
            </button>
          </div>
        </div>
      `;

      postsContainer.appendChild(postCard);
    });

    attachPostActionListeners();
    updateBulkModeCheckboxes();
  }

  // filterPosts function
  function filterPosts() {
    console.log('Filtering posts with:', { searchTerm, activeCategory, activeFolder, timeFilter });
    
    let tempPosts = [...posts];
    
    // Apply search filter
    if (searchTerm) {
      tempPosts = tempPosts.filter(post => 
        (post.content && post.content.toLowerCase().includes(searchTerm)) ||
        (post.author && post.author.toLowerCase().includes(searchTerm)) ||
        (post.categories && post.categories.some(cat => cat.toLowerCase().includes(searchTerm))) ||
        (post.folder && post.folder.toLowerCase().includes(searchTerm)) ||
        (post.notes && post.notes.toLowerCase().includes(searchTerm))
      );
    }
    
    // Apply category filter
    if (activeCategory && activeCategory !== 'all') {
      tempPosts = tempPosts.filter(post => 
        post.categories && post.categories.includes(activeCategory)
      );
    }
    
    // Apply folder filter
    if (activeFolder) {
      if (activeFolder === 'none') {
        tempPosts = tempPosts.filter(post => !post.folder);
      } else if (activeFolder !== 'all') {
        tempPosts = tempPosts.filter(post => post.folder === activeFolder);
      }
    }
    
    // Apply time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      tempPosts = tempPosts.filter(post => {
        const postDate = new Date(post.savedAt || post.date);
        
        if (timeFilter === 'today') {
          return postDate.toDateString() === now.toDateString();
        } else if (timeFilter === 'thisWeek') {
          const firstDayOfWeek = new Date(now);
          firstDayOfWeek.setDate(now.getDate() - now.getDay());
          return postDate >= firstDayOfWeek;
        } else if (timeFilter === 'thisMonth') {
          return postDate.getMonth() === now.getMonth() && postDate.getFullYear() === now.getFullYear();
        } else if (timeFilter === 'last3Months') {
          const threeMonthsAgo = new Date(now);
          threeMonthsAgo.setMonth(now.getMonth() - 3);
          return postDate >= threeMonthsAgo;
        } else if (timeFilter === 'thisYear') {
          return postDate.getFullYear() === now.getFullYear();
        } else if (timeFilter === 'custom' && customDateFrom && customDateTo) {
          const from = new Date(customDateFrom);
          const to = new Date(customDateTo);
          to.setHours(23, 59, 59, 999);
          return postDate >= from && postDate <= to;
        }
        return true;
      });
    }
    
    // Apply sorting
    tempPosts.sort((a, b) => {
      const dateA = new Date(a.savedAt || a.date);
      const dateB = new Date(b.savedAt || b.date);
      
      if (sortMethod === 'newest') {
        return dateB - dateA;
      } else if (sortMethod === 'oldest') {
        return dateA - dateB;
      } else if (sortMethod === 'author') {
        const authorA = (a.author || '').toLowerCase();
        const authorB = (b.author || '').toLowerCase();
        return authorA.localeCompare(authorB);
      }
      return 0;
    });
    
    filteredPosts = tempPosts;
    renderPosts();
  }

  // Event handlers
  function handleSearch(e) {
    searchTerm = e.target.value.toLowerCase();
    console.log('Searching for:', searchTerm);
    filterPosts();
  }

  function handleSort(e) {
    sortMethod = e.target.value;
    console.log('Sorting by:', sortMethod);
    filterPosts();
  }

  function handleTimeFilterChange(e) {
    timeFilter = e.target.value;
    console.log('Time filter changed to:', timeFilter);
    
    if (customDateContainer) {
      if (timeFilter === 'custom') {
        customDateContainer.classList.remove('hidden');
      } else {
        customDateContainer.classList.add('hidden');
      }
    }
    
    filterPosts();
  }

  function applyCustomDateFilter() {
    if (dateFromInput && dateToInput) {
      customDateFrom = dateFromInput.value;
      customDateTo = dateToInput.value;
      console.log('Custom date range:', customDateFrom, 'to', customDateTo);
      filterPosts();
    }
  }

  // Clustering function
  async function showClusteringModal() {
    const summaryLoading = document.getElementById('summary-loading');
    const summaryResult = document.getElementById('summary-result');
    const similarityLoading = document.getElementById('similarity-loading');
    const similarityResult = document.getElementById('similarity-result');
    const clustersLoading = document.getElementById('clusters-loading');
    const clustersResult = document.getElementById('clusters-result');

    if (!summaryModal) {
      alert('Clustering-Modal nicht gefunden. Bitte kontaktieren Sie den Support.');
      return;
    }

    // Show modal and initial loading state
    summaryModal.style.display = 'block';
    if (summaryLoading) summaryLoading.classList.remove('hidden');
    if (summaryResult) summaryResult.classList.add('hidden');
    if (similarityLoading) similarityLoading.classList.remove('hidden');
    if (similarityResult) similarityResult.classList.add('hidden');
    if (clustersLoading) clustersLoading.classList.remove('hidden');
    if (clustersResult) clustersResult.classList.add('hidden');

    // Switch to summary tab by default
    switchSummaryTab('summary');

    try {
      // Determine language
      const language = posts.length > 0 ? PostProcessor.detectLanguage(posts[0].content || '') : 'de';

      // Generate summary
      const summaryData = await AIService.generateSummaryForPosts(posts, language);
      const summaryTextEl = document.getElementById('summary-text');
      const keyInsightsEl = document.getElementById('key-insights');
      const commonThemesEl = document.getElementById('common-themes');
      
      if (summaryTextEl) summaryTextEl.textContent = summaryData.summary;
      if (keyInsightsEl) keyInsightsEl.innerHTML = summaryData.key_insights.map(item => `<li>${item}</li>`).join('');
      if (commonThemesEl) commonThemesEl.innerHTML = summaryData.common_themes.map(theme => `<span class="tag">${theme}</span>`).join('');
      
      if (summaryLoading) summaryLoading.classList.add('hidden');
      if (summaryResult) summaryResult.classList.remove('hidden');

      // Analyze similarities
      const similarityData = await AIService.analyzePostSimilarities(posts, language);
      renderSimilarityMatrix(similarityData.similarity_matrix);
      const redundantInfoEl = document.getElementById('redundant-info');
      if (redundantInfoEl) redundantInfoEl.innerHTML = similarityData.redundant_info.map(item => `<li>${item.term}: ${item.description}</li>`).join('');
      
      if (similarityLoading) similarityLoading.classList.add('hidden');
      if (similarityResult) similarityResult.classList.remove('hidden');

      // Render clusters
      renderClusters(similarityData.clusters);
      if (clustersLoading) clustersLoading.classList.add('hidden');
      if (clustersResult) clustersResult.classList.remove('hidden');

    } catch (error) {
      console.error('Error in clustering or summary:', error);
      alert(`Fehler bei der KI-Analyse: ${error.message}. Bitte stellen Sie sicher, dass KI-Funktionen aktiviert und ein gültiger API-Schlüssel konfiguriert ist.`);
      if (summaryLoading) summaryLoading.classList.add('hidden');
      if (similarityLoading) similarityLoading.classList.add('hidden');
      if (clustersLoading) clustersLoading.classList.add('hidden');
    }
  }

  // renderCategories - 1:1 aus dem Feedback
  function renderCategories() {
    const categoryList = document.getElementById('category-list');
    if (!categoryList) return;

    categoryList.innerHTML = `
      <div class="filter-item ${activeCategory === '' ? 'active' : ''}" data-filter="all">
        <span>Alle Posts</span>
        <span class="count">${posts.length}</span>
      </div>
    `;

    categories.forEach(cat => {
      const count = posts.filter(post => post.categories && post.categories.includes(cat)).length;
      const filterItem = document.createElement('div');
      filterItem.className = `filter-item ${activeCategory === cat ? 'active' : ''}`;
      filterItem.innerHTML = `
        <span>${cat}</span>
        <span class="count">${count}</span>
      `;
      filterItem.addEventListener('click', () => {
        activeCategory = cat;
        filterPosts();
        renderCategories();
      });
      categoryList.appendChild(filterItem);
    });

    // "All Posts" click handler
    const allPostsItem = categoryList.querySelector('[data-filter="all"]');
    if (allPostsItem) {
      allPostsItem.addEventListener('click', () => {
        activeCategory = '';
        filterPosts();
        renderCategories();
      });
    }

    // Management-Liste für das Modal befüllen - 1:1 aus dem Feedback
    if (manageCategoryList) {
      manageCategoryList.innerHTML = '';
      categories.forEach(cat => {
        const manageItem = document.createElement('li');
        manageItem.className = 'manage-list-item';
        manageItem.innerHTML = `
          <span class="manage-list-item-name">${cat}</span>
          <div class="manage-list-item-actions">
            <button class="manage-list-item-action edit-category-btn" title="Rename" data-category="${cat}">
              <span class="material-icons-round">edit</span>
            </button>
            <button class="manage-list-item-action delete-category-btn" title="Delete" data-category="${cat}">
              <span class="material-icons-round">delete</span>
            </button>
          </div>
        `;
        manageCategoryList.appendChild(manageItem);
      });
      attachCategoryManagementListeners();
    }
  }

  // attachCategoryManagementListeners - 1:1 aus dem Feedback
  function attachCategoryManagementListeners() {
    document.querySelectorAll('#manage-category-list .edit-category-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        const oldName = e.currentTarget.dataset.category;
        const newName = prompt(`Kategorie "${oldName}" umbenennen zu:`, oldName);
        if (newName && newName.trim() !== oldName) {
          const result = await Storage.renameCategory(oldName, newName.trim());
          if (result.success) {
            await initialize(); // Daten neu laden, um UI zu aktualisieren
          } else {
            alert('Fehler beim Umbenennen: ' + (result.message || 'Unbekannter Fehler'));
          }
        }
      });
    });

    document.querySelectorAll('#manage-category-list .delete-category-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        const categoryToDelete = e.currentTarget.dataset.category;
        if (confirm(`Möchten Sie die Kategorie "${categoryToDelete}" wirklich löschen? Dies wird sie von allen Posts entfernen.`)) {
          const result = await Storage.deleteCategory(categoryToDelete);
          if (result.success) {
            await initialize(); // Daten neu laden, um UI zu aktualisieren
          } else {
            alert('Fehler beim Löschen der Kategorie: ' + (result.message || 'Unbekannter Fehler'));
          }
        }
      });
    });
  }

  // addNewCategory - 1:1 aus dem Feedback
  async function addNewCategory() {
    const newCategoryName = newCategoryInput ? newCategoryInput.value.trim() : '';
    if (newCategoryName) {
      const result = await Storage.saveCategory(newCategoryName);
      if (result.success || result.duplicate) {
        newCategoryInput.value = '';
        await initialize(); // Lade Daten neu, um die Liste zu aktualisieren
        if (result.duplicate) {
          alert('Kategorie existiert bereits.');
        } else {
          alert('Kategorie hinzugefügt!');
        }
        if (categoryModal) categoryModal.style.display = 'none'; // Modal schließen
      } else {
        alert('Fehler beim Hinzufügen der Kategorie: ' + (result.error || 'Unbekannter Fehler'));
      }
    }
  }

  // Event listeners setup
  
  // Tab switching
  if (tabCategories) tabCategories.addEventListener('click', () => switchTab('categories'));
  if (tabFolders) tabFolders.addEventListener('click', () => switchTab('folders'));
  if (tabSettings) tabSettings.addEventListener('click', () => switchTab('settings'));

  // Header settings button
  const settingsButtonInHeader = document.getElementById('settings-btn');
  if (settingsButtonInHeader) {
    settingsButtonInHeader.addEventListener('click', () => {
      console.log('Header settings button clicked');
      switchTab('settings');
    });
  }
  
  // Search and filters
  if (searchInput) searchInput.addEventListener('input', handleSearch);
  if (sortSelect) sortSelect.addEventListener('change', handleSort);
  if (timeFilterSelect) timeFilterSelect.addEventListener('change', handleTimeFilterChange);
  if (applyCustomDateBtn) applyCustomDateBtn.addEventListener('click', applyCustomDateFilter);
  
  // Clustering
  if (clusteringBtn) clusteringBtn.addEventListener('click', showClusteringModal);
  
  // Clustering Modal Buttons
  const showApiSettingsBtn = document.getElementById('show-api-settings');
  const summaryApplyBtn = document.getElementById('summary-apply-btn');
  
  if (showApiSettingsBtn) {
    showApiSettingsBtn.addEventListener('click', () => {
      switchTab('settings');
      if (summaryModal) summaryModal.style.display = 'none';
    });
  }
  
  if (summaryApplyBtn) {
    summaryApplyBtn.addEventListener('click', () => {
      showClusteringModal();
    });
  }
  
  // Bulk actions
  if (bulkActionsBtn) bulkActionsBtn.addEventListener('click', toggleBulkMode);
  if (selectAllBtn) selectAllBtn.addEventListener('click', selectAllPosts);
  if (bulkDeleteBtn) bulkDeleteBtn.addEventListener('click', confirmBulkDelete);
  if (cancelBulkBtn) cancelBulkBtn.addEventListener('click', cancelBulkMode);
  
  // Category Management Modal - 1:1 aus dem Feedback
  if (manageCategoriesBtn) {
    manageCategoriesBtn.addEventListener('click', () => {
      if (categoryModal) categoryModal.style.display = 'block';
      renderCategories();
    });
  }

  // Folder Management Modal - 1:1 aus dem Feedback  
  if (manageFoldersBtn) {
    manageFoldersBtn.addEventListener('click', () => {
      if (folderModal) folderModal.style.display = 'block';
      renderFolders();
    });
  }

  if (addCategoryBtn && newCategoryInput) {
    addCategoryBtn.addEventListener('click', addNewCategory);

    newCategoryInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addNewCategory();
      }
    });
  }



  // Event-Listener für alle Modal-Close-Buttons
  if (postModalCloseBtn) postModalCloseBtn.addEventListener('click', () => { if (postModal) postModal.style.display = 'none'; });
  if (categoryModalCloseBtn) categoryModalCloseBtn.addEventListener('click', () => { if (categoryModal) categoryModal.style.display = 'none'; });
  if (folderModalCloseBtn) folderModalCloseBtn.addEventListener('click', () => { if (folderModal) folderModal.style.display = 'none'; });
  if (bulkCategoriesModalCloseBtn) bulkCategoriesModalCloseBtn.addEventListener('click', () => { if (bulkCategoriesModal) bulkCategoriesModal.style.display = 'none'; });
  if (bulkFolderModalCloseBtn) bulkFolderModalCloseBtn.addEventListener('click', () => { if (bulkFolderModal) bulkFolderModal.style.display = 'none'; });
  if (settingsModalCloseBtn) settingsModalCloseBtn.addEventListener('click', () => { if (settingsModal) settingsModal.style.display = 'none'; });
  if (summaryModalCloseBtn) summaryModalCloseBtn.addEventListener('click', () => { if (summaryModal) summaryModal.style.display = 'none'; });
  if (exportModalCloseBtn) exportModalCloseBtn.addEventListener('click', () => { if (exportModal) exportModal.style.display = 'none'; });
  if (importModalCloseBtn) importModalCloseBtn.addEventListener('click', () => { if (importModal) importModal.style.display = 'none'; });

  // Globaler Klick-Listener für alle Modale  
  window.addEventListener('click', (e) => {
    if (e.target === postModal) postModal.style.display = 'none';
    else if (e.target === categoryModal) categoryModal.style.display = 'none';
    else if (e.target === folderModal) folderModal.style.display = 'none';
    else if (e.target === bulkCategoriesModal) bulkCategoriesModal.style.display = 'none';
    else if (e.target === bulkFolderModal) bulkFolderModal.style.display = 'none';
    else if (e.target === settingsModal) settingsModal.style.display = 'none';
    else if (e.target === summaryModal) summaryModal.style.display = 'none';
    else if (e.target === exportModal) exportModal.style.display = 'none';
    else if (e.target === importModal) importModal.style.display = 'none';
  });



  // Helper functions
  function toggleBulkMode() {
    isInBulkMode = !isInBulkMode;
    selectedPostIds = [];
    renderPosts();
    updateBulkActionsCount();
  }

  function selectAllPosts() {
    selectedPostIds = isInBulkMode ? filteredPosts.map(p => p.id) : [];
    renderPosts();
    updateBulkActionsCount();
  }

  async function confirmBulkDelete() {
    if (selectedPostIds.length === 0) return;
    
    if (confirm(`Möchten Sie ${selectedPostIds.length} Posts wirklich löschen?`)) {
      await Storage.deletePosts(selectedPostIds);
      selectedPostIds = [];
      await initialize();
    }
  }

  function cancelBulkMode() {
    isInBulkMode = false;
    selectedPostIds = [];
    renderPosts();
    updateBulkActionsCount();
  }

  function updateBulkActionsCount() {
    if (bulkActionsCount) {
      bulkActionsCount.textContent = selectedPostIds.length;
    }
  }

  function updateBulkModeCheckboxes() {
    document.querySelectorAll('.post-select-checkbox').forEach(checkbox => {
      checkbox.checked = selectedPostIds.includes(checkbox.dataset.postId);
    });
  }

  function attachPostActionListeners() {
    // View buttons
    document.querySelectorAll('.view-post-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const postId = e.currentTarget.dataset.postId;
        const post = posts.find(p => p.id === postId);
        if (post) {
          displayPostInModal(post);
        }
      });
    });

    // Delete buttons
    document.querySelectorAll('.delete-post-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        const postId = e.currentTarget.dataset.postId;
        if (confirm('Möchten Sie diesen Post wirklich löschen?')) {
          await Storage.deletePost(postId);
          await initialize();
        }
      });
    });

    // Checkbox listeners
    document.querySelectorAll('.post-select-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const postId = e.target.dataset.postId;
        if (e.target.checked) {
          if (!selectedPostIds.includes(postId)) {
            selectedPostIds.push(postId);
          }
        } else {
          selectedPostIds = selectedPostIds.filter(id => id !== postId);
        }
        updateBulkActionsCount();
      });
    });
  }

  function displayPostInModal(post) {
    console.log('displayPostInModal aufgerufen mit Post:', post); // Debug-Log

    if (!post) {
        console.error('Kein Post-Objekt für displayPostInModal erhalten.');
        return;
    }

    const postModal = document.getElementById('post-modal');
    const modalTitleEl = document.getElementById('modal-title');
    const modalContentEl = document.getElementById('modal-content');

    if (!postModal || !modalTitleEl || !modalContentEl) {
        console.error('Modal-Elemente nicht gefunden für displayPostInModal.');
        return;
    }

    // Setze Modal-Titel (Nutze PostProcessor.generateSummary für eine kürzere, lesbare Überschrift)
    modalTitleEl.textContent = PostProcessor.generateSummary(post.content, 50);

    // Befülle den Modal-Inhalt
    modalContentEl.innerHTML = `
        <div class="modal-post-header">
            <div class="modal-post-author">${post.author || 'Unbekannter Autor'}</div>
            <div class="modal-post-date">${post.savedAt ? new Date(post.savedAt).toLocaleString() : 'N/A'}</div>
        </div>
        <div class="modal-post-content">${post.content || 'Kein Inhalt verfügbar.'}</div>
        <div class="modal-post-link">
            <a href="${post.url}" target="_blank">
                <span class="material-icons-round">open_in_new</span> Zum Original-Post
            </a>
        </div>
        ${post.images && post.images.length > 0 ? `<div class="modal-post-images">
            ${post.images.map(imgSrc => `<img src="${imgSrc}" alt="Post image" style="max-width: 200px; max-height: 200px; object-fit: contain; margin-right: 5px; border-radius: 4px;">`).join('')}
        </div>` : ''}
        <div class="modal-post-categories">
            <span class="modal-post-categories-title">Kategorien:</span>
            ${(post.categories || []).map(cat => `<span class="category-tag">${cat}</span>`).join('') || 'Keine'}
        </div>
        <div class="modal-post-folder">
            <span class="modal-post-folder-title">Ordner:</span>
            <span class="modal-post-folder-value">
                ${post.folder ? `<span class="material-icons-round">folder</span>${post.folder}` : 'Kein Ordner'}
            </span>
        </div>
        <div class="modal-post-notes">
            <span class="modal-post-notes-title">Notizen:</span>
            <div class="modal-post-notes-content" contenteditable="true" data-post-id="${post.id}">${post.notes || 'Keine Notizen.'}</div>
        </div>
        <div class="modal-post-actions">
            <button class="modal-post-action primary save-notes-btn" data-post-id="${post.id}">
                <span class="material-icons-round">save</span> Notizen speichern
            </button>
            <button class="modal-post-action danger delete-single-post-btn" data-post-id="${post.id}">
                <span class="material-icons-round">delete</span> Löschen
            </button>
        </div>
    `;

        postModal.style.display = 'block'; // Modal anzeigen

        // Event-Listener für Notizen und Löschen im Modal hinzufügen
        // Diese Listener müssen HIER angehängt werden, da die Elemente dynamisch erstellt wurden.
        const notesContentEl = modalContentEl.querySelector('.modal-post-notes-content');
        if (notesContentEl) {
            notesContentEl.addEventListener('blur', async (e) => {
                const updatedNotes = e.target.textContent;
                await Storage.bulkUpdatePosts([post.id], { notes: updatedNotes });
                console.log('Notizen im Modal aktualisiert für Post:', post.id);
                // loadData(); // Könnte man hier auch machen, um die UI im Hintergrund zu aktualisieren
            });
        }

        const saveNotesBtn = modalContentEl.querySelector('.save-notes-btn');
        if (saveNotesBtn) {
            saveNotesBtn.addEventListener('click', async () => {
                const notes = modalContentEl.querySelector('.modal-post-notes-content').textContent;
                await Storage.bulkUpdatePosts([post.id], { notes: notes });
                alert('Notizen gespeichert!');
                await initialize(); // Reload data to reflect changes in the main list
            });
        }

        const deleteSinglePostBtn = modalContentEl.querySelector('.delete-single-post-btn');
        if (deleteSinglePostBtn) {
            deleteSinglePostBtn.addEventListener('click', async () => {
                if (confirm('Möchten Sie diesen Post wirklich löschen?')) {
                    await Storage.deletePost(post.id);
                    postModal.style.display = 'none'; // Modal schließen
                    await initialize(); // Posts neu laden und rendern
                }
            });
        }
    }

  function renderFolders() {
    const folderList = document.getElementById('folder-list');
    if (!folderList) return;

    const postsWithoutFolder = posts.filter(post => !post.folder).length;
    
    folderList.innerHTML = `
      <div class="filter-item ${activeFolder === '' ? 'active' : ''}" data-filter="all">
        <span>Alle Posts</span>
        <span class="count">${posts.length}</span>
      </div>
      <div class="filter-item ${activeFolder === 'none' ? 'active' : ''}" data-filter="none">
        <span>Ohne Ordner</span>
        <span class="count">${postsWithoutFolder}</span>
      </div>
    `;

    folders.forEach(folder => {
      const count = posts.filter(post => post.folder === folder).length;
      const filterItem = document.createElement('div');
      filterItem.className = `filter-item ${activeFolder === folder ? 'active' : ''}`;
      filterItem.innerHTML = `
        <span>${folder}</span>
        <span class="count">${count}</span>
      `;
      filterItem.addEventListener('click', () => {
        activeFolder = folder;
        filterPosts();
        renderFolders();
      });
      folderList.appendChild(filterItem);
    });

    // Event handlers for "All" and "None"
    const allItem = folderList.querySelector('[data-filter="all"]');
    const noneItem = folderList.querySelector('[data-filter="none"]');
    
    if (allItem) {
      allItem.addEventListener('click', () => {
        activeFolder = '';
        filterPosts();
        renderFolders();
      });
    }
    
    if (noneItem) {
      noneItem.addEventListener('click', () => {
        activeFolder = 'none';
        filterPosts();
        renderFolders();
      });
    }
  }

  // Helper functions for clustering modal
  function switchSummaryTab(tab) {
    document.querySelectorAll('.summary-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.summary-content').forEach(content => content.classList.add('hidden'));

    if (tab === 'summary') {
      const summaryTab = document.getElementById('tab-summary');
      const summaryContent = document.getElementById('summary-content');
      if (summaryTab) summaryTab.classList.add('active');
      if (summaryContent) summaryContent.classList.remove('hidden');
    } else if (tab === 'similarities') {
      const similaritiesTab = document.getElementById('tab-similarities');
      const similaritiesContent = document.getElementById('similarities-content');
      if (similaritiesTab) similaritiesTab.classList.add('active');
      if (similaritiesContent) similaritiesContent.classList.remove('hidden');
    } else if (tab === 'clusters') {
      const clustersTab = document.getElementById('tab-clusters');
      const clustersContent = document.getElementById('clusters-content');
      if (clustersTab) clustersTab.classList.add('active');
      if (clustersContent) clustersContent.classList.remove('hidden');
    }
  }

  function renderSimilarityMatrix(matrix) {
    const matrixContainer = document.getElementById('similarity-matrix');
    if (!matrixContainer || !matrix || matrix.length === 0) {
      if (matrixContainer) matrixContainer.innerHTML = '<p>Keine Ähnlichkeitsdaten verfügbar.</p>';
      return;
    }

    let tableHTML = '<table class="similarity-table"><thead><tr><th></th>';
    posts.forEach((p, index) => {
      tableHTML += `<th>P${index + 1}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';

    posts.forEach((pRow, rowIndex) => {
      tableHTML += `<tr><th>P${rowIndex + 1}</th>`;
      if (matrix[rowIndex]) {
        matrix[rowIndex].forEach((score, colIndex) => {
          const displayScore = Math.round(score * 100);
          const bgColor = `hsl(${120 * score}, 70%, 70%)`;
          tableHTML += `<td style="background-color: ${bgColor};">${displayScore}%</td>`;
        });
      }
      tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table>';
    matrixContainer.innerHTML = tableHTML;
  }

  function renderClusters(clusters) {
    const clusterVizContainer = document.getElementById('cluster-visualization');
    if (!clusterVizContainer || !clusters || clusters.length === 0) {
      if (clusterVizContainer) clusterVizContainer.innerHTML = '<p>Keine Cluster identifiziert.</p>';
      return;
    }

    clusterVizContainer.innerHTML = '';
    clusters.forEach((cluster, index) => {
      const clusterEl = document.createElement('div');
      clusterEl.className = 'cluster';
      
      const clusterPosts = cluster.map(postId => {
        const post = posts.find(p => p.id === postId);
        return post ? `<div class="cluster-post"><strong>${post.author}</strong>: ${post.content.substring(0, 80)}...</div>` : '';
      }).join('');

      clusterEl.innerHTML = `
        <div class="cluster-header">
          <span>Cluster ${index + 1}</span>
          <span>(${cluster.length} Posts)</span>
        </div>
        <div class="cluster-content">
          <div class="cluster-posts">${clusterPosts}</div>
        </div>
      `;
      
      clusterVizContainer.appendChild(clusterEl);
    });
  }

  // Add event listeners for clustering modal tabs
  const summaryTabBtn = document.getElementById('tab-summary');
  const similaritiesTabBtn = document.getElementById('tab-similarities');
  const clustersTabBtn = document.getElementById('tab-clusters');
  
  if (summaryTabBtn) summaryTabBtn.addEventListener('click', () => switchSummaryTab('summary'));
  if (similaritiesTabBtn) similaritiesTabBtn.addEventListener('click', () => switchSummaryTab('similarities'));
  if (clustersTabBtn) clustersTabBtn.addEventListener('click', () => switchSummaryTab('clusters'));

  // Initialize everything
  await initialize();
  switchTab('categories'); // Start with categories tab

  console.log('Sidebar v3.6 fully initialized - 1:1 Feedback Implementation');
});