/**
 * Ranking Engine
 * Combines: relevance (text + fuzzy) + intent + quality (rating, reviews, sales) + stock + newness
 */

const stringSimilarity = require('string-similarity');

const FUZZY_THRESHOLD = 0.5;

/**
 * Normalize and tokenize text for matching
 */
function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
}

/**
 * Text relevance score (0-1): how well query matches title, description, metadata
 */
function relevanceScore(query, product) {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return 0.5;

  const title = (product.title || '').toLowerCase();
  const desc = (product.description || '').toLowerCase();
  const metaStr = product.metadata && typeof product.metadata === 'object'
    ? Object.values(product.metadata).filter(Boolean).join(' ').toLowerCase()
    : '';

  let score = 0;
  let matched = 0;
  
  for (const qt of qTokens) {
    let best = 0;
    
    // Exact or fuzzy match in title
    if (title.includes(qt)) {
      best = Math.max(best, 1);
    } else {
      const titleWords = title.split(/\s+/).filter(Boolean);
      if (titleWords.length) {
        const sim = stringSimilarity.findBestMatch(qt, titleWords).bestMatch?.rating ?? 0;
        if (sim >= FUZZY_THRESHOLD) best = Math.max(best, sim);
      }
    }
    
    // Match in description
    if (desc.includes(qt)) best = Math.max(best, 0.8);
    
    // Match in metadata
    if (metaStr && metaStr.includes(qt)) best = Math.max(best, 0.9);
    
    score += best;
    if (best > 0) matched++;
  }
  
  const norm = (score / qTokens.length) * (0.5 + 0.5 * (matched / qTokens.length));
  return Math.min(1, norm);
}

/**
 * Intent-based boost: price (cheaper/discount), quality (rating), latest (recency)
 */
function intentBoost(product, intent) {
  if (!intent || intent.type === 'general') return 1.0;

  if (intent.type === 'price') {
    // Prefer cheaper + higher discount
    const discount = product.mrp > 0 ? (product.mrp - product.price) / product.mrp : 0;
    const cheapScore = product.price <= 100000 ? 1 - product.price / 100000 : 0.3;
    return 0.5 + 0.5 * (discount * 0.6 + cheapScore * 0.4);
  }

  if (intent.type === 'quality') {
    // Prefer higher rating
    return 0.5 + 0.5 * ((product.rating || 0) / 5);
  }

  if (intent.type === 'latest') {
    // Prefer recent launches
    const launch = product.launch_date ? new Date(product.launch_date).getFullYear() : 2020;
    const now = new Date().getFullYear();
    const yearsAgo = now - launch;
    const recency = Math.max(0, 1 - yearsAgo / 5);
    return 0.5 + 0.5 * recency;
  }

  return 1.0;
}

/**
 * Newness boost: recent products (last 6 months) with rating >= 4.0 get a boost
 */
function newnessBoost(product) {
  const launch = product.launch_date ? new Date(product.launch_date) : null;
  if (!launch) return 1.0;
  
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  if (launch < sixMonthsAgo) return 1.0;
  
  const rating = Number(product.rating) || 0;
  if (rating >= 4.0) return 1.15; // 15% boost for new quality products
  
  return 1.0;
}

/**
 * Quality score: rating + review count (confidence)
 */
function qualityScore(product) {
  const r = (Number(product.rating) || 0) / 5;
  const rc = Math.log(1 + (Number(product.review_count) || 0)) / 10;
  return Math.min(1, r * (0.6 + 0.4 * Math.min(1, rc)));
}

/**
 * Trust score: verified reviews, photo reviews, low return rate
 */
function trustScore(product) {
  const rc = Number(product.review_count) || 1;
  const verified = Number(product.verified_review_count) || 0;
  const photo = Number(product.photo_review_count) || 0;
  const trust = (verified + photo * 2) / (rc + 1);
  const returnRate = Number(product.return_rate) || 0;
  return Math.min(1, trust) * (1 - returnRate);
}

/**
 * Popularity score: units sold (log scale)
 */
function popularityScore(product) {
  const u = Number(product.units_sold) || 0;
  return Math.min(1, Math.log(1 + u) / 12);
}

/**
 * Stock boost: penalize out-of-stock products
 */
function stockBoost(product) {
  const s = Number(product.stock) || 0;
  return s > 0 ? 1.0 : 0.15; // Out of stock = 15% of score
}

/**
 * Attribute boost: color, storage, strength match in metadata/title/description
 */
function attributeBoost(product, intent) {
  const attrs = intent?.attributes || {};
  if (!attrs.color && !attrs.storage && !attrs.strength) return 1.0;
  
  const text = [product.title, product.description, JSON.stringify(product.metadata || {})].join(' ').toLowerCase();
  
  let mult = 1.0;
  if (attrs.color && text.includes(attrs.color)) mult *= 1.2;
  if (attrs.storage && (text.includes(attrs.storage) || text.includes('storage') || text.includes('gb'))) mult *= 1.1;
  if (attrs.strength && (text.includes('strong') || text.includes('durable') || text.includes('cover'))) mult *= 1.1;
  
  return mult;
}

/**
 * Rank products: combine all signals and return sorted
 * @param {Array} products - All products
 * @param {string} query - Search query
 * @param {object} intent - Detected intent
 * @returns {Array} Sorted products with _score
 */
function rankProducts(products, query, intent) {
  return products.map((p) => {
    const rel = relevanceScore(query, p);
    const intentB = intentBoost(p, intent);
    const qual = qualityScore(p);
    const trust = trustScore(p);
    const pop = popularityScore(p);
    const stockB = stockBoost(p);
    const newB = newnessBoost(p);
    const attrB = attributeBoost(p, intent);

    // Weighted sum of all signals
    const score =
      rel * 0.30 +        // Relevance (30%)
      intentB * 0.20 +    // Intent alignment (20%)
      qual * 0.18 +       // Quality (18%)
      trust * 0.12 +      // Trust (12%)
      pop * 0.12 +        // Popularity (12%)
      (stockB * 0.08);    // Stock (8%)
    
    const finalScore = score * newB * attrB; // Apply newness + attribute boosts

    return { ...p, _score: finalScore };
  })
  .filter((p) => p._score > 0.01) // Filter very low scores
  .sort((a, b) => b._score - a._score); // Sort descending
}

module.exports = {
  relevanceScore,
  intentBoost,
  newnessBoost,
  qualityScore,
  trustScore,
  popularityScore,
  stockBoost,
  attributeBoost,
  rankProducts,
  tokenize,
};
