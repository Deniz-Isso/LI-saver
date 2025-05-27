/**
 * Verbesserte Funktion zur Darstellung von Kategorievorschlägen
 * - Fett formatierte Überschrift
 * - Aufgelistete Vorschläge mit Bullets
 * - Verbesserte visuelle Struktur
 * 
 * @param {string} content - Der Inhalt des Posts
 * @param {string[]} existingTags - Bereits ausgewählte Tags
 * @param {HTMLElement} targetElement - Das Element, in dem die Vorschläge angezeigt werden
 * @param {Function} callback - Die Funktion, die beim Klick auf einen Vorschlag aufgerufen wird
 */
function generateTagSuggestions(content, existingTags = [], targetElement, callback) {
  // Generate suggestions based on post content
  const suggestions = PostProcessor.suggestCategories(content, existingTags);
  
  targetElement.innerHTML = '';
  
  if (suggestions.length === 0) {
    return;
  }
  
  // Container für die Vorschläge mit besserem Styling
  const suggestionContainer = document.createElement('div');
  suggestionContainer.className = 'suggestion-container';
  
  // Überschrift fett formatiert
  const suggestionHeader = document.createElement('div');
  suggestionHeader.className = 'suggestion-header';
  suggestionHeader.textContent = 'Vorgeschlagene Kategorien:';
  suggestionContainer.appendChild(suggestionHeader);
  
  // Liste für die Vorschläge
  const suggestionList = document.createElement('div');
  suggestionList.className = 'suggestion-list';
  
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
  
  suggestionContainer.appendChild(suggestionList);
  targetElement.appendChild(suggestionContainer);
}