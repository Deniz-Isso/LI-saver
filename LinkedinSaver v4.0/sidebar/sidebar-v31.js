// Professional Post Saver - Sidebar v3.1
// Systematische Behebung aller kritischen Probleme basierend auf Gemini-Analyse

document.addEventListener('DOMContentLoaded', async function() {
  console.log('Sidebar v3.1 loaded - Starting with complete fixes');

  // DOM Elements - Korrekte IDs basierend auf sidebar.html
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
  
  // Tabs
  const tabCategories = document.getElementById('tab-categories');
  const tabFolders = document.getElementById('tab-folders');
  const tabSettings = document.getElementById('tab-settings');
  const categoriesContent = document.getElementById('categories-content');
  const foldersContent = document.getElementById('folders-content');
  const settingsContent = document.getElementById('settings-content');
  
  // Action buttons - KORRIGIERTE IDs
  const bulkActionsBtn = document.getElementById('bulk-actions-btn');
  const selectAllBtn = document.getElementById('bulk-select-all');
  const bulkDeleteBtn = document.getElementById('bulk-delete');
  const bulkCategoriesBtn = document.getElementById('bulk-add-categories');
  const bulkFolderBtn = document.getElementById('bulk-move-folder');
  const cancelBulkBtn = document.getElementById('bulk-cancel');
  const bulkActionsCount = document.getElementById('selected-count');
  
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

  // Initialize AI Service
  async function initializeAIService() {
    try {
      await AIService.initAIService();
      console.log('AI Service initialized successfully');
    } catch (error) {
      console.error('AI Service initialization failed:', error);
    }
  }

  // Load all data
  async function loadData() {
    try {
      console.log('Loading data...');
      posts = await Storage.getSavedPosts() || [];
      categories = await Storage.getCategories() || [];
      folders = await Storage.getFolders() || [];
      
      console.log('Loaded posts:', posts.length);
      console.log('Loaded categories:', categories.length);
      console.log('Loaded folders:', folders.length);
      
      filteredPosts = [...posts];
      renderPosts();
      renderCategories();
      renderFolders();
    } catch (error) {
      console.error('Error loading data:', error);
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

  // VERBESSERTE renderPosts-Funktion
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

  // VERBESSERTE filterPosts-Funktion basierend auf Analyse
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

  // Event handlers - KORREKTE Implementierung
  function handleSearch(e) {
    searchTerm = e.target.value.toLowerCase();
    console.log('Searching for:', searchTerm);
    filterPosts(); // Verwende filterPosts für konsistente Filterung
  }

  function handleSort(e) {
    sortMethod = e.target.value;
    console.log('Sorting by:', sortMethod);
    filterPosts(); // Verwende filterPosts für konsistente Sortierung
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

  // VOLLSTÄNDIG IMPLEMENTIERTE Clustering-Funktion
  async function showClusteringModal() {
    const summaryModal = document.getElementById('summary-modal');
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

  // Event listeners
  
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
  
  // Bulk actions - NUR wenn Elemente existieren
  if (bulkActionsBtn) {
    bulkActionsBtn.addEventListener('click', toggleBulkMode);
  }
  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', selectAllPosts);
  }
  if (bulkDeleteBtn) {
    bulkDeleteBtn.addEventListener('click', confirmBulkDelete);
  }
  if (cancelBulkBtn) {
    cancelBulkBtn.addEventListener('click', cancelBulkMode);
  }
  
  // Modal close
  if (modalClose) {
    modalClose.addEventListener('click', () => {
      if (postModal) postModal.style.display = 'none';
    });
  }

  // Helper functions for bulk actions
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
      await loadData();
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
          await loadData();
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
    if (!postModal) return;
    
    if (modalPostAuthor) modalPostAuthor.textContent = post.author || 'Unbekannter Autor';
    if (modalPostContent) modalPostContent.textContent = post.content || 'Kein Inhalt verfügbar';
    if (modalPostDate) modalPostDate.textContent = new Date(post.savedAt || post.date).toLocaleString();
    if (modalPostCategories) modalPostCategories.innerHTML = (post.categories || []).map(cat => `<span class="category-tag">${cat}</span>`).join('');
    if (modalPostFolder) modalPostFolder.textContent = post.folder || 'Kein Ordner';
    if (modalPostLink && post.url) {
      modalPostLink.innerHTML = `<a href="${post.url}" target="_blank">Zum Original-Post</a>`;
    }
    
    postModal.style.display = 'block';
  }

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

  // Initialize everything
  await initializeAIService();
  await loadData();
  switchTab('categories'); // Start with categories tab

  console.log('Sidebar v3.1 fully initialized');
});