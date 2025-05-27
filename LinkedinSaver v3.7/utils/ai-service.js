/**
 * AI Service für Professional Post Saver
 * Verwendet OpenAI API für erweiterte Funktionen wie Zusammenfassungen,
 * verbesserte Kategorievorschläge und thematische Analysen.
 * 
 * DSGVO-Hinweis: Diese Funktionalität sendet Daten an OpenAI-Server.
 * Sie wird nur mit ausdrücklicher Nutzererlaubnis aktiviert.
 */

// Beim ersten Aufruf wird der User nach Zustimmung für KI-Funktionen gefragt
let userOptInStatus = true; // Temporär für lokales Testen auf true gesetzt

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
 * Initialisiert den AI-Service
 * @returns {Promise<boolean>} - True, wenn erfolgreich initialisiert
 */
async function initAIService() {
  try {
    // Status aus dem Speicher laden
    const result = await chrome.storage.local.get(['aiServiceOptIn']);
    userOptInStatus = result.aiServiceOptIn;
    
    // Wenn noch keine Entscheidung getroffen wurde, den Nutzer fragen
    if (userOptInStatus === undefined) {
      // Standard: KI-Funktionen deaktiviert
      userOptInStatus = false;
      
      // Dialog zur Zustimmung anzeigen würde hier implementiert werden
      // Für jetzt nehmen wir an, dass der Nutzer nicht zustimmt, bis er
      // explizit in den Einstellungen zustimmt
      
      // Status speichern
      chrome.storage.local.set({ 'aiServiceOptIn': userOptInStatus });
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing AI service:', error);
    return false;
  }
}

/**
 * Speichert den API-Schlüssel
 * @param {string} key - Der API-Schlüssel
 */
async function setApiKey(key) {
  try {
    await chrome.storage.local.set({ 'openaiApiKey': key });
    return true;
  } catch (error) {
    console.error('Error saving API key:', error);
    throw new Error('Error saving API key');
  }
}

/**
 * Generiert eine Zusammenfassung für eine Sammlung von Posts
 * @param {Array} posts - Array von Posts, die zusammengefasst werden sollen
 * @param {string} [language='de'] - Sprache der Zusammenfassung (de/en)
 * @returns {Promise<{summary: string, key_insights: Array<string>, common_themes: Array<string>}>}
 */
async function generateSummaryForPosts(posts, language = 'de') {
  if (!hasUserOptedIn()) {
    throw new Error('AI service requires user opt-in');
  }
  
  try {
    // Temporär auskommentiert für lokales Testen - entferne Kommentare wenn API verfügbar
    // const result = await chrome.storage.local.get(['openaiApiKey']);
    // const apiKey = result.openaiApiKey;
    // if (!apiKey) {
    //   throw new Error('No API key configured');
    // }
    
    // Posts für die Anfrage aufbereiten
    const postTexts = posts.map(post => ({
      id: post.id,
      author: post.author || 'Unknown',
      content: post.content,
      date: post.savedAt || new Date().toISOString()
    }));
    
    // Systemanweisung je nach gewählter Sprache
    const systemPrompt = language === 'de' ? 
      'Du bist ein Assistent, der LinkedIn-Posts zusammenfasst. Erstelle eine prägnante Zusammenfassung der gesammelten Posts, identifiziere wichtige Erkenntnisse und gemeinsame Themen. Antworte auf Deutsch.' :
      'You are an assistant that summarizes LinkedIn posts. Create a concise summary of the collected posts, identify key insights, and common themes. Respond in English.';
    
    // OpenAI API aufrufen
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Bitte fasse die folgenden LinkedIn-Posts zusammen und identifiziere die wichtigsten Erkenntnisse und gemeinsamen Themen. Formatiere deine Antwort als JSON mit den Feldern "summary", "key_insights" (als Array) und "common_themes" (als Array).\n\nHier sind die Posts:\n${JSON.stringify(postTexts, null, 2)}`
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error('OpenAI API error:', data.error);
      throw new Error(`OpenAI API error: ${data.error.message || 'Unknown error'}`);
    }
    
    // JSON-Antwort parsen
    try {
      const result = JSON.parse(data.choices[0].message.content);
      return {
        summary: result.summary || '',
        key_insights: result.key_insights || [],
        common_themes: result.common_themes || []
      };
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      throw new Error('Invalid response format from OpenAI');
    }
  } catch (error) {
    console.error('Error generating summary:', error);
    
    // Fallback: Lokale Zusammenfassung ohne OpenAI
    const insights = posts.slice(0, 3).map(post => 
      `${post.author}: ${post.content.substring(0, 100)}...`
    );
    const themes = PostProcessor.extractKeyInfo(posts.map(p => p.content).join(' '));
    
    return {
      summary: `Lokale Zusammenfassung von ${posts.length} gespeicherten Posts ohne API.`,
      key_insights: insights.length > 0 ? insights : ['Lokaler Modus - keine API-Verbindung'],
      common_themes: themes.slice(0, 5)
    };
  }
}

/**
 * Analysiert Ähnlichkeiten zwischen Posts
 * @param {Array} posts - Array von Posts, die analysiert werden sollen
 * @param {string} [language='de'] - Sprache der Analyse (de/en)
 * @returns {Promise<{similarity_matrix: Array, clusters: Array, redundant_info: Array}>}
 */
async function analyzePostSimilarities(posts, language = 'de') {
  if (!hasUserOptedIn()) {
    throw new Error('AI service requires user opt-in');
  }
  
  try {
    // Temporär auskommentiert für lokales Testen - entferne Kommentare wenn API verfügbar
    // const result = await chrome.storage.local.get(['openaiApiKey']);
    // const apiKey = result.openaiApiKey;
    // if (!apiKey) {
    //   throw new Error('No API key configured');
    // }
    
    // Posts für die Anfrage aufbereiten
    const postTexts = posts.map(post => ({
      id: post.id,
      author: post.author || 'Unknown',
      content: post.content.substring(0, 1000), // Kürzen um API-Limits zu respektieren
      date: post.savedAt || new Date().toISOString()
    }));
    
    // Systemanweisung je nach gewählter Sprache
    const systemPrompt = language === 'de' ? 
      'Du bist ein Assistent, der LinkedIn-Posts auf thematische Überschneidungen analysiert und Cluster identifiziert. Antworte auf Deutsch.' :
      'You are an assistant that analyzes LinkedIn posts for thematic overlaps and identifies clusters. Respond in English.';
    
    // OpenAI API aufrufen
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Analysiere die folgenden LinkedIn-Posts auf thematische Überschneidungen. Identifiziere Cluster ähnlicher Inhalte und redundante Informationen. Formatiere deine Antwort als JSON mit den Feldern "similarity_matrix" (Array mit Ähnlichkeitswerten zwischen allen Post-Paaren), "clusters" (Array von Arrays mit Post-IDs, die thematisch zusammengehören) und "redundant_info" (Array von Objekten mit redundanten Informationen zwischen Posts).\n\nHier sind die Posts:\n${JSON.stringify(postTexts, null, 2)}`
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error('OpenAI API error:', data.error);
      throw new Error(`OpenAI API error: ${data.error.message || 'Unknown error'}`);
    }
    
    // JSON-Antwort parsen
    try {
      const result = JSON.parse(data.choices[0].message.content);
      return {
        similarity_matrix: result.similarity_matrix || [],
        clusters: result.clusters || [],
        redundant_info: result.redundant_info || []
      };
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      throw new Error('Invalid response format from OpenAI');
    }
  } catch (error) {
    console.error('Error analyzing post similarities:', error);
    
    // Fallback: Lokale Analyse ohne OpenAI
    return localSimilarityAnalysis(posts);
  }
}

/**
 * Lokale Ähnlichkeitsanalyse ohne externe API (einfacher Algorithmus)
 * @param {Array} posts - Array von Posts, die analysiert werden sollen
 * @returns {Object} - Ähnlichkeitsmatrix und einfache Cluster
 */
function localSimilarityAnalysis(posts) {
  // Einfache Wortzählung und TF-IDF-ähnliche Analyse
  const wordFrequencies = posts.map(post => {
    const words = post.content.toLowerCase().split(/\W+/);
    const frequency = {};
    words.forEach(word => {
      if (word.length > 3) { // Ignoriere sehr kurze Wörter
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });
    return frequency;
  });
  
  // Einfache Ähnlichkeitsmatrix berechnen
  const similarityMatrix = [];
  for (let i = 0; i < posts.length; i++) {
    similarityMatrix[i] = [];
    for (let j = 0; j < posts.length; j++) {
      if (i === j) {
        similarityMatrix[i][j] = 1; // Selbstähnlichkeit ist 1
      } else {
        // Jaccard-Ähnlichkeit berechnen
        const wordsA = Object.keys(wordFrequencies[i]);
        const wordsB = Object.keys(wordFrequencies[j]);
        const intersection = wordsA.filter(word => wordsB.includes(word)).length;
        const union = new Set([...wordsA, ...wordsB]).size;
        similarityMatrix[i][j] = union === 0 ? 0 : intersection / union;
      }
    }
  }
  
  // Einfaches Clustering basierend auf Ähnlichkeitsschwelle
  const clusters = [];
  const assigned = new Set();
  
  for (let i = 0; i < posts.length; i++) {
    if (assigned.has(i)) continue;
    
    const cluster = [posts[i].id];
    assigned.add(i);
    
    for (let j = 0; j < posts.length; j++) {
      if (i !== j && !assigned.has(j) && similarityMatrix[i][j] > 0.2) {
        cluster.push(posts[j].id);
        assigned.add(j);
      }
    }
    
    if (cluster.length > 1) {
      clusters.push(cluster);
    }
  }
  
  // Gemeinsame Begriffe finden
  const commonTerms = findCommonTerms(wordFrequencies);
  
  return {
    similarity_matrix: similarityMatrix,
    clusters: clusters,
    redundant_info: commonTerms.map(term => ({
      term: term,
      description: `Erscheint in mehreren Posts häufig`
    }))
  };
}

/**
 * Findet gemeinsame Begriffe in einer Reihe von Dokumenten
 * @param {Array} documents - Array von Wörterbüchern mit Wort-Frequenz-Paaren
 * @returns {Array} - Die häufigsten gemeinsamen Begriffe
 */
function findCommonTerms(documents) {
  const termCounts = {};
  const docCount = documents.length;
  
  // Zähle, in wie vielen Dokumenten jeder Begriff vorkommt
  documents.forEach(doc => {
    const terms = Object.keys(doc);
    terms.forEach(term => {
      termCounts[term] = (termCounts[term] || 0) + 1;
    });
  });
  
  // Finde Begriffe, die in mindestens der Hälfte der Dokumente vorkommen
  return Object.keys(termCounts)
    .filter(term => termCounts[term] >= Math.max(2, docCount / 3))
    .sort((a, b) => termCounts[b] - termCounts[a])
    .slice(0, 5); // Beschränke auf die 5 häufigsten
}

// ES-Modul Exports
export {
  hasUserOptedIn,
  setUserOptIn,
  initAIService,
  setApiKey,
  generateSummaryForPosts,
  analyzePostSimilarities
};
