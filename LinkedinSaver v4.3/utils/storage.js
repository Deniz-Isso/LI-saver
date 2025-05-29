/**
 * Utility functions for storage operations
 */

// Normalize LinkedIn URL by removing tracking parameters
function normalizeUrl(url) {
  if (!url) return '';
  
  try {
    // Create URL object
    const urlObj = new URL(url);
    
    // Remove common tracking parameters
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 
     'trk', 'trackingId', 'lipi', 'share_id'].forEach(param => {
      urlObj.searchParams.delete(param);
    });
    
    // Remove hash if it's just a tracking identifier
    if (urlObj.hash && urlObj.hash.startsWith('#share-')) {
      urlObj.hash = '';
    }
    
    return urlObj.toString();
  } catch (e) {
    console.error('Error normalizing URL:', e);
    return url; // Return original URL if there was an error
  }
}

// Check if post already exists
async function postExists(post) {
  const savedPosts = await getSavedPosts();
  
  // Normalize URLs for comparison
  const normalizedNewUrl = normalizeUrl(post.url);
  
  return savedPosts.some(savedPost => {
    // If IDs match, it's a duplicate
    if (savedPost.id === post.id) return true;
    
    // Check if normalized URLs match
    const normalizedSavedUrl = normalizeUrl(savedPost.url);
    return normalizedNewUrl && normalizedNewUrl === normalizedSavedUrl;
  });
}

// Save a post to storage
async function savePost(post) {
  try {
    // Check if post already exists
    const exists = await postExists(post);
    if (exists) {
      return { success: false, error: 'duplicate' };
    }
    
    // Get existing posts
    const result = await chrome.storage.local.get('savedPosts');
    const savedPosts = result.savedPosts || [];
    
    // Add new post
    savedPosts.push(post);
    
    // Update storage
    await chrome.storage.local.set({ savedPosts });
    
    // Return success
    return { success: true };
  } catch (error) {
    console.error('Error saving post:', error);
    return { success: false, error: 'storage' };
  }
}

// Get all saved posts
async function getSavedPosts() {
  try {
    const result = await chrome.storage.local.get('savedPosts');
    return result.savedPosts || [];
  } catch (error) {
    console.error('Error getting saved posts:', error);
    return [];
  }
}

// Delete a post by ID
async function deletePost(postId) {
  try {
    // Get existing posts
    const result = await chrome.storage.local.get('savedPosts');
    let savedPosts = result.savedPosts || [];
    
    // Filter out the post to delete
    savedPosts = savedPosts.filter(post => post.id !== postId);
    
    // Update storage
    await chrome.storage.local.set({ savedPosts });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting post:', error);
    return { success: false, error: 'storage' };
  }
}

// Delete multiple posts
async function deletePosts(postIds) {
  try {
    // Get existing posts
    const result = await chrome.storage.local.get('savedPosts');
    const savedPosts = result.savedPosts || [];
    
    // Filter out the posts to delete
    const updatedPosts = savedPosts.filter(post => !postIds.includes(post.id));
    
    // Save back to storage
    await chrome.storage.local.set({ savedPosts: updatedPosts });
    
    // Return success with count of deleted posts
    return { 
      success: true, 
      deletedCount: savedPosts.length - updatedPosts.length 
    };
  } catch (error) {
    console.error('Error deleting posts:', error);
    return { success: false, error: 'storage' };
  }
}

// Bulk update posts (add/remove categories or assign folder)
async function bulkUpdatePosts(postIds, updates) {
  try {
    // Get existing posts
    const result = await chrome.storage.local.get('savedPosts');
    const savedPosts = result.savedPosts || [];
    
    // Create updated posts array
    const updatedPosts = savedPosts.map(post => {
      // Skip posts that aren't in the update list
      if (!postIds.includes(post.id)) return post;
      
      // Create a copy of the post to modify
      const updatedPost = { ...post };
      
      // Add categories if specified
      if (updates.addCategories) {
        updatedPost.categories = [
          ...(updatedPost.categories || []),
          ...updates.addCategories
        ];
        // Remove duplicates
        updatedPost.categories = [...new Set(updatedPost.categories)];
      }
      
      // Remove categories if specified
      if (updates.removeCategories) {
        updatedPost.categories = (updatedPost.categories || [])
          .filter(category => !updates.removeCategories.includes(category));
      }
      
      // Set folder if specified
      if (updates.folder !== undefined) {
        updatedPost.folder = updates.folder;
      }
      
      return updatedPost;
    });
    
    // Save back to storage
    await chrome.storage.local.set({ savedPosts: updatedPosts });
    
    // Return success
    return { success: true, updatedCount: postIds.length };
  } catch (error) {
    console.error('Error updating posts:', error);
    return { success: false, error: 'storage' };
  }
}

// Save a new category
async function saveCategory(category) {
  try {
    // Get existing categories
    const result = await chrome.storage.local.get('categories');
    const categories = result.categories || [];
    
    // Only add if it doesn't already exist
    if (!categories.includes(category)) {
      categories.push(category);
      await chrome.storage.local.set({ categories });
      return { success: true };
    }
    
    return { success: true, duplicate: true };
  } catch (error) {
    console.error('Error saving category:', error);
    return { success: false, error: 'storage' };
  }
}

// Get all categories
async function getCategories() {
  try {
    const result = await chrome.storage.local.get('categories');
    return result.categories || [];
  } catch (error) {
    console.error('Error getting categories:', error);
    return [];
  }
}

// Delete a category
async function deleteCategory(category) {
  try {
    // Get existing categories
    const result = await chrome.storage.local.get('categories');
    const categories = result.categories || [];
    
    // Filter out the category to delete
    const updatedCategories = categories.filter(cat => cat !== category);
    
    // Save back to storage
    await chrome.storage.local.set({ categories: updatedCategories });
    
    // Return success
    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: 'storage' };
  }
}

// Rename a category
async function renameCategory(oldName, newName) {
  try {
    // Get existing categories
    const result = await chrome.storage.local.get(['categories', 'savedPosts']);
    const categories = result.categories || [];
    const savedPosts = result.savedPosts || [];
    
    // Skip if new name already exists
    if (categories.includes(newName)) {
      return { 
        success: false, 
        error: 'duplicate',
        message: 'Eine Kategorie mit diesem Namen existiert bereits.'
      };
    }
    
    // Skip if old name doesn't exist
    if (!categories.includes(oldName)) {
      return { 
        success: false, 
        error: 'not_found',
        message: 'Die zu ändernde Kategorie wurde nicht gefunden.'
      };
    }
    
    // Update the category name in the list
    const updatedCategories = categories.map(cat => 
      cat === oldName ? newName : cat
    );
    
    // Update the category in all posts
    const updatedPosts = savedPosts.map(post => {
      // Skip if post doesn't have this category
      if (!post.categories || !post.categories.includes(oldName)) return post;
      
      // Create a copy of the post to modify
      const updatedPost = { ...post };
      
      // Replace old category with new one
      updatedPost.categories = post.categories.map(cat => 
        cat === oldName ? newName : cat
      );
      
      return updatedPost;
    });
    
    // Save back to storage
    await chrome.storage.local.set({ 
      categories: updatedCategories,
      savedPosts: updatedPosts
    });
    
    // Return success
    return { success: true };
  } catch (error) {
    console.error('Error renaming category:', error);
    return { success: false, error: 'storage' };
  }
}

// Folders management
async function saveFolder(folder) {
  try {
    // Get existing folders
    const result = await chrome.storage.local.get('folders');
    const folders = result.folders || [];
    
    // Skip if folder already exists
    if (folders.includes(folder)) return { success: true, duplicate: true };
    
    // Add new folder
    folders.push(folder);
    
    // Save back to storage
    await chrome.storage.local.set({ folders });
    
    // Return success
    return { success: true };
  } catch (error) {
    console.error('Error saving folder:', error);
    return { success: false, error: 'storage' };
  }
}

async function getFolders() {
  try {
    const result = await chrome.storage.local.get('folders');
    return result.folders || [];
  } catch (error) {
    console.error('Error getting folders:', error);
    return [];
  }
}

async function deleteFolder(folder) {
  try {
    // Get existing folders
    const result = await chrome.storage.local.get(['folders', 'savedPosts']);
    const folders = result.folders || [];
    const savedPosts = result.savedPosts || [];
    
    // Filter out the folder to delete
    const updatedFolders = folders.filter(f => f !== folder);
    
    // Remove the folder from all posts
    const updatedPosts = savedPosts.map(post => {
      if (post.folder !== folder) return post;
      
      // Create a copy without the folder
      const updatedPost = { ...post };
      delete updatedPost.folder;
      return updatedPost;
    });
    
    // Save back to storage
    await chrome.storage.local.set({ 
      folders: updatedFolders,
      savedPosts: updatedPosts
    });
    
    // Return success
    return { success: true };
  } catch (error) {
    console.error('Error deleting folder:', error);
    return { success: false, error: 'storage' };
  }
}

async function renameFolder(oldName, newName) {
  try {
    // Get existing folders
    const result = await chrome.storage.local.get(['folders', 'savedPosts']);
    const folders = result.folders || [];
    const savedPosts = result.savedPosts || [];
    
    // Skip if new name already exists
    if (folders.includes(newName)) {
      return { 
        success: false, 
        error: 'duplicate',
        message: 'Ein Ordner mit diesem Namen existiert bereits.'
      };
    }
    
    // Skip if old name doesn't exist
    if (!folders.includes(oldName)) {
      return { 
        success: false, 
        error: 'not_found',
        message: 'Der zu ändernde Ordner wurde nicht gefunden.'
      };
    }
    
    // Update the folder name in the list
    const updatedFolders = folders.map(f => 
      f === oldName ? newName : f
    );
    
    // Update the folder in all posts
    const updatedPosts = savedPosts.map(post => {
      // Skip if post doesn't have this folder
      if (post.folder !== oldName) return post;
      
      // Create a copy of the post to modify
      const updatedPost = { ...post };
      updatedPost.folder = newName;
      
      return updatedPost;
    });
    
    // Save back to storage
    await chrome.storage.local.set({ 
      folders: updatedFolders,
      savedPosts: updatedPosts
    });
    
    // Return success
    return { success: true };
  } catch (error) {
    console.error('Error renaming folder:', error);
    return { success: false, error: 'storage' };
  }
}

// Data export/import functions
async function exportData() {
  try {
    // Get all data
    const data = await chrome.storage.local.get(['savedPosts', 'categories', 'folders']);
    
    // Create export object with metadata
    const exportData = {
      version: '1.1',
      timestamp: new Date().toISOString(),
      data: data
    };
    
    // Return as JSON string
    return {
      success: true,
      data: JSON.stringify(exportData, null, 2)
    };
  } catch (error) {
    console.error('Error exporting data:', error);
    return { success: false, error: 'export' };
  }
}

async function importData(jsonString) {
  try {
    // Parse JSON
    const importData = JSON.parse(jsonString);
    
    // Validate basic structure
    if (!importData.data || !importData.version) {
      return { 
        success: false, 
        error: 'invalid_format',
        message: 'Die Import-Datei hat ein ungültiges Format.'
      };
    }
    
    // Extract data
    const { savedPosts, categories, folders } = importData.data;
    
    // Validate data
    if (!Array.isArray(savedPosts) && savedPosts !== undefined) {
      return { 
        success: false, 
        error: 'invalid_posts',
        message: 'Die Posts-Daten haben ein ungültiges Format.'
      };
    }
    
    if (!Array.isArray(categories) && categories !== undefined) {
      return { 
        success: false, 
        error: 'invalid_categories',
        message: 'Die Kategorie-Daten haben ein ungültiges Format.'
      };
    }
    
    if (!Array.isArray(folders) && folders !== undefined) {
      return { 
        success: false, 
        error: 'invalid_folders',
        message: 'Die Ordner-Daten haben ein ungültiges Format.'
      };
    }
    
    // Merge with existing data or replace
    // Get current data
    const currentData = await chrome.storage.local.get(['savedPosts', 'categories', 'folders']);
    
    // Prepare new data
    const newData = {};
    
    // Merge posts (adding new, skipping duplicates)
    if (savedPosts) {
      const currentPosts = currentData.savedPosts || [];
      const currentIds = new Set(currentPosts.map(post => post.id));
      
      // Filter out duplicates and add new posts
      const newPosts = [
        ...currentPosts,
        ...savedPosts.filter(post => !currentIds.has(post.id))
      ];
      
      newData.savedPosts = newPosts;
    }
    
    // Merge categories
    if (categories) {
      const currentCategories = currentData.categories || [];
      const newCategories = [...new Set([...currentCategories, ...categories])];
      newData.categories = newCategories;
    }
    
    // Merge folders
    if (folders) {
      const currentFolders = currentData.folders || [];
      const newFolders = [...new Set([...currentFolders, ...folders])];
      newData.folders = newFolders;
    }
    
    // Save to storage
    await chrome.storage.local.set(newData);
    
    // Return success with count of imported items
    return { 
      success: true,
      postCount: savedPosts ? savedPosts.length : 0,
      categoryCount: categories ? categories.length : 0,
      folderCount: folders ? folders.length : 0
    };
  } catch (error) {
    console.error('Error importing data:', error);
    
    if (error instanceof SyntaxError) {
      return { 
        success: false, 
        error: 'invalid_json',
        message: 'Die Datei enthält kein gültiges JSON-Format.'
      };
    }
    
    return { 
      success: false, 
      error: 'import',
      message: 'Beim Importieren ist ein Fehler aufgetreten.'
    };
  }
}

// Clear all data (for debugging/testing)
async function clearAllData() {
  try {
    await chrome.storage.local.clear();
    return { success: true };
  } catch (error) {
    console.error('Error clearing data:', error);
    return { success: false, error: 'storage' };
  }
}

// Expose all functions globally through a Storage object
// ES-Modul Exports
export {
  savePost,
  getSavedPosts,
  postExists,
  deletePost,
  deletePosts,
  bulkUpdatePosts,
  saveCategory,
  getCategories,
  deleteCategory,
  renameCategory,
  saveFolder,
  getFolders,
  deleteFolder,
  renameFolder,
  exportData,
  importData,
  clearAllData,
  normalizeUrl
};
