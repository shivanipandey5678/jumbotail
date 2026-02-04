/**
 * Intent Detection (Manual + Fuzzy)
 * Detects: price/budget, quality, latest, attributes (color, storage, strength)
 * Uses string-similarity for typo handling
 */

const stringSimilarity = require('string-similarity');

const FUZZY_THRESHOLD = 0.7; // 70% similarity

// Keywords for different intents
const PRICE_KEYWORDS = ['sasta', 'sastha', 'cheap', 'budget', 'kam', 'affordable', 'paisa'];
const QUALITY_KEYWORDS = ['best', 'top', 'badiya', 'achha', 'good', 'premium'];
const LATEST_KEYWORDS = ['latest', 'naya', 'new', 'nayi', 'recent'];
const STRENGTH_KEYWORDS = ['strong', 'durable', 'mazboot', 'tough'];

const COLOR_WORDS = ['red', 'blue', 'black', 'white', 'green', 'gold', 'silver', 'purple', 'pink', 'laal', 'neela', 'colour', 'color'];

// Patterns for price and storage
const STORAGE_PATTERN = /\b(\d+)\s*gb\b|more\s+storage|storage\s+(\d+)|(\d+)\s*gb\s+storage/i;
const PRICE_PATTERN = /(\d+)\s*k\s*(rupees?)?|(\d{4,})\s*(rupees?)?|under\s*(\d+)\s*k/i;

/**
 * Check if word fuzzy matches any keyword
 */
function matchesKeyword(word, keywords) {
  const w = word.toLowerCase();
  return keywords.some((kw) => {
    const sim = stringSimilarity.compareTwoStrings(w, kw);
    return sim >= FUZZY_THRESHOLD || w.includes(kw) || kw.includes(w);
  });
}

/**
 * Detect user intent from search query
 * @param {string} query - Raw search query
 * @returns {object} { type: 'general'|'price'|'quality'|'latest', priceRange: number|null, attributes: {} }
 */
function detectIntent(query) {
  if (!query || typeof query !== 'string') {
    return { type: 'general', priceRange: null, attributes: {} };
  }

  const q = query.trim();
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const intent = { type: 'general', priceRange: null, attributes: {} };

  // Price/budget intent (sasta, cheap, budget, kam)
  if (words.some((w) => matchesKeyword(w, PRICE_KEYWORDS))) {
    intent.type = 'price';
  }
  
  // Quality intent (best, top, badiya, achha)
  if (words.some((w) => matchesKeyword(w, QUALITY_KEYWORDS))) {
    intent.type = 'quality';
  }
  
  // Latest intent (latest, naya, new)
  if (words.some((w) => matchesKeyword(w, LATEST_KEYWORDS))) {
    intent.type = 'latest';
  }

  // Price range extraction (e.g. "50k", "50000 rupees", "under 50k")
  const priceMatch = q.match(PRICE_PATTERN);
  if (priceMatch) {
    const k = priceMatch[1] || priceMatch[5];
    const full = priceMatch[3] || priceMatch[4];
    if (k) intent.priceRange = parseInt(k, 10) * 1000;
    else if (full) intent.priceRange = parseInt(full, 10);
    if (intent.priceRange && intent.type === 'general') intent.type = 'price';
  }

  // Color detection
  const colorFound = words.some((w) => COLOR_WORDS.some((c) => w.includes(c) || stringSimilarity.compareTwoStrings(w, c) >= FUZZY_THRESHOLD));
  if (colorFound) {
    const found = COLOR_WORDS.find((c) => words.some((w) => w.includes(c) || stringSimilarity.compareTwoStrings(w, c) >= FUZZY_THRESHOLD));
    if (found) intent.attributes.color = found;
  }

  // Storage ("more storage", "128GB", "256gb")
  const storageMatch = q.match(STORAGE_PATTERN);
  if (storageMatch) {
    intent.attributes.storage = storageMatch[1] || storageMatch[2] || storageMatch[3] || 'more';
  }

  // Strength (for covers/cases)
  if (words.some((w) => matchesKeyword(w, STRENGTH_KEYWORDS))) {
    intent.attributes.strength = true;
  }

  return intent;
}

module.exports = { detectIntent, matchesKeyword };
