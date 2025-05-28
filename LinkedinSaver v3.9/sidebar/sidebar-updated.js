import * as Storage from '../utils/storage.js';
import * as PostProcessor from '../utils/post-processor.js';
import * as AIService from '../utils/ai-service.js';
import * as ApiKeySettings from './api-key-settings.js';

document.addEventListener('DOMContentLoaded', async () => {
  // DOM elements
  // Main UI elements
  const searchInput = document.getElementById('search-input');
  const categoryList = document.getElementById('category-list');
  const folderList = document.getElementById('folder-list');
  const sortSelect = document.getElementById('sort-select');
  const timeFilterSelect = document.getElementById('time-filter-select');
  const customDateContainer = document.getElementById('custom-date-container');
  const dateFromInput = document.getElementById('date-from');
  const dateToInput = document.getElementById('date-to');
  const applyCustomDateBtn = document.getElementById('apply-custom-date');
  const postsContainer = document.getElementById('posts-container');
  const emptyState = document.getElementById('empty-state');
  const noResults = document.getElementById('no-results');
  const clusteringBtn = document.getElementById('clustering-btn');
  
  // Tabs
  const tabCategories = document.getElementById('tab-categories');
  const tabFolders = document.getElementById('tab-folders');
  const tabSettings = document.getElementById('tab-settings');
  const categoriesContent = document.getElementById('categories-content');
  const foldersContent = document.getElementById('folders-content');
  const settingsContent = document.getElementById('settings-content');
  
  // Action buttons
  const bulkActionsBtn = document.getElementById('bulk-actions-btn');
  const selectAllBtn = document.getElementById('select-all-btn');
  const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
  const bulkCategoriesBtn = document.getElementById('bulk-categories-btn');
  const bulkFolderBtn = document.getElementById('bulk-folder-btn');
  const cancelBulkBtn = document.getElementById('cancel-bulk-btn');
  const bulkActionsCount = document.getElementById('bulk-actions-count');
  
  // Modal elements
  const postModal = document.getElementById('post-modal');
  const modalClose = document.getElementsByClassName('modal-close')[0];
  const modalPostAuthor = document.getElementById('modal-post-author');
  const modalPostContent = document.getElementById('modal-post-content');
  const modalPostDate = document.getElementById('modal-post-date');
  const modalPostImages = document.getElementById('modal-post-images');
  const modalPostLink = document.getElementById('modal-post-link');
  const modalPostCategories = document.getElementById('modal-post-categories');
  const modalPostFolder = document.getElementById('modal-post-folder');
  const modalPostNotes = document.getElementById('modal-post-notes');
  
  // Bulk categories modal
  const bulkCategoriesModal = document.getElementById('bulk-categories-modal');
  const bulkCategoriesList = document.getElementById('bulk-categories-list');
  const bulkCategoryInput = document.getElementById('bulk-category-input');
  const bulkCategorySuggestions = document.getElementById('bulk-category-suggestions');
  const bulkSelectedCategories = document.getElementById('bulk-selected-categories');
  const applyBulkCategoriesBtn = document.getElementById('apply-bulk-categories');
  const closeBulkCategoriesBtn = document.getElementById('close-bulk-categories');
  const suggestBulkCategoriesBtn = document.getElementById('suggest-bulk-categories');
  
  // Bulk folder modal
  const bulkFolderModal = document.getElementById('bulk-folder-modal');
  const bulkFolderSelect = document.getElementById('bulk-folder-select');
  const applyBulkFolderBtn = document.getElementById('apply-bulk-folder');
  const closeBulkFolderBtn = document.getElementById('close-bulk-folder');
  
  // Category management
  const addCategoryBtn = document.getElementById('add-category-btn');
  const newCategoryInput = document.getElementById('new-category-input');
  const manageCategoryList = document.getElementById('manage-category-list');
  
  // Folder management
  const addFolderBtn = document.getElementById('add-folder-btn');
  const newFolderInput = document.getElementById('new-folder-input');
  const manageFolderList = document.getElementById('manage-folder-list');
  
  // Data management
  const exportDataBtn = document.getElementById('export-data-btn');
  const importDataBtn = document.getElementById('import-data-btn');
  const importDataFile = document.getElementById('import-data-file');
  const importPreview = document.getElementById('import-preview');
  const applyImportBtn = document.getElementById('apply-import');
  const cancelImportBtn = document.getElementById('cancel-import');
  
  // Variables to store data and state
  let posts = [];
  let categories = [];
  let folders = [];
  let filteredPosts = [];
  let selectedPostIds = [];
  let bulkMode = false;
  let activeTab = 'categories';
  let activeCategory = '';
  let activeFolder = '';
  let searchTerm = '';
  let sortMethod = 'date_desc';
  let timeFilter = 'all';
  let customDateFrom = null;
  let customDateTo = null;
  
  // Initialize the app
  const initialize = async () => {
    // Initialize AI Service (OpenAI integration)
    await initializeAIService();
    
    // Initialize API Key Settings
    await ApiKeySettings.initApiKeySettings();
    
    // Load data
    await loadData();
    
    // Check if a specific tab should be opened from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'settings') {
      switchTab('settings');
    }
  };
  
  // Initialize AI Service
  async function initializeAIService() {
    try {
      const initialized = await AIService.initAIService();
      console.log('AI Service initialized:', initialized);
    } catch (error) {
      console.error('Error initializing AI Service:', error);
    }
  }
  
  // Load all data from storage
  async function loadData() {
    try {
      posts = await Storage.getSavedPosts();
      categories = await Storage.getCategories();
      folders = await Storage.getFolders();
      
      // Update the UI
      renderCategories();
      renderFolders();
      
      // Initially show all posts sorted by date
      filteredPosts = [...posts].sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
      renderPosts();
      
      // Update folder selects
      updateBulkFolderSelect();
      
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }
  
  // Event listeners
  
  // Tab switching
  tabCategories.addEventListener('click', () => switchTab('categories'));
  tabFolders.addEventListener('click', () => switchTab('folders'));
  if (tabSettings) {
    tabSettings.addEventListener('click', () => switchTab('settings'));
  }
  
  // Search input
  searchInput.addEventListener('input', handleSearch);
  
  // Sort select
  sortSelect.addEventListener('change', handleSort);
  
  // Time filter
  timeFilterSelect.addEventListener('change', handleTimeFilterChange);
  
  // Custom date
  applyCustomDateBtn.addEventListener('click', applyCustomDateFilter);
  
  // Clustering button
  clusteringBtn.addEventListener('click', showClusteringModal);
  
  // Bulk actions
  bulkActionsBtn.addEventListener('click', toggleBulkMode);
  selectAllBtn.addEventListener('click', selectAllPosts);
  bulkDeleteBtn.addEventListener('click', confirmBulkDelete);
  bulkCategoriesBtn.addEventListener('click', showBulkCategoriesModal);
  bulkFolderBtn.addEventListener('click', showBulkFolderModal);
  cancelBulkBtn.addEventListener('click', cancelBulkMode);
  
  // Post modal
  modalClose.addEventListener('click', () => postModal.style.display = 'none');
  window.addEventListener('click', (e) => {
    if (e.target === postModal) {
      postModal.style.display = 'none';
    }
  });
  
  // Bulk categories modal
  suggestBulkCategoriesBtn.addEventListener('click', suggestBulkCategories);
  bulkCategoryInput.addEventListener('input', () => {
    const input = bulkCategoryInput.value.trim();
    if (input) {
      const filteredCategories = categories.filter(cat => 
        cat.toLowerCase().includes(input.toLowerCase())
      );
      bulkCategorySuggestions.innerHTML = '';
      
      filteredCategories.forEach(category => {
        const suggestion = document.createElement('div');
        suggestion.className = 'suggestion-item';
        suggestion.textContent = category;
        suggestion.addEventListener('click', () => {
          const selectedCategories = Array.from(bulkSelectedCategories.querySelectorAll('.category-tag')).map(tag => tag.dataset.category);
          if (!selectedCategories.includes(category)) {
            addToBulkSelectedCategories(category);
          }
          bulkCategoryInput.value = '';
          bulkCategorySuggestions.innerHTML = '';
        });
        bulkCategorySuggestions.appendChild(suggestion);
      });
    } else {
      bulkCategorySuggestions.innerHTML = '';
    }
  });
  applyBulkCategoriesBtn.addEventListener('click', applyBulkCategories);
  closeBulkCategoriesBtn.addEventListener('click', () => bulkCategoriesModal.style.display = 'none');
  
  // Bulk folder modal
  applyBulkFolderBtn.addEventListener('click', applyBulkFolder);
  closeBulkFolderBtn.addEventListener('click', () => bulkFolderModal.style.display = 'none');
  
  // Category management
  addCategoryBtn.addEventListener('click', addNewCategory);
  
  // Folder management
  addFolderBtn.addEventListener('click', addNewFolder);
  
  // Data management
  exportDataBtn.addEventListener('click', downloadExportFile);
  importDataBtn.addEventListener('click', () => importDataFile.click());
  importDataFile.addEventListener('change', handleImportFileSelect);
  applyImportBtn.addEventListener('click', applyImport);
  cancelImportBtn.addEventListener('click', () => {
    importPreview.classList.add('hidden');
    importDataFile.value = '';
  });
  
  // Check for URL hash for settings tab
  if (window.location.hash === '#settings') {
    switchTab('settings');
  }
  
  // Initialize the app
  await initialize();
  
  function switchTab(tab) {
    console.log('Switching to tab:', tab);
    activeTab = tab;
    
    if (tab === 'categories') {
      tabCategories.classList.add('active');
      tabFolders.classList.remove('active');
      if (tabSettings) tabSettings.classList.remove('active');
      
      categoriesContent.classList.remove('hidden');
      foldersContent.classList.add('hidden');
      if (settingsContent) settingsContent.classList.add('hidden');
    } else if (tab === 'folders') {
      tabCategories.classList.remove('active');
      tabFolders.classList.add('active');
      if (tabSettings) tabSettings.classList.remove('active');
      
      categoriesContent.classList.add('hidden');
      foldersContent.classList.remove('hidden');
      if (settingsContent) settingsContent.classList.add('hidden');
    } else if (tab === 'settings') {
      tabCategories.classList.remove('active');
      tabFolders.classList.remove('active');
      if (tabSettings) tabSettings.classList.add('active');
      
      categoriesContent.classList.add('hidden');
      foldersContent.classList.add('hidden');
      if (settingsContent) settingsContent.classList.remove('hidden');
    }
    
    // Update window hash if needed
    if (tab === 'settings') {
      window.location.hash = 'settings';
    } else {
      // Remove hash if not settings
      if (window.location.hash) {
        history.replaceState('', document.title, window.location.pathname + window.location.search);
      }
    }
  }
