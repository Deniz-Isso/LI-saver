// LinkedIn Post Extractor - Detects and extracts post content from LinkedIn
console.log('LinkedIn Post Extractor v1.1 loaded');

// Aktualisierte LinkedIn-Selektoren für 2025
const SELECTORS = {
  // Hauptcontainer für Posts
  FEED_CONTAINER: 'div.scaffold-finite-scroll__content, div.scaffold-layout__main, main.scaffold-layout__main',
  POST_CONTAINER: 'div.feed-shared-update-v2, article.relative, div[data-urn], div.feed-shared-update, article.feed-shared-update-v2',
  
  // Post-Inhalt Selektoren (erweitert für aktuelle LinkedIn-Struktur)
  POST_CONTENT: [
    'div[data-test-id="main-feed-activity-card"] .feed-shared-text span[dir]',
    '.feed-shared-update-v2__description .feed-shared-text span[dir]',
    '.update-components-text span[dir]',
    'div.feed-shared-inline-show-more-text span[dir]',
    '.feed-shared-text__text-view span',
    '.break-words',
    'div[data-test-id="update-components-text"] span'
  ],
  
  // Autor-Selektoren (erweitert)
  AUTHOR_NAME: [
    'div[data-test-id="main-feed-activity-card"] .feed-shared-actor__name a',
    '.feed-shared-actor__name a span[aria-hidden="true"]',
    '.update-components-actor__name a',
    'a[data-test-id="actor-name"]',
    '.feed-shared-actor__title a span'
  ],
  AUTHOR_HEADLINE: '.feed-shared-actor__description, .update-components-actor__description, span[data-test-id="actor-headline"]',
  
  // Media selectors
  IMAGES: '.feed-shared-image__container img, .feed-shared-carousel__item img, div.update-components-image img, .feed-shared-image img, .feed-shared-mini-update-v2__image-container img, .feed-shared-linkedin-video, .feed-shared-update-v2__content figure img',
  
  // Time selectors
  TIMESTAMP: '.feed-shared-actor__sub-description, .feed-shared-actor__sub-description a, span.update-components-actor__sub-description, .update-components-actor__sub-description span, .feed-shared-actor__sub-description span, time.feed-shared-actor__sub-description',
  
  // Action buttons
  ACTION_BAR: '.feed-shared-social-action-bar, div.social-details-social-actions, .update-components-social-actions, .feed-shared-social-actions',
  
  // Article selectors
  ARTICLE_TITLE: '.feed-shared-article__title, div.update-components-article__title, .update-components-article__title-text, .feed-shared-article__title span',
  ARTICLE_DESCRIPTION: '.feed-shared-article__description, div.update-components-article__description, .feed-shared-article__description span',
  ARTICLE_LINK: '.feed-shared-article__meta a, div.update-components-article__meta a, .feed-shared-article__link a, .feed-shared-article__container a[data-tracking-control-name="article_meta"]',
  
  // Post page (individual post) selectors
  POST_PAGE_CONTENT: '.feed-shared-update-v2__description .feed-shared-inline-show-more-text, div.update-components-text__text-view, .feed-shared-update-v2__description span[dir="ltr"], .update-components-text span',
  POST_PAGE_AUTHOR: '.feed-shared-actor__name a, .feed-shared-actor__title, span.update-components-actor__name, span.update-components-actor__title, .update-components-actor__title span, .feed-shared-actor__container a[href*="/in/"]',
};

// Store the current visible post data
let currentVisiblePostData = null;
let isObserving = false;
let scrollTimeout = null;
let mutationObserver = null;
let resizeObserver = null;
let savedPostIds = new Set();

// Listen for messages from the popup or background scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request.action);
  
  switch (request.action) {
    case 'extractCurrentPost':
      // If we already have current post data, use it, otherwise extract it
      const postData = currentVisiblePostData || extractCurrentPostData();
      sendResponse(postData);
      break;
      
    case 'extractSpecificPost':
      // Extract a specific post when given a post element selector
      if (request.selector) {
        const postElement = document.querySelector(request.selector);
        if (postElement) {
          const extractedData = extractDataFromPostElement(postElement);
          sendResponse(extractedData);
        } else {
          sendResponse(null);
        }
      } else {
        sendResponse(null);
      }
      break;
      
    case 'startObserving':
      // Start the observation process if not already observing
      if (!isObserving) {
        startObserving();
        sendResponse({ success: true });
      } else {
        sendResponse({ success: true, alreadyObserving: true });
      }
      break;
      
    case 'stopObserving':
      // Stop the observation process
      if (isObserving) {
        stopObserving();
        sendResponse({ success: true });
      } else {
        sendResponse({ success: true, notObserving: true });
      }
      break;
      
    case 'getCurrentPostData':
      // Just return the current post data without extracting again
      sendResponse(currentVisiblePostData);
      break;
      
    case 'postSaved':
      // Mark a post as saved
      if (request.postId) {
        savedPostIds.add(request.postId);
        
        // Update UI to show the post is saved
        updateSavedPostUI();
        
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'No post ID provided' });
      }
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
  
  // Return true to indicate we'll send the response asynchronously
  return true;
});

// Start observing automatically when the script loads
startObserving();

// Main function to extract data from the current most visible post
function extractCurrentPostData() {
  console.log('Extracting current post data...');
  
  // Find the most visible post
  const postElement = findMostVisiblePost();
  
  if (!postElement) {
    console.log('No visible post found');
    return null;
  }
  
  return extractDataFromPostElement(postElement);
}

// Find the post element that is most visible in the viewport
function findMostVisiblePost() {
  // Get all post elements
  const postElements = document.querySelectorAll(SELECTORS.POST_CONTAINER);
  
  if (!postElements || postElements.length === 0) {
    console.log('No post elements found');
    return null;
  }
  
  console.log(`Found ${postElements.length} post elements`);
  
  let maxVisibility = 0;
  let mostVisiblePost = null;
  
  // Calculate the visibility percentage of each post
  postElements.forEach(post => {
    const rect = post.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Skip if not visible at all
    if (rect.bottom < 0 || rect.top > windowHeight) {
      return;
    }
    
    // Calculate how much of the post is visible
    const visibleTop = Math.max(rect.top, 0);
    const visibleBottom = Math.min(rect.bottom, windowHeight);
    const visibleHeight = visibleBottom - visibleTop;
    
    // Calculate visibility as a percentage of post height
    const percentVisible = Math.min(100, (visibleHeight / rect.height) * 100);
    
    // Also consider the absolute position - prefer posts in the middle of the screen
    const distanceFromCenter = Math.abs((rect.top + rect.bottom) / 2 - windowHeight / 2);
    const positionScore = 1 - (distanceFromCenter / windowHeight);
    
    // Combined score (80% visibility, 20% position)
    const score = (percentVisible * 0.8) + (positionScore * 20);
    
    if (score > maxVisibility) {
      maxVisibility = score;
      mostVisiblePost = post;
    }
  });
  
  if (mostVisiblePost) {
    console.log('Found most visible post with visibility score:', maxVisibility);
  }
  
  return mostVisiblePost;
}

// Extract a specific post when given the element
function extractSpecificPost(selector) {
  const postElement = document.querySelector(selector);
  
  if (!postElement) {
    console.log(`No post element found with selector: ${selector}`);
    return null;
  }
  
  return extractDataFromPostElement(postElement);
}

// Extract data from a post element
function extractDataFromPostElement(postElement) {
  if (!postElement) return null;
  
  try {
    // Generate a unique ID for the post based on its content
    const postContent = getPostText(postElement);
    const postId = generatePostId(postElement, postContent);
    
    // Get author information - Komplett überarbeitete Extraktion
    let authorName = 'Unbekannter Autor';
    
    // Erweiterte Autor-Selektoren für LinkedIn 2025
    const authorSelectors = [
      // Primäre LinkedIn-Struktur
      '.feed-shared-actor__name a span[aria-hidden="true"]',
      '.feed-shared-actor__name a span',
      '.feed-shared-actor__name a',
      '.feed-shared-actor__name span',
      // Alternative Strukturen
      '.update-components-actor__name a span[aria-hidden="true"]',
      '.update-components-actor__name a span',
      '.update-components-actor__name a',
      '.update-components-actor__name span',
      // Erweiterte Suche
      'a[data-test-id="actor-name"] span',
      'a[data-test-id="actor-name"]',
      'a[href*="/in/"] span[aria-hidden="true"]',
      'a[href*="/in/"] span',
      'a[href*="/in/"]',
      // Breitere Fallbacks
      '[role="article"] .feed-shared-actor__name span',
      '[role="article"] a[href*="/in/"] span',
      'div[data-urn] .feed-shared-actor__name span'
    ];
    
    for (const selector of authorSelectors) {
      try {
        const authorElement = postElement.querySelector(selector);
        if (authorElement && authorElement.textContent.trim()) {
          const rawName = authorElement.textContent.trim();
          // Bereinige den Namen
          const cleanName = rawName
            .replace(/\s+/g, ' ')
            .replace(/^\s*•\s*/, '') // Entferne Bullet-Points
            .trim();
          
          if (cleanName.length > 2 && cleanName !== 'LinkedIn' && !cleanName.includes('connections')) {
            authorName = cleanName;
            console.log('Found author with selector:', selector, 'Name:', authorName);
            break;
          }
        }
      } catch (error) {
        console.log('Error with author selector:', selector, error);
      }
    }
    
    console.log('Final extracted author name:', authorName);
    
    // Get author headline/description
    const headlineElement = postElement.querySelector(SELECTORS.AUTHOR_HEADLINE);
    const authorHeadline = headlineElement ? headlineElement.textContent.trim() : '';
    
    // Get post timestamp
    const timestampElement = postElement.querySelector(SELECTORS.TIMESTAMP);
    // Improved timestamp extraction - normalize and remove extraneous text
    let timestamp = '';
    if (timestampElement) {
      timestamp = timestampElement.textContent.trim()
        .replace(/^(.*?)\s*•\s*/, '')  // Remove anything before the bullet point if present
        .replace(/^([0-9]+\s*[hm]|[0-9]+\s*Min\.|[0-9]+\s*Std\.|[0-9]+\s*Tag)/i, '$1'); // Keep only the time part
    }
    
    // Get post URL
    // For feed items, we might need to construct the URL
    let postUrl = window.location.href;
    
    // Find any links that might point to the post itself
    const possiblePostLinks = postElement.querySelectorAll('a[href*="/posts/"], a[href*="/feed/update/"]');
    if (possiblePostLinks && possiblePostLinks.length > 0) {
      // Use the first link that seems to point to a post
      postUrl = possiblePostLinks[0].href;
    }
    
    // Extract image URLs
    const imageElements = postElement.querySelectorAll(SELECTORS.IMAGES);
    const images = Array.from(imageElements).map(img => img.src).filter(Boolean);
    
    // Look for article data if this is a shared article
    let articleTitle = '';
    let articleDescription = '';
    let articleUrl = '';
    
    const articleTitleElement = postElement.querySelector(SELECTORS.ARTICLE_TITLE);
    if (articleTitleElement) {
      articleTitle = articleTitleElement.textContent.trim();
      
      const articleDescElement = postElement.querySelector(SELECTORS.ARTICLE_DESCRIPTION);
      articleDescription = articleDescElement ? articleDescElement.textContent.trim() : '';
      
      const articleLinkElement = postElement.querySelector(SELECTORS.ARTICLE_LINK);
      articleUrl = articleLinkElement ? articleLinkElement.href : '';
    }
    
    // Create result object
    const extractedData = {
      id: postId,
      author: authorName,
      authorHeadline: authorHeadline,
      content: postContent,
      timestamp: timestamp,
      url: postUrl,
      images: images,
      articleTitle: articleTitle,
      articleDescription: articleDescription,
      articleUrl: articleUrl
    };
    
    console.log('Extracted post data:', extractedData);
    return extractedData;
  } catch (error) {
    console.error('Error extracting post data:', error);
    return null;
  }
}

// Helper function to get the text content of a post
function getPostText(postElement) {
  console.log('Extracting post text from element:', postElement);
  
  // Erweiterte Selektoren für LinkedIn 2025 - alle möglichen Varianten
  const contentSelectors = [
    // Primäre LinkedIn-Struktur 2025
    '.feed-shared-update-v2__description',
    '.feed-shared-text',
    '.update-components-text',
    // Spezifische Text-Container
    '[data-test-id="update-components-text"]',
    '.break-words',
    // Alternative Strukturen
    '.feed-shared-update-v2__description-wrapper .break-words',
    '.feed-shared-inline-show-more-text',
    // Span-basierte Selektoren
    '.feed-shared-update-v2__description span',
    '.feed-shared-text span', 
    '.update-components-text span',
    // Breitere Suche
    '[role="article"] .break-words',
    'div[data-urn] .break-words',
    // Fallback für alle Text-Container
    'div[data-id*="urn:li:activity"] .break-words'
  ];
  
  // Versuche jeden Selektor
  for (const selector of contentSelectors) {
    try {
      const elements = postElement.querySelectorAll(selector);
      if (elements.length > 0) {
        // Sammle den Text von allen gefundenen Elementen
        let fullText = '';
        elements.forEach(el => {
          const text = el.textContent.trim();
          if (text && text.length > 10) { // Mindestlänge für relevanten Content
            fullText += text + ' ';
          }
        });
        
        if (fullText.trim()) {
          console.log('Found content with selector:', selector, fullText.substring(0, 100) + '...');
          return fullText.trim();
        }
      }
    } catch (error) {
      console.log('Error with selector:', selector, error);
    }
  }
  
  // Versuche auch alternative Methoden
  const textContent = postElement.textContent;
  if (textContent && textContent.length > 50) {
    // Extrahiere relevanten Text und entferne UI-Elemente
    const cleanText = textContent
      .replace(/(\d+\s+reactions?|\d+\s+comments?|\d+\s+reposts?)/gi, '')
      .replace(/(Like|Comment|Repost|Send)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (cleanText.length > 20) {
      console.log('Extracted text content:', cleanText.substring(0, 100) + '...');
      return cleanText;
    }
  }
  
  console.log('No meaningful content found');
  return 'Kein Inhalt verfügbar';
}

// Generate a unique ID for a post
function generatePostId(postElement, content) {
  // Try to extract a post ID from the post element
  // Many LinkedIn posts have a data-urn attribute with a unique identifier
  const urnAttr = postElement.getAttribute('data-urn');
  
  if (urnAttr) {
    // Format is often urn:li:activity:12345
    const urnMatch = urnAttr.match(/urn:li:activity:(\d+)/);
    if (urnMatch && urnMatch[1]) {
      return `li_${urnMatch[1]}`;
    }
  }
  
  // If we can't find a data-urn, try to find a unique identifier in any ID attribute
  const idAttr = postElement.id;
  if (idAttr && idAttr.includes('ember')) {
    return `ember_${idAttr.replace(/\D/g, '')}`;
  }
  
  // As a last resort, create a hash from the content
  return 'post_' + Math.abs(hashString(content || 'unknown')).toString(16);
}

// Simple string hash function
function hashString(str) {
  let hash = 0;
  
  if (str.length === 0) return hash;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return hash;
}

// Start observing for changes to detect posts
function startObserving() {
  if (isObserving) return;
  
  console.log('Starting observation of LinkedIn feed');
  
  // Initialize observers
  setupMutationObserver();
  setupResizeObserver();
  
  // Add scroll listener
  window.addEventListener('scroll', handleScroll);
  
  // Set status
  isObserving = true;
  
  // Update the current post data immediately
  updateCurrentPostData();
  
  // Add save buttons to visible posts
  addSaveButtonsToVisiblePosts();
}

// Stop observing changes
function stopObserving() {
  if (!isObserving) return;
  
  console.log('Stopping observation of LinkedIn feed');
  
  // Disconnect observers
  if (mutationObserver) {
    mutationObserver.disconnect();
  }
  
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  
  // Remove event listeners
  window.removeEventListener('scroll', handleScroll);
  
  // Clear timeout
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  
  // Reset status
  isObserving = false;
}

// Set up mutation observer to watch for changes to the DOM
function setupMutationObserver() {
  // Find a more specific container to observe if possible
  const feedContainer = document.querySelector(SELECTORS.FEED_CONTAINER) || document.body;
  
  // Create a new mutation observer instance
  mutationObserver = new MutationObserver(handleMutation);
  
  // Configure observer to watch for changes to the DOM structure
  const config = {
    childList: true,   // Watch for child node changes
    subtree: true,     // Watch for changes in the entire subtree
    attributes: false, // Don't watch for attribute changes
    characterData: false // Don't watch for character data changes
  };
  
  // Start observing the specified element
  mutationObserver.observe(feedContainer, config);
  
  console.log('Mutation observer set up on', feedContainer);
}

// Set up resize observer
function setupResizeObserver() {
  // Create a new resize observer instance
  resizeObserver = new ResizeObserver(handleResize);
  
  // Find posts to observe
  const posts = document.querySelectorAll(SELECTORS.POST_CONTAINER);
  
  // Start observing each post element
  posts.forEach(post => {
    resizeObserver.observe(post);
  });
  
  console.log(`Resize observer set up on ${posts.length} posts`);
}

// Handle scroll events
function handleScroll() {
  // Clear previous timeout
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  
  // Set a new timeout to update after scrolling stops
  scrollTimeout = setTimeout(() => {
    updateCurrentPostData();
    addSaveButtonsToVisiblePosts();
  }, 300); // 300ms delay to avoid excessive updates
}

// Handle resize events
function handleResize() {
  // Update the current post data when elements resize
  updateCurrentPostData();
}

// Handle mutation events
function handleMutation(mutations) {
  // Look for relevant mutations
  const relevantMutation = mutations.some(mutation => {
    // Check if added nodes contain post elements
    if (mutation.addedNodes.length > 0) {
      return Array.from(mutation.addedNodes).some(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          return node.matches?.(SELECTORS.POST_CONTAINER) || 
                 node.querySelector?.(SELECTORS.POST_CONTAINER);
        }
        return false;
      });
    }
    return false;
  });
  
  // Update if relevant changes found
  if (relevantMutation) {
    updateCurrentPostData();
    addSaveButtonsToVisiblePosts();
  }
}

// Update the current post data
function updateCurrentPostData() {
  // Find the most visible post
  currentVisiblePostData = extractCurrentPostData();
  
  // Update saved status UI in case visibility has changed
  updateSavedPostUI();
}

// Add 'Save' buttons to visible posts
function addSaveButtonsToVisiblePosts() {
  // Get all visible post elements
  const postElements = document.querySelectorAll(SELECTORS.POST_CONTAINER);
  
  postElements.forEach(post => {
    // Skip if already processed
    if (post.dataset.saveBtnAdded) return;
    
    // Mark as processed
    post.dataset.saveBtnAdded = 'true';
    
    // Find action bar
    const actionBar = post.querySelector(SELECTORS.ACTION_BAR);
    if (!actionBar) return;
    
    // Extract post data to check if it's already saved
    const postData = extractDataFromPostElement(post);
    if (!postData) return;
    
    // Create save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'save-post-btn';
    saveBtn.dataset.postId = postData.id;
    saveBtn.innerHTML = savedPostIds.has(postData.id) ? 
                         '<span>✓ Gespeichert</span>' : 
                         '<span>💾 Speichern</span>';
    
    // Style the button
    saveBtn.style.border = 'none';
    saveBtn.style.background = savedPostIds.has(postData.id) ? '#e7f3ff' : 'transparent';
    saveBtn.style.color = savedPostIds.has(postData.id) ? '#0a66c2' : '#666';
    saveBtn.style.padding = '4px 8px';
    saveBtn.style.borderRadius = '4px';
    saveBtn.style.margin = '0 8px';
    saveBtn.style.cursor = 'pointer';
    saveBtn.style.fontWeight = '600';
    saveBtn.style.fontSize = '14px';
    saveBtn.style.transition = 'all 0.2s';
    
    // Add hover effect
    saveBtn.addEventListener('mouseover', () => {
      saveBtn.style.background = savedPostIds.has(postData.id) ? '#dceaf8' : '#f3f3f3';
    });
    
    saveBtn.addEventListener('mouseout', () => {
      saveBtn.style.background = savedPostIds.has(postData.id) ? '#e7f3ff' : 'transparent';
    });
    
    // Add click handler
    saveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (savedPostIds.has(postData.id)) {
        // Already saved - maybe show a message
        alert('Dieser Post wurde bereits gespeichert.');
      } else {
        // Extract and send post data to popup for saving
        chrome.runtime.sendMessage(
          { 
            action: 'savePost',
            postData: postData
          },
          (response) => {
            if (response && response.success) {
              // Mark as saved
              savedPostIds.add(postData.id);
              saveBtn.innerHTML = '<span>✓ Gespeichert</span>';
              saveBtn.style.background = '#e7f3ff';
              saveBtn.style.color = '#0a66c2';
            } else {
              const errorMessage = response && response.error === 'duplicate' ?
                'Dieser Post wurde bereits gespeichert.' :
                'Fehler beim Speichern des Posts.';
              
              alert(errorMessage);
            }
          }
        );
      }
    });
    
    // Append to action bar
    actionBar.appendChild(saveBtn);
  });
}

// Update UI for saved posts
function updateSavedPostUI() {
  // Find all save buttons
  const saveButtons = document.querySelectorAll('.save-post-btn');
  
  saveButtons.forEach(btn => {
    const postId = btn.dataset.postId;
    const isSaved = savedPostIds.has(postId);
    
    if (isSaved) {
      btn.innerHTML = '<span>✓ Gespeichert</span>';
      btn.style.background = '#e7f3ff';
      btn.style.color = '#0a66c2';
    } else {
      btn.innerHTML = '<span>💾 Speichern</span>';
      btn.style.background = 'transparent';
      btn.style.color = '#666';
    }
  });
}
