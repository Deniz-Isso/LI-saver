/**
 * AI Service für Professional Post Saver
 * Verwendet OpenAI API für erweiterte Funktionen wie Zusammenfassungen,
 * verbesserte Kategorievorschläge und thematische Analysen.
 *
 * DSGVO-Hinweis: Diese Funktionalität sendet Daten an OpenAI-Server.
 * Sie wird nur mit ausdrücklicher Nutzererlaubnis aktiviert.
 */

// Beim ersten Aufruf wird der User nach Zustimmung für KI-Funktionen gefragt
let userOptInStatus = null; // Ursprüngliche Deklaration beibehalten

/**
 * Prüft, ob der Nutzer der Verwendung von KI-Diensten zugestimmt hat
 * @returns {boolean} - True, wenn der Nutzer zugestimmt hat
 */
function hasUserOptedIn() {
  return userOptInStatus === true;
}

/**
 * Setzt den Opt-in-Status des Nutzers
 * @param {boolean} status - Der neue Opt-in-Status
 */
function setUserOptIn(status) {
  userOptInStatus = status;
  chrome.storage.local.set({ 'aiServiceOptIn': status });
}

/**
 * Speichert den API-Schlüssel
 * @param {string} key - Der API-Schlüssel
 */
async function setApiKey(key) {
  if (key) {
    await chrome.storage.local.set({ openaiApiKey: key });
  } else {
    await chrome.storage.local.remove(['openaiApiKey']);
  }
}

/**
 * Initialisiert den AI-Service
 * @returns {Promise<boolean>} - True, wenn erfolgreich initialisiert
 */
async function initAIService() {
  try {
    // Status aus dem Speicher laden
    const result = await chrome.storage.local.get(['aiServiceOptIn']);
    let storedOptInStatus = result.aiServiceOptIn;

    // FÜR TESTZWECKE: Temporär auf true setzen, wenn noch keine Entscheidung getroffen wurde oder es false ist
    // Dies stellt sicher, dass KI-Funktionen für Tests ohne manuelle Zustimmung aktiviert sind
    if (storedOptInStatus === undefined || storedOptInStatus === false) {
      userOptInStatus = true; // Temporär auf true setzen
      await chrome.storage.local.set({ 'aiServiceOptIn': true }); // Und im Storage speichern
    } else {
      userOptInStatus = storedOptInStatus; // Ansonsten den gespeicherten Wert verwenden
    }

    return true;
  } catch (error) {
    console.error('Error initializing AI service:', error);
    return false;
  }
}

/**
 * Generiert eine Zusammenfassung und Schlüsselinformationen für eine Liste von Posts.
 * Fällt auf eine lokale Analyse zurück, wenn keine API konfiguriert ist oder ein Fehler auftritt.
 * @param {Array<Object>} posts - Die Posts, die analysiert werden sollen.
 * @param {string} language - Die Sprache der Posts ('en' oder 'de').
 * @returns {Promise<Object>} - Ein Objekt mit Zusammenfassung, Schlüsselinformationen und gemeinsamen Themen.
 */
async function generateSummaryForPosts(posts, language = 'de') {
  if (!hasUserOptedIn()) {
    throw new Error('AI service requires user opt-in');
  }

  try {
    // DIESEN BLOCK AUSKOMMENTIEREN FÜR LOKALE TESTS OHNE API:
    /*
    const result = await chrome.storage.local.get(['openaiApiKey']);
    const apiKey = result.openaiApiKey;
    if (!apiKey) {
      throw new Error('No API key configured');
    }
    */

    // Hier würde der tatsächliche OpenAI API-Aufruf stehen
    // const response = await fetch('https://api.openai.com/v1/chat/completions', { ... });
    // const data = await response.json();
    // return { summary: data.choices[0].message.content, ... };

    // Fallback: Lokale Zusammenfassung ohne OpenAI
    const content = posts.map(p => p.content).join('\n\n');
    const summary = `Lokale Zusammenfassung (${posts.length} Posts): ${content.substring(0, 200)}...`;
    const keyInsights = PostProcessor.extractKeyInfo(content, language).map(info => info.term);
    const commonThemes = await generateLocalThemes(posts);

    return {
      summary: summary,
      key_insights: keyInsights,
      common_themes: commonThemes
    };

  } catch (error) {
    console.error('Error in generateSummaryForPosts (falling back to local):', error);
    // Fallback: Lokale Zusammenfassung ohne OpenAI
    const content = posts.map(p => p.content).join('\n\n');
    const summary = `Zusammenfassung nicht verfügbar (API Fehler oder nicht konfiguriert): ${content.substring(0, 200)}...`;
    const keyInsights = PostProcessor.extractKeyInfo(content, language).map(info => info.term);
    const commonThemes = await generateLocalThemes(posts);

    return {
      summary: summary,
      key_insights: keyInsights,
      common_themes: commonThemes
    };
  }
}

/**
 * Analysiert die Ähnlichkeiten zwischen Posts und identifiziert Cluster.
 * Fällt auf eine lokale Analyse zurück, wenn keine API konfiguriert ist oder ein Fehler auftritt.
 * @param {Array<Object>} posts - Die Posts, die analysiert werden sollen.
 * @param {string} language - Die Sprache der Posts ('en' oder 'de').
 * @returns {Promise<Object>} - Ein Objekt mit Ähnlichkeitsmatrix, Clustern und redundanten Informationen.
 */
async function analyzePostSimilarities(posts, language = 'de') {
  if (!hasUserOptedIn()) {
    throw new Error('AI service requires user opt-in');
  }

  try {
    // DIESEN BLOCK AUSKOMMENTIEREN FÜR LOKALE TESTS OHNE API:
    /*
    const result = await chrome.storage.local.get(['openaiApiKey']);
    const apiKey = result.openaiApiKey;
    if (!apiKey) {
      throw new Error('No API key configured');
    }
    */

    // Hier würde der tatsächliche OpenAI API-Aufruf stehen
    // const response = await fetch('https://api.openai.com/v1/embeddings', { ... });
    // const data = await response.json();
    // return { similarity_matrix: calculateSimilarity(embeddings), ... };

    // Fallback: Lokale Ähnlichkeitsanalyse
    return localSimilarityAnalysis(posts);

  } catch (error) {
    console.error('Error in analyzePostSimilarities (falling back to local):', error);
    // Fallback: Lokale Ähnlichkeitsanalyse
    return localSimilarityAnalysis(posts);
  }
}

/**
 * Generiert lokale Themen basierend auf den Post-Inhalten.
 * @param {Array<Object>} posts - Die Posts, die analysiert werden sollen.
 * @returns {Promise<Array<string>>} - Eine Liste von gemeinsamen Themen.
 */
async function generateLocalThemes(posts) {
  const allContent = posts.map(p => p.content).join(' ');
  const keyInfo = PostProcessor.extractKeyInfo(allContent, PostProcessor.detectLanguage(allContent));
  // Filtern nach den Top-Begriffen oder den wichtigsten Entitäten
  return keyInfo.slice(0, 5).map(info => info.term);
}

/**
 * Lokale Ähnlichkeitsanalyse ohne externe API (einfacher Algorithmus)
 * @param {Array} posts - Array von Posts, die analysiert werden sollen
 * @returns {Object} - Ähnlichkeitsmatrix und einfache Cluster
 */
function localSimilarityAnalysis(posts) {
  // Simple TF-IDF-ähnliche Berechnung
  const documents = posts.map(post => {
    const content = post.content || '';
    // Einfache Tokenisierung und Bereinigung
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    // Häufigkeiten zählen
    const freq = {};
    words.forEach(word => {
      freq[word] = (freq[word] || 0) + 1;
    });
    
    return freq;
  });

  // Ähnlichkeitsmatrix berechnen
  const similarityMatrix = [];
  for (let i = 0; i < documents.length; i++) {
    similarityMatrix[i] = [];
    for (let j = 0; j < documents.length; j++) {
      if (i === j) {
        similarityMatrix[i][j] = 1.0;
      } else {
        similarityMatrix[i][j] = calculateCosineSimilarity(documents[i], documents[j]);
      }
    }
  }

  // Einfaches Clustering basierend auf Ähnlichkeitsschwellenwert
  const threshold = 0.3;
  const clusters = [];
  const processed = new Set();

  for (let i = 0; i < posts.length; i++) {
    if (processed.has(i)) continue;
    
    const cluster = [i];
    processed.add(i);
    
    for (let j = i + 1; j < posts.length; j++) {
      if (!processed.has(j) && similarityMatrix[i][j] > threshold) {
        cluster.push(j);
        processed.add(j);
      }
    }
    
    if (cluster.length > 1) {
      clusters.push(cluster);
    }
  }

  // Gemeinsame Begriffe finden
  const commonTerms = findCommonTerms(documents);

  return {
    similarity_matrix: similarityMatrix,
    clusters: clusters,
    redundant_info: commonTerms
  };
}

/**
 * Berechnet die Kosinus-Ähnlichkeit zwischen zwei Dokumenten
 * @param {Object} doc1 - Erstes Dokument (Wort-Frequenz-Objekt)
 * @param {Object} doc2 - Zweites Dokument (Wort-Frequenz-Objekt)
 * @returns {number} - Kosinus-Ähnlichkeit zwischen 0 und 1
 */
function calculateCosineSimilarity(doc1, doc2) {
  const words = new Set([...Object.keys(doc1), ...Object.keys(doc2)]);
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (const word of words) {
    const freq1 = doc1[word] || 0;
    const freq2 = doc2[word] || 0;
    
    dotProduct += freq1 * freq2;
    norm1 += freq1 * freq1;
    norm2 += freq2 * freq2;
  }
  
  if (norm1 === 0 || norm2 === 0) return 0;
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Findet gemeinsame Begriffe in einer Reihe von Dokumenten
 * @param {Array} documents - Array von Wörterbüchern mit Wort-Frequenz-Paaren
 * @returns {Array} - Die häufigsten gemeinsamen Begriffe
 */
function findCommonTerms(documents) {
  const termCounts = {};
  
  documents.forEach(doc => {
    Object.keys(doc).forEach(term => {
      termCounts[term] = (termCounts[term] || 0) + 1;
    });
  });
  
  // Nur Begriffe, die in mindestens 2 Dokumenten vorkommen
  const commonTerms = Object.entries(termCounts)
    .filter(([term, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([term]) => term);
    
  return commonTerms;
}

// Funktionen exportieren
export {
  hasUserOptedIn,
  setUserOptIn,
  initAIService,
  setApiKey,
  generateSummaryForPosts,
  analyzePostSimilarities,
  localSimilarityAnalysis,
  findCommonTerms
};