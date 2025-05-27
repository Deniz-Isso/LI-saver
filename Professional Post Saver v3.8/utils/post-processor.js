/**
 * Utility functions for processing LinkedIn posts
 */

// Extended stopwords list (for multiple languages)
const STOPWORDS = new Set([
  // English stopwords
  'this', 'that', 'there', 'their', 'they', 'then', 'than', 'with', 'would', 'could', 'should', 
  'have', 'been', 'from', 'what', 'when', 'where', 'which', 'about', 'more', 'just', 'your',
  'these', 'those', 'some', 'will', 'were', 'does', 'doing', 'done', 'them', 'https', 'http',
  'much', 'many', 'because', 'every', 'even', 'also', 'only', 'here', 'very', 'each', 'some',
  
  // German stopwords
  'und', 'oder', 'aber', 'denn', 'wenn', 'weil', 'dass', 'nicht', 'sein', 'haben', 'werden',
  'mein', 'dein', 'sein', 'ihr', 'unser', 'euer', 'ihre', 'einem', 'einen', 'einer', 'eines',
  'dass', 'daß', 'damit', 'durch', 'über', 'unter', 'gegen', 'https', 'http', 'sehr', 'mehr'
]);

// Multilingual category systems
const CATEGORIES_EN = [
  'Career Development',
  'Industry News',
  'Networking',
  'Job Opportunities',
  'Tech Trends',
  'Learning',
  'Inspiration',
  'Marketing',
  'Leadership',
  'Business Strategy',
  'Personal Development',
  'Productivity',
  'Entrepreneurship',
  'Innovation',
  'Remote Work',
  'Future of Work',
  'Digital Transformation',
  'Data Science',
  'Artificial Intelligence',
  'Sustainability'
];

const CATEGORIES_DE = [
  'Karriereentwicklung',
  'Branchennews',
  'Networking',
  'Jobmöglichkeiten',
  'Technologietrends',
  'Weiterbildung',
  'Inspiration',
  'Marketing',
  'Führung',
  'Geschäftsstrategie',
  'Persönliche Entwicklung',
  'Produktivität',
  'Unternehmertum',
  'Innovation',
  'Remote Arbeit',
  'Zukunft der Arbeit',
  'Digitale Transformation',
  'Data Science',
  'Künstliche Intelligenz',
  'Nachhaltigkeit'
];

// Map between German and English categories (for potential translation)
const DE_TO_EN_CATEGORIES = {
  'Karriereentwicklung': 'Career Development',
  'Branchennews': 'Industry News',
  'Networking': 'Networking',
  'Jobmöglichkeiten': 'Job Opportunities',
  'Technologietrends': 'Tech Trends',
  'Weiterbildung': 'Learning',
  'Inspiration': 'Inspiration',
  'Marketing': 'Marketing',
  'Führung': 'Leadership',
  'Geschäftsstrategie': 'Business Strategy',
  'Persönliche Entwicklung': 'Personal Development',
  'Produktivität': 'Productivity',
  'Unternehmertum': 'Entrepreneurship',
  'Innovation': 'Innovation',
  'Remote Arbeit': 'Remote Work',
  'Zukunft der Arbeit': 'Future of Work',
  'Digitale Transformation': 'Digital Transformation',
  'Data Science': 'Data Science',
  'Künstliche Intelligenz': 'Artificial Intelligence',
  'Nachhaltigkeit': 'Sustainability'
};

// Terms for each category (English)
const CATEGORY_TERMS_EN = {
  'Career Development': [
    'career', 'skill', 'learning', 'growth', 'development', 'education', 'course', 'certificate', 
    'certification', 'training', 'mentor', 'coach', 'progress', 'advancement', 'professional',
    'career path', 'promotion', 'upskill', 'reskill', 'resume', 'cv', 'portfolio'
  ],
  'Industry News': [
    'industry', 'news', 'announcement', 'update', 'report', 'research', 'study', 'market', 
    'trend', 'release', 'launch', 'published', 'analysis', 'forecast', 'quarterly', 'annual',
    'breaking', 'latest', 'development', 'press release', 'headline', 'bulletin'
  ],
  'Networking': [
    'network', 'connect', 'connection', 'relationship', 'meet', 'event', 'conference', 'webinar', 
    'contact', 'community', 'group', 'association', 'introduction', 'referral', 'recommendation',
    'meetup', 'gathering', 'professional group', 'alumni', 'mastermind', 'collaboration'
  ],
  'Job Opportunities': [
    'job', 'position', 'opportunity', 'hire', 'hiring', 'recruitment', 'role', 'opening', 'vacancy', 
    'apply', 'candidate', 'application', 'interview', 'resume', 'employer', 'employee', 'talent',
    'career fair', 'job market', 'open position', 'executive search', 'staffing', 'placement'
  ],
  'Tech Trends': [
    'technology', 'tech', 'innovation', 'trend', 'future', 'digital', 'ai', 'artificial intelligence', 
    'machine learning', 'blockchain', 'automation', 'robotics', 'software', 'platform', 'app', 
    'algorithm', 'cloud', 'iot', 'augmented reality', 'virtual reality', 'metaverse', 'cyber'
  ],
  'Learning': [
    'learn', 'course', 'education', 'training', 'knowledge', 'skill', 'tutorial', 'workshop', 
    'seminar', 'lesson', 'practice', 'online course', 'certificate', 'program', 'curriculum', 
    'continuing education', 'bootcamp', 'masterclass', 'webinar', 'e-learning', 'study'
  ],
  'Inspiration': [
    'inspire', 'inspiration', 'motivate', 'motivation', 'success story', 'achievement', 'triumph', 
    'overcome', 'journey', 'milestone', 'accomplishment', 'celebrate', 'recognition', 'award', 
    'challenge', 'passion', 'dream', 'persistence', 'perseverance', 'resilience', 'courage'
  ],
  'Marketing': [
    'marketing', 'brand', 'campaign', 'advertising', 'promotion', 'content', 'strategy', 'audience', 
    'customer', 'consumer', 'target', 'engagement', 'conversion', 'leads', 'social media', 
    'digital marketing', 'SEO', 'analytics', 'funnel', 'user experience', 'email marketing'
  ],
  'Leadership': [
    'leadership', 'leader', 'manage', 'management', 'executive', 'ceo', 'director', 'head', 'chief', 
    'supervise', 'team lead', 'decision making', 'vision', 'initiative', 'influence', 'team building',
    'empower', 'inspire', 'mentor', 'coach', 'guidance', 'direction', 'strategy'
  ],
  'Business Strategy': [
    'strategy', 'business', 'growth', 'revenue', 'profit', 'planning', 'objective', 'goal', 'mission', 
    'vision', 'scale', 'expansion', 'operation', 'efficiency', 'optimization', 'solution',
    'competitive advantage', 'market share', 'business model', 'proposition', 'value'
  ],
  'Personal Development': [
    'personal', 'growth', 'self-improvement', 'mindfulness', 'wellness', 'health', 'balance', 'habit', 
    'routine', 'goal setting', 'reflection', 'meditation', 'journal', 'mindset', 'attitude',
    'emotional intelligence', 'self-awareness', 'confidence', 'resilience', 'purpose'
  ],
  'Productivity': [
    'productivity', 'efficient', 'effectiveness', 'time management', 'organization', 'planning', 
    'prioritize', 'focus', 'distraction', 'workflow', 'process', 'system', 'automate', 'optimize',
    'task', 'project', 'deadline', 'schedule', 'calendar', 'tool', 'method', 'technique'
  ],
  'Entrepreneurship': [
    'entrepreneur', 'startup', 'founder', 'business owner', 'venture', 'bootstrapping', 'funding', 
    'investor', 'pitch', 'scalability', 'business model', 'mvp', 'product market fit', 'seed', 
    'series', 'incubator', 'accelerator', 'small business', 'side hustle', 'passive income'
  ],
  'Innovation': [
    'innovation', 'innovative', 'create', 'creative', 'disrupt', 'disruptive', 'breakthrough', 
    'invention', 'patent', 'novel', 'idea', 'concept', 'prototype', 'experiment', 'test', 'iterate',
    'agile', 'design thinking', 'brainstorm', 'collaboration', 'problem solving'
  ],
  'Remote Work': [
    'remote', 'work from home', 'wfh', 'telecommute', 'virtual', 'distributed team', 'hybrid', 
    'flexible', 'home office', 'digital nomad', 'remote first', 'collaboration tool', 'zoom', 
    'video conference', 'asynchronous', 'workspace', 'productivity tool'
  ],
  'Future of Work': [
    'future of work', 'workplace', 'workforce', 'automation', 'gig economy', 'freelance', 'contract', 
    'flexible work', 'four day week', 'work life balance', 'digital workplace', 'talent marketplace',
    'employee experience', 'hybrid model', 'remote collaboration', 'workplace culture'
  ],
  'Digital Transformation': [
    'digital transformation', 'digitization', 'digitalization', 'legacy system', 'modernization', 
    'cloud migration', 'digital strategy', 'customer experience', 'process improvement', 'automation',
    'agile transformation', 'digital adoption', 'innovation initiative'
  ],
  'Data Science': [
    'data science', 'data scientist', 'big data', 'analytics', 'data analyst', 'data engineer', 
    'machine learning', 'algorithm', 'predictive modeling', 'statistical analysis', 'data visualization',
    'data mining', 'business intelligence', 'dashboard', 'python', 'r', 'SQL', 'data warehouse'
  ],
  'Artificial Intelligence': [
    'artificial intelligence', 'ai', 'machine learning', 'ml', 'deep learning', 'natural language processing', 
    'nlp', 'computer vision', 'neural network', 'algorithm', 'predictive', 'automation', 'chatbot',
    'generative ai', 'openai', 'gpt', 'chatgpt', 'llm', 'large language model', 'prompt engineering'
  ],
  'Sustainability': [
    'sustainability', 'sustainable', 'environmental', 'green', 'carbon footprint', 'climate change', 
    'renewable', 'recycling', 'circular economy', 'esg', 'social responsibility', 'csr', 'clean energy',
    'net zero', 'conservation', 'impact', 'biodiversity', 'ethical', 'fair trade'
  ]
};

// Terms for each category (German)
const CATEGORY_TERMS_DE = {
  'Karriereentwicklung': [
    'karriere', 'fähigkeit', 'lernen', 'wachstum', 'entwicklung', 'bildung', 'kurs', 'zertifikat', 
    'zertifizierung', 'training', 'mentor', 'coach', 'fortschritt', 'beförderung', 'beruflich',
    'karriereweg', 'lebenslauf', 'kompetenzen', 'weiterbildung', 'aufstieg', 'berufserfahrung'
  ],
  'Branchennews': [
    'branche', 'news', 'nachrichten', 'ankündigung', 'update', 'bericht', 'forschung', 'studie', 'markt', 
    'trend', 'veröffentlichung', 'launch', 'analyse', 'prognose', 'quartal', 'jährlich',
    'aktuell', 'entwicklung', 'pressemitteilung', 'meldung', 'neuigkeit', 'information'
  ],
  'Networking': [
    'netzwerk', 'kontakt', 'verbindung', 'beziehung', 'treffen', 'veranstaltung', 'konferenz', 'webinar', 
    'community', 'gruppe', 'verband', 'vorstellung', 'empfehlung', 'meetup', 'zusammenkunft', 
    'fachgruppe', 'alumni', 'austausch', 'zusammenarbeit', 'kontaktpflege'
  ],
  'Jobmöglichkeiten': [
    'job', 'stelle', 'position', 'möglichkeit', 'einstellen', 'rekrutierung', 'rolle', 'stellenangebot', 
    'vakanz', 'bewerben', 'kandidat', 'bewerbung', 'vorstellungsgespräch', 'lebenslauf', 'arbeitgeber', 
    'angestellter', 'talent', 'jobmesse', 'arbeitsmarkt', 'personalbeschaffung', 'personalsuche'
  ],
  'Technologietrends': [
    'technologie', 'tech', 'innovation', 'trend', 'zukunft', 'digital', 'ki', 'künstliche intelligenz', 
    'maschinelles lernen', 'blockchain', 'automatisierung', 'robotik', 'software', 'plattform', 'app', 
    'algorithmus', 'cloud', 'iot', 'augmented reality', 'virtual reality', 'metaverse', 'cyber'
  ],
  'Weiterbildung': [
    'lernen', 'kurs', 'bildung', 'training', 'wissen', 'fähigkeit', 'tutorial', 'workshop', 
    'seminar', 'lektion', 'übung', 'onlinekurs', 'zertifikat', 'programm', 'curriculum', 
    'weiterbildung', 'bootcamp', 'masterclass', 'webinar', 'e-learning', 'studium'
  ],
  'Inspiration': [
    'inspiration', 'inspirieren', 'motivieren', 'motivation', 'erfolgsgeschichte', 'errungenschaft', 'triumph', 
    'überwinden', 'reise', 'meilenstein', 'leistung', 'feiern', 'anerkennung', 'auszeichnung', 
    'herausforderung', 'leidenschaft', 'traum', 'beharrlichkeit', 'ausdauer', 'resilienz', 'mut'
  ],
  'Marketing': [
    'marketing', 'marke', 'kampagne', 'werbung', 'promotion', 'content', 'inhalt', 'strategie', 'zielgruppe', 
    'kunde', 'verbraucher', 'engagement', 'konversion', 'leads', 'social media', 
    'digitales marketing', 'SEO', 'analytik', 'trichter', 'nutzererfahrung', 'email-marketing'
  ],
  'Führung': [
    'führung', 'führungskraft', 'leiten', 'management', 'executive', 'ceo', 'direktor', 'leiter', 'chef', 
    'beaufsichtigen', 'teamleiter', 'entscheidungsfindung', 'vision', 'initiative', 'einfluss', 'teambildung',
    'stärken', 'inspirieren', 'mentor', 'coach', 'orientierung', 'richtung', 'strategie'
  ],
  'Geschäftsstrategie': [
    'strategie', 'geschäft', 'wachstum', 'umsatz', 'gewinn', 'planung', 'ziel', 'mission', 
    'vision', 'skalieren', 'expansion', 'betrieb', 'effizienz', 'optimierung', 'lösung',
    'wettbewerbsvorteil', 'marktanteil', 'geschäftsmodell', 'wertangebot', 'unternehmensstrategie'
  ],
  'Persönliche Entwicklung': [
    'persönlich', 'wachstum', 'selbstverbesserung', 'achtsamkeit', 'wohlbefinden', 'gesundheit', 'balance', 'gewohnheit', 
    'routine', 'zielsetzung', 'reflexion', 'meditation', 'journal', 'denkweise', 'einstellung',
    'emotionale intelligenz', 'selbstbewusstsein', 'vertrauen', 'resilienz', 'zweck'
  ],
  'Produktivität': [
    'produktivität', 'effizient', 'wirksamkeit', 'zeitmanagement', 'organisation', 'planung', 
    'priorisieren', 'fokus', 'ablenkung', 'workflow', 'prozess', 'system', 'automatisieren', 'optimieren',
    'aufgabe', 'projekt', 'frist', 'zeitplan', 'kalender', 'werkzeug', 'methode', 'technik'
  ],
  'Unternehmertum': [
    'unternehmer', 'startup', 'gründer', 'geschäftsinhaber', 'venture', 'bootstrapping', 'finanzierung', 
    'investor', 'pitch', 'skalierbarkeit', 'geschäftsmodell', 'mvp', 'product market fit', 'seed', 
    'series', 'inkubator', 'accelerator', 'kleinunternehmen', 'nebenprojekt', 'passives einkommen'
  ],
  'Innovation': [
    'innovation', 'innovativ', 'erschaffen', 'kreativ', 'disruption', 'disruptiv', 'durchbruch', 
    'erfindung', 'patent', 'neuartig', 'idee', 'konzept', 'prototyp', 'experiment', 'testen', 'iterieren',
    'agil', 'design thinking', 'brainstorming', 'zusammenarbeit', 'problemlösung'
  ],
  'Remote Arbeit': [
    'remote', 'heimarbeit', 'homeoffice', 'telearbeit', 'virtuell', 'verteiltes team', 'hybrid', 
    'flexibel', 'heimbüro', 'digitaler nomade', 'remote first', 'kollaborationstool', 'zoom', 
    'videokonferenz', 'asynchron', 'arbeitsplatz', 'produktivitätstool'
  ],
  'Zukunft der Arbeit': [
    'zukunft der arbeit', 'arbeitsplatz', 'arbeitskräfte', 'automatisierung', 'gig economy', 'freiberuflich', 'vertrag', 
    'flexible arbeit', 'vier-tage-woche', 'work-life-balance', 'digitaler arbeitsplatz', 'talentmarktplatz',
    'mitarbeitererfahrung', 'hybridmodell', 'remote-zusammenarbeit', 'arbeitsplatzkultur'
  ],
  'Digitale Transformation': [
    'digitale transformation', 'digitalisierung', 'legacy-system', 'modernisierung', 
    'cloud-migration', 'digitale strategie', 'kundenerfahrung', 'prozessverbesserung', 'automatisierung',
    'agile transformation', 'digitale adoption', 'innovationsinitiative'
  ],
  'Data Science': [
    'data science', 'datenwissenschaft', 'data scientist', 'big data', 'analytik', 'datenanalyst', 'dateningenieur', 
    'maschinelles lernen', 'algorithmus', 'prädiktive modellierung', 'statistische analyse', 'datenvisualisierung',
    'data mining', 'business intelligence', 'dashboard', 'python', 'r', 'SQL', 'data warehouse'
  ],
  'Künstliche Intelligenz': [
    'künstliche intelligenz', 'ki', 'maschinelles lernen', 'ml', 'deep learning', 'natural language processing', 
    'nlp', 'computer vision', 'neuronales netzwerk', 'algorithmus', 'prädiktiv', 'automatisierung', 'chatbot',
    'generative ki', 'openai', 'gpt', 'chatgpt', 'llm', 'large language model', 'prompt engineering'
  ],
  'Nachhaltigkeit': [
    'nachhaltigkeit', 'nachhaltig', 'umwelt', 'grün', 'co2-fußabdruck', 'klimawandel', 
    'erneuerbar', 'recycling', 'kreislaufwirtschaft', 'esg', 'soziale verantwortung', 'csr', 'saubere energie',
    'klimaneutral', 'naturschutz', 'auswirkung', 'biodiversität', 'ethisch', 'fairer handel'
  ]
};

/**
 * Detects the predominant language of a text
 * @param {string} text - The text to analyze
 * @return {string} - Language code ('en', 'de', or 'unknown')
 */
function detectLanguage(text) {
  if (!text || typeof text !== 'string') return 'unknown';
  
  // Simple language detection based on common words
  const enWords = ['the', 'and', 'to', 'of', 'in', 'for', 'is', 'on', 'that', 'by', 'this', 'with', 'you'];
  const deWords = ['der', 'die', 'das', 'und', 'ist', 'in', 'den', 'dem', 'für', 'nicht', 'von', 'zu', 'mit'];
  
  const words = text.toLowerCase().split(/\W+/);
  
  let enCount = 0;
  let deCount = 0;
  
  for (const word of words) {
    if (enWords.includes(word)) enCount++;
    if (deWords.includes(word)) deCount++;
  }
  
  // Bias towards English (as default)
  if (enCount > deCount) return 'en';
  if (deCount > enCount) return 'de';
  
  return 'en'; // Default to English
}

/**
 * Extract key information from a post
 * @param {string} postContent - The content of the post
 * @param {string} [lang='en'] - Language code ('en' or 'de')
 * @return {string[]} - Array of keywords
 */
function extractKeyInfo(postContent, lang = null) {
  if (!postContent || postContent === 'No content available') return [];
  
  // Auto-detect language if not provided
  if (!lang) {
    lang = detectLanguage(postContent);
  }
  
  // Clean up the content
  const cleanContent = postContent.replace(/\s+/g, ' ').trim();
  
  // Simple tokenization (improved to handle language-specific characters)
  const wordPattern = lang === 'de' ? /[\wäöüßÄÖÜ]{4,}/ : /\w{4,}/;
  const words = cleanContent.toLowerCase().match(wordPattern) || [];
  
  // Filter out stopwords
  const filteredWords = words.filter(word => !STOPWORDS.has(word));
  
  // Get word frequency
  const wordCounts = {};
  filteredWords.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  // Sort words by frequency
  const sortedWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
  
  // Return top 20 words
  return sortedWords.slice(0, 20);
}

/**
 * Extract mentions and hashtags from post content
 * @param {string} postContent - The content of the post
 * @return {object} - Object with mentions and hashtags arrays
 */
function extractMentionsAndHashtags(postContent) {
  if (!postContent) return { mentions: [], hashtags: [] };
  
  const mentionRegex = /@[\wäöüß-]+/gi;
  const hashtagRegex = /#[\wäöüß-]+/gi;
  
  const mentions = (postContent.match(mentionRegex) || []).map(m => m.substring(1));
  const hashtags = (postContent.match(hashtagRegex) || []).map(h => h.substring(1));
  
  return { mentions, hashtags };
}

/**
 * Suggest categories based on post content
 * @param {string} postContent - The content of the post
 * @param {string[]} [existingCategories=[]] - Array of existing categories
 * @param {string} [lang=null] - Language code ('en' or 'de')
 * @return {string[]} - Array of suggested categories
 */
function suggestCategories(postContent, existingCategories = [], lang = null) {
  if (!postContent || postContent === 'No content available') {
    return [];
  }
  
  // Auto-detect language if not provided
  if (!lang) {
    lang = detectLanguage(postContent);
  }
  
  // Select appropriate category lists and terms based on language
  const defaultCategories = lang === 'de' ? CATEGORIES_DE : CATEGORIES_EN;
  const categoryTerms = lang === 'de' ? CATEGORY_TERMS_DE : CATEGORY_TERMS_EN;
  
  const content = postContent.toLowerCase();
  
  // Get all available categories (combine defaults with user-defined ones)
  const allCategories = [...new Set([...existingCategories, ...defaultCategories])];
  
  // Check which categories have terms present in the content
  const suggestedCategories = new Set(); // Use Set to avoid duplicates
  const categoryScores = {};
  
  // Extract hashtags which are excellent for categorization
  const { hashtags } = extractMentionsAndHashtags(postContent);
  
  // First check for hashtags that match category names or terms
  if (hashtags.length > 0) {
    allCategories.forEach(category => {
      if (suggestedCategories.size >= 5) return;
      
      const categoryLower = category.toLowerCase();
      
      // Check if any hashtag matches or is part of the category name
      const hashtagMatch = hashtags.some(tag => {
        const tagLower = tag.toLowerCase();
        return categoryLower === tagLower || 
               categoryLower.includes(tagLower) || 
               tagLower.includes(categoryLower);
      });
      
      if (hashtagMatch) {
        suggestedCategories.add(category);
        categoryScores[category] = (categoryScores[category] || 0) + 5; // High score for hashtag match
      }
    });
  }
  
  // Next check for exact matches in existing categories
  allCategories.forEach(category => {
    if (suggestedCategories.size >= 5) return;
    
    // Check if the category name itself is mentioned in the post
    if (content.includes(category.toLowerCase())) {
      suggestedCategories.add(category);
      categoryScores[category] = (categoryScores[category] || 0) + 4; // High score for direct mention
    }
    
    // Check for terms associated with this category
    const terms = categoryTerms[category];
    if (terms) {
      let termMatches = 0;
      
      terms.forEach(term => {
        if (content.includes(term.toLowerCase())) {
          termMatches++;
        }
      });
      
      if (termMatches > 0) {
        suggestedCategories.add(category);
        categoryScores[category] = (categoryScores[category] || 0) + Math.min(termMatches, 3); // Score based on number of matches
      }
    }
  });
  
  // If we don't have enough suggestions yet, also check for partial word matches
  if (suggestedCategories.size < 5) {
    // Get the key words from the post
    const keyWords = extractKeyInfo(postContent, lang);
    
    // For each category we haven't already suggested
    allCategories.forEach(category => {
      if (suggestedCategories.has(category)) return;
      
      // Get the terms for this category
      const terms = categoryTerms[category];
      if (!terms) return;
      
      // Check if any key words are similar to terms for this category
      let similarityScore = 0;
      
      keyWords.forEach(word => {
        terms.forEach(term => {
          if (term.includes(word) || word.includes(term)) {
            similarityScore++;
          }
        });
      });
      
      if (similarityScore > 0) {
        suggestedCategories.add(category);
        categoryScores[category] = (categoryScores[category] || 0) + Math.min(similarityScore, 2); // Lower score for partial matches
      }
    });
  }
  
  // Sort categories by score
  const sortedCategories = Array.from(suggestedCategories).sort((a, b) => {
    return (categoryScores[b] || 0) - (categoryScores[a] || 0);
  });
  
  // Return up to 5 suggestions
  return sortedCategories.slice(0, 5);
}

/**
 * Generate a summary of a post
 * @param {string} postContent - The content of the post
 * @param {number} [maxLength=120] - Maximum length of the summary
 * @param {string} [lang=null] - Language code ('en' or 'de')
 * @return {string} - The summary text
 */
function generateSummary(postContent, maxLength = 120, lang = null) {
  if (!postContent || postContent === 'No content available') {
    return 'No content available';
  }
  
  // Clean up the content
  const cleanContent = postContent.replace(/\s+/g, ' ').trim();
  
  // If content is already short enough, return it
  if (cleanContent.length <= maxLength) {
    return cleanContent;
  }
  
  // Try to find a good cutoff point (end of a sentence or phrase)
  const endPoints = ['. ', '! ', '? ', ': ', '; '];
  
  let bestEndPoint = maxLength - 3; // Default cutoff
  
  // Look for natural endings within reasonable range (80-100% of max length)
  const minCutoff = Math.floor(maxLength * 0.8);
  const searchText = cleanContent.substring(minCutoff, maxLength);
  
  for (const endMark of endPoints) {
    const index = searchText.lastIndexOf(endMark);
    if (index !== -1) {
      bestEndPoint = minCutoff + index + endMark.length;
      break;
    }
  }
  
  // Fallback to word boundary if no sentence end found
  if (bestEndPoint === maxLength - 3) {
    const lastSpace = cleanContent.substring(0, maxLength - 3).lastIndexOf(' ');
    if (lastSpace !== -1) {
      bestEndPoint = lastSpace;
    }
  }
  
  return cleanContent.substring(0, bestEndPoint) + '...';
}

/**
 * Generate folder suggestions based on post content
 * @param {string} postContent - The content of the post
 * @param {string[]} [existingFolders=[]] - Array of existing folders
 * @param {string} [lang=null] - Language code ('en' or 'de')
 * @return {string[]} - Array of suggested folders
 */
function suggestFolders(postContent, existingFolders = [], lang = null) {
  // Simplified implementation: suggest the first matching category as a folder
  const categories = suggestCategories(postContent, [], lang);
  
  // Find categories that match existing folders
  const matchingFolders = categories.filter(category => 
    existingFolders.some(folder => 
      folder.toLowerCase() === category.toLowerCase() || 
      folder.toLowerCase().includes(category.toLowerCase()) || 
      category.toLowerCase().includes(folder.toLowerCase())
    )
  );
  
  return matchingFolders.length > 0 ? [matchingFolders[0]] : categories.length > 0 ? [categories[0]] : [];
}

// ES-Modul Exports
export {
  extractKeyInfo,
  extractMentionsAndHashtags,
  suggestCategories,
  suggestFolders,
  generateSummary,
  detectLanguage
};
