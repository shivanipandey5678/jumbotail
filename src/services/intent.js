/**
 * INTENT DETECTION SERVICE
 * 
 * Purpose:
 * - Understand what the user wants from their search query
 * - Detect intent: price (cheap), quality (best), latest (new), or general
 * - Extract attributes: color, storage, price range
 * - Handle typos using fuzzy matching
 * 
 * Examples:
 * - "Sasta iPhone" → { type: 'price', ... } (user wants cheap)
 * - "Latest iPhone" → { type: 'latest', ... } (user wants new)
 * - "Ifone 16" → fuzzy matches "iPhone 16" (typo handling)
 * - "iPhone 16 red color" → { attributes: { color: 'red' } }
 * 
 * Why separate file?
 * - Intent detection logic is complex
 * - Can be improved/replaced without touching ranking
 * - Easy to add more intents (luxury, discount, etc.)
 */

const stringSimilarity = require('string-similarity');

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Fuzzy matching threshold
 * 0.7 means 70% similarity required to match
 * Example: "Ifone" has 0.75 similarity to "iPhone" → MATCH
 */
const FUZZY_THRESHOLD = 0.7;

/**
 * Intent keywords (English + Hinglish)
 * 
 * Why Hinglish?
 * - Assignment targets Tier-2/3 cities in India
 * - Users mix Hindi-English (sasta, achha, naya)
 */

// Price/Budget intent
const PRICE_KEYWORDS = [
  'sasta', 'sastha', 'cheap', 'budget', 'kam', 'affordable', 
  'paisa', 'discount', 'offer', 'deal'
];

// Quality intent
const QUALITY_KEYWORDS = [
  'best', 'top', 'badiya', 'achha', 'good', 'premium', 
  'excellent', 'accha', 'badhiya','acha'
];

// Latest intent
const LATEST_KEYWORDS = [
  'latest', 'naya', 'new', 'nayi', 'recent', 'newest'
];

// Attribute keywords
const COLOR_WORDS = [
  'red', 'blue', 'black', 'white', 'green', 'gold', 'silver', 
  'purple', 'pink', 'laal', 'neela', 'safed', 'kala'
];

const STRENGTH_KEYWORDS = [
  'strong', 'durable', 'mazboot', 'tough', 'sturdy'
];

// ============================================================================
// REGEX PATTERNS
// ============================================================================

/**
 * Extract storage: "128GB", "more storage", "256 gb"
 */
const STORAGE_PATTERN = /\b(\d+)\s*gb\b|more\s+storage|zyada\s+storage/i;

/**
 * Extract price range: "50k", "50000 rupees", "under 50k"
 */
const PRICE_PATTERN = /(\d+)\s*k\s*(rupees?)?|(\d{4,})\s*(rupees?)?|under\s*(\d+)\s*k/i;

// ============================================================================
// FUZZY MATCHING HELPER
// ============================================================================

/**
 * Check if a word fuzzy-matches any keyword in list
 * 
 * @param {string} word - Word from user query
 * @param {string[]} keywords - List of keywords to match against
 * @returns {boolean} True if word matches any keyword
 * 
 * Example:
 * matchesKeyword("sastha", PRICE_KEYWORDS) → true
 * matchesKeyword("Ifone", ["iPhone", "iphone"]) → true (75% similar)
 */
function matchesKeyword(word, keywords) {
  const normalizedWord = word.toLowerCase();
  
  return keywords.some((keyword) => {
    // Exact match
    if (normalizedWord === keyword.toLowerCase()) {
      return true;
    }
    
    // Contains match (substring)
    if (normalizedWord.includes(keyword) || keyword.includes(normalizedWord)) {
      return true;
    }
    
    // Fuzzy match (typo tolerance)
    const similarity = stringSimilarity.compareTwoStrings(normalizedWord, keyword);
    return similarity >= FUZZY_THRESHOLD;
  });
}

// ============================================================================
// MAIN INTENT DETECTION FUNCTION
// ============================================================================

/**
 * Detect user intent from search query
 * 
 * @param {string} query - Raw user query (e.g., "Sasta iPhone 16 red")
 * @returns {object} Intent object with type, priceRange, attributes
 * 
 * Flow:
 * 1. Tokenize query into words
 * 2. Check each word against keyword lists (price/quality/latest)
 * 3. Extract price range using regex
 * 4. Extract attributes (color, storage, strength)
 * 5. Return intent object
 * 
 * Example output:
 * {
 *   type: 'price',           // price | quality | latest | general
 *   priceRange: 50000,       // Extracted from "50k rupees"
 *   attributes: {
 *     color: 'red',          // Extracted from "red color"
 *     storage: '128'         // Extracted from "128GB"
 *   }
 * }
 */
function detectIntent(query) {
  // Handle empty query
  if (!query || typeof query !== 'string') {
    return {
      type: 'general',
      priceRange: null,
      attributes: {}
    };
  }

  const normalizedQuery = query.trim().toLowerCase();
  const words = normalizedQuery.split(/\s+/).filter(Boolean);

  // Initialize intent
  const intent = {
    type: 'general',
    priceRange: null,
    attributes: {}
  };

  // -------------------------------------------------------------------------
  // 1. DETECT INTENT TYPE (price/quality/latest)
  // -------------------------------------------------------------------------

  // Check for price intent
  for (const word of words) {
    if (matchesKeyword(word, PRICE_KEYWORDS)) {
      intent.type = 'price';
      break;
    }
  }

  // Check for quality intent (overrides price if both present)
  for (const word of words) {
    if (matchesKeyword(word, QUALITY_KEYWORDS)) {
      intent.type = 'quality';
      break;
    }
  }

  // Check for latest intent (highest priority)
  for (const word of words) {
    if (matchesKeyword(word, LATEST_KEYWORDS)) {
      intent.type = 'latest';
      break;
    }
  }

  // -------------------------------------------------------------------------
  // 2. EXTRACT PRICE RANGE
  // -------------------------------------------------------------------------

  const priceMatch = normalizedQuery.match(PRICE_PATTERN);
  if (priceMatch) {
    // Extract from "50k" or "50000"
    const kValue = priceMatch[1] || priceMatch[5]; // "50" from "50k"
    const fullValue = priceMatch[3]; // "50000" from "50000 rupees"
    
    if (kValue) {
      intent.priceRange = parseInt(kValue, 10) * 1000; // 50k → 50000
    } else if (fullValue) {
      intent.priceRange = parseInt(fullValue, 10);
    }

    // If price range found but no price intent, set it
    if (intent.type === 'general' && intent.priceRange) {
      intent.type = 'price';
    }
  }

  // -------------------------------------------------------------------------
  // 3. EXTRACT COLOR ATTRIBUTE
  // -------------------------------------------------------------------------

  for (const word of words) {
    for (const color of COLOR_WORDS) {
      if (word.includes(color) || stringSimilarity.compareTwoStrings(word, color) >= FUZZY_THRESHOLD) {
        intent.attributes.color = color;
        break;
      }
    }
    if (intent.attributes.color) break;
  }

  // -------------------------------------------------------------------------
  // 4. EXTRACT STORAGE ATTRIBUTE
  // -------------------------------------------------------------------------

  const storageMatch = normalizedQuery.match(STORAGE_PATTERN);
  if (storageMatch) {
    const storageValue = storageMatch[1]; // "128" from "128GB"
    if (storageValue) {
      intent.attributes.storage = storageValue + 'GB';
    } else {
      intent.attributes.storage = 'more'; // "more storage" query
    }
  }

  // -------------------------------------------------------------------------
  // 5. EXTRACT STRENGTH ATTRIBUTE (for accessories)
  // -------------------------------------------------------------------------

  for (const word of words) {
    if (matchesKeyword(word, STRENGTH_KEYWORDS)) {
      intent.attributes.strength = true;
      break;
    }
  }

  return intent;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  detectIntent,
  matchesKeyword // Export for testing
};
