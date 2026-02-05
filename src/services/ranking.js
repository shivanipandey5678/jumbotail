/**
 * RANKING ENGINE
 * 
 * Purpose:
 * - Calculate a score for each product based on query + product attributes
 * - Combine multiple ranking signals (text match, rating, price, stock, etc.)
 * - Sort products by score (highest first)
 * 
 * Assignment Formula (from question.txt):
 * FinalScore = (TextMatch × 0.35) + (Rating × 0.20) + (Sales × 0.15) + 
 *              (Price × 0.15) + (Stock × 0.10) + (ReturnPenalty × 0.05)
 * 
 * We enhance this with:
 * - Intent-based boosting (cheap for "sasta", new for "latest")
 * - Trust signals (verified reviews, photo reviews)
 * - Attribute matching (color, storage)
 * 
 * Why separate file?
 * - Ranking logic is complex and math-heavy
 * - Easy to tune weights without touching other code
 * - Can A/B test different formulas
 */

const stringSimilarity = require('string-similarity');

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Ranking weights (based on assignment + enhancements)
 * 
 * Higher weight = more important in final score
 * Total should ideally sum to 1.0 (100%)
 */
const WEIGHTS = {
  textRelevance: 0.35,    // How well query matches title/description
  rating: 0.20,           // Product rating (4.5 stars)
  sales: 0.15,            // Units sold (popularity)
  price: 0.15,            // Price (depends on intent: cheap vs expensive)
  stock: 0.10,            // Stock availability
  returnPenalty: 0.05     // Return rate penalty
};

/**
 * Fuzzy matching threshold for title words
 */
const FUZZY_THRESHOLD = 0.5;

// ============================================================================
// HELPER: TOKENIZE TEXT
// ============================================================================

/**
 * Normalize and split text into words
 * 
 * @param {string} text - Text to tokenize
 * @returns {string[]} Array of lowercase words
 * 
 * Example:
 * tokenize("iPhone 16 Pro") → ["iphone", "16", "pro"]
 */
function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(Boolean);
}

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * 1. TEXT RELEVANCE SCORE (0-1)
 * 
 * How well does the query match the product?
 * Checks: title, description, metadata
 * 
 * @param {string} query - User search query
 * @param {object} product - Product object
 * @returns {number} Score between 0 and 1
 * 
 * Logic:
 * - For each query word, find best match in title
 * - Use exact match (1.0) or fuzzy match (0.5-1.0)
 * - Average across all query words
 * 
 * Example:
 * Query: "Ifone 16"
 * Product title: "iPhone 16 Pro"
 * - "Ifone" fuzzy matches "iPhone" (0.75)
 * - "16" exact matches "16" (1.0)
 * → Average: 0.875
 */
function calculateTextRelevance(query, product) {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return 0.5; // Neutral score for empty query

  const title = (product.title || '').toLowerCase();
  const description = (product.description || '').toLowerCase();
  const metadataStr = product.metadata 
    ? Object.values(product.metadata).filter(Boolean).join(' ').toLowerCase()
    : '';

  const titleWords = tokenize(product.title || '');
  
  let totalScore = 0;
  let matchedWords = 0;

  for (const queryWord of queryTokens) {
    let bestScore = 0;

    // Check title for exact or fuzzy match
    if (title.includes(queryWord)) {
      bestScore = Math.max(bestScore, 1.0); // Exact match in title
    } else if (titleWords.length > 0) {
      // Fuzzy match against title words
      const match = stringSimilarity.findBestMatch(queryWord, titleWords);
      if (match.bestMatch.rating >= FUZZY_THRESHOLD) {
        bestScore = Math.max(bestScore, match.bestMatch.rating);
      }
    }

    // Check description (lower weight)
    if (description.includes(queryWord)) {
      bestScore = Math.max(bestScore, 0.8);
    }

    // Check metadata (medium weight)
    if (metadataStr && metadataStr.includes(queryWord)) {
      bestScore = Math.max(bestScore, 0.9);
    }

    totalScore += bestScore;
    if (bestScore > 0) matchedWords++;
  }

  // Normalize by query length, boost if all words matched
  const avgScore = totalScore / queryTokens.length;
  const matchRatio = matchedWords / queryTokens.length;
  
  return avgScore * (0.5 + 0.5 * matchRatio); // Boost if more words matched
}

/**
 * 2. RATING SCORE (0-1)
 * 
 * Product rating with confidence boost from review count
 * 
 * Logic:
 * - Base: rating / 5 (4.5 stars → 0.9)
 * - Confidence: log(review_count) to boost highly-reviewed products
 * 
 * Why log?
 * - 100 reviews vs 10 reviews: big difference
 * - 10,000 reviews vs 9,000 reviews: small difference (diminishing returns)
 */
function calculateRatingScore(product) {
  const rating = Number(product.rating) || 0;
  const reviewCount = Number(product.review_count) || 1;
  
  const baseScore = rating / 5; // Normalize to 0-1
  const confidenceBoost = Math.log(1 + reviewCount) / 10; // log(101) ≈ 0.46
  
  return Math.min(1, baseScore * (0.6 + 0.4 * Math.min(1, confidenceBoost)));
}

/**
 * 3. SALES/POPULARITY SCORE (0-1)
 * 
 * Units sold (social proof)
 * Uses log scale (same reasoning as rating confidence)
 */
function calculateSalesScore(product) {
  const unitsSold = Number(product.units_sold) || 0;
  return Math.min(1, Math.log(1 + unitsSold) / 12); // log(162755) ≈ 12
}

/**
 * 4. PRICE SCORE (0-1)
 * 
 * CRITICAL: Score depends on intent!
 * - Price intent ("sasta"): Cheaper = Higher score
 * - Quality intent ("best"): More expensive might be better
 * - General: Neutral (discount % matters)
 * 
 * @param {object} product
 * @param {object} intent - From intent.js
 * @returns {number} Score between 0 and 1
 */
function calculatePriceScore(product, intent) {
  const price = Number(product.price) || 0;
  const mrp = Number(product.mrp) || price;
  const discount = mrp > 0 ? (mrp - price) / mrp : 0;

  // Price intent: prefer cheaper products
  if (intent.type === 'price') {
    // Normalize price to 0-1 (assume max price is 200k)
    const priceNorm = Math.max(0, 1 - price / 200000);
    
    // If user specified price range, boost products near that range
    if (intent.priceRange) {
      const distanceFromTarget = Math.abs(price - intent.priceRange);
      const proximityBoost = Math.max(0, 1 - distanceFromTarget / intent.priceRange);
      return 0.6 * priceNorm + 0.4 * proximityBoost;
    }
    
    return 0.5 * priceNorm + 0.5 * discount; // Cheap + high discount
  }

  // Quality intent: don't penalize higher prices
  if (intent.type === 'quality') {
    return 0.5 + 0.5 * discount; // Just reward discounts
  }

  // General: discount matters most
  return 0.3 + 0.7 * discount;
}

/**
 * 5. STOCK SCORE (0-1)
 * 
 * Heavily penalize out-of-stock products
 * 
 * Logic:
 * - In stock: 1.0
 * - Out of stock: 0.2 (massive penalty)
 * - Low stock (< 5): 0.7 (slight penalty)
 */
function calculateStockScore(product) {
  const stock = Number(product.stock) || 0;
  
  if (stock === 0) return 0.2;  // Out of stock → 80% penalty
  if (stock < 5) return 0.7;    // Low stock → 30% penalty
  return 1.0;                   // In stock → full score
}

/**
 * 6. RETURN PENALTY (0-1)
 * 
 * High return rate = quality issues
 * 
 * Logic:
 * - 0% return rate: score = 1.0
 * - 20% return rate: score = 0.0
 */
function calculateReturnPenalty(product) {
  const returnRate = Number(product.return_rate) || 0;
  return Math.max(0, 1 - returnRate * 5); // 20% return → 0 score
}

/**
 * 7. TRUST SCORE (BONUS)
 * 
 * Verified reviews + photo reviews = trustworthy
 * 
 * Not in assignment, but improves ranking quality
 */
function calculateTrustScore(product) {
  const reviewCount = Number(product.review_count) || 1;
  const verifiedCount = Number(product.verified_review_count) || 0;
  const photoCount = Number(product.photo_review_count) || 0;
  
  const trustRatio = (verifiedCount + photoCount * 2) / (reviewCount + 1);
  return Math.min(1, trustRatio);
}

/**
 * 8. INTENT BOOST (MULTIPLIER)
 * 
 * Boost products that match user intent
 * 
 * Examples:
 * - "Latest iPhone": Boost products launched in last 6 months
 * - "Sasta": Already handled in price score
 * - "Best": Boost high-rated products
 */
function calculateIntentBoost(product, intent) {
  if (intent.type === 'latest') {
    // Boost recent products
    const launchDate = product.launch_date ? new Date(product.launch_date) : null;
    if (!launchDate) return 1.0;
    
    const monthsAgo = (new Date() - launchDate) / (1000 * 60 * 60 * 24 * 30);
    if (monthsAgo < 6 && product.rating >= 4.0) {
      return 1.2; // 20% boost for new, high-rated products
    }
  }
  
  if (intent.type === 'quality') {
    // Boost high-rated products
    if (product.rating >= 4.5) return 1.15;
  }
  
  return 1.0; // No boost
}

/**
 * 9. ATTRIBUTE BOOST (MULTIPLIER)
 * 
 * Boost products matching specific attributes
 * 
 * Example:
 * Query: "iPhone 16 red color 128GB"
 * Product metadata: { color: 'red', storage: '128GB' }
 * → Boost by 30%
 */
function calculateAttributeBoost(product, intent) {
  if (!intent.attributes || Object.keys(intent.attributes).length === 0) {
    return 1.0;
  }

  const productText = [
    product.title,
    product.description,
    JSON.stringify(product.metadata || {})
  ].join(' ').toLowerCase();

  let boost = 1.0;

  // Color match
  if (intent.attributes.color) {
    if (productText.includes(intent.attributes.color.toLowerCase())) {
      boost *= 1.15; // 15% boost
    }
  }

  // Storage match
  if (intent.attributes.storage) {
    const storageValue = intent.attributes.storage;
    if (storageValue === 'more') {
      // Prefer higher storage (256GB > 128GB > 64GB)
      if (productText.includes('256gb') || productText.includes('512gb')) {
        boost *= 1.1;
      }
    } else if (productText.includes(storageValue.toLowerCase())) {
      boost *= 1.15;
    }
  }

  // Strength match (for covers/accessories)
  if (intent.attributes.strength) {
    if (productText.includes('strong') || productText.includes('durable')) {
      boost *= 1.1;
    }
  }

  return boost;
}

// ============================================================================
// MAIN RANKING FUNCTION
// ============================================================================

/**
 * Rank all products for a given query
 * 
 * @param {object[]} products - Array of all products
 * @param {string} query - User search query
 * @param {object} intent - Intent object from intent.js
 * @returns {object[]} Sorted array of products with _score field
 * 
 * Flow:
 * 1. For each product, calculate all scores
 * 2. Combine scores using weighted formula
 * 3. Apply multipliers (intent boost, attribute boost)
 * 4. Sort by final score (descending)
 * 5. Return ranked list
 */
function rankProducts(products, query, intent) {
  const rankedProducts = products.map((product) => {
    // Calculate individual scores
    const textScore = calculateTextRelevance(query, product);
    const ratingScore = calculateRatingScore(product);
    const salesScore = calculateSalesScore(product);
    const priceScore = calculatePriceScore(product, intent);
    const stockScore = calculateStockScore(product);
    const returnScore = calculateReturnPenalty(product);
    
    // Bonus scores (not in assignment formula)
    const trustScore = calculateTrustScore(product);
    
    // Weighted sum (based on assignment formula)
    const baseScore = 
      textScore * WEIGHTS.textRelevance +
      ratingScore * WEIGHTS.rating +
      salesScore * WEIGHTS.sales +
      priceScore * WEIGHTS.price +
      stockScore * WEIGHTS.stock +
      returnScore * WEIGHTS.returnPenalty;
    
    // Add trust as small bonus (not weighted)
    const scoreWithBonus = baseScore * 0.9 + trustScore * 0.1;
    
    // Apply multipliers
    const intentBoost = calculateIntentBoost(product, intent);
    const attributeBoost = calculateAttributeBoost(product, intent);
    
    const finalScore = scoreWithBonus * intentBoost * attributeBoost;
    
    // Return product with score
    return {
      ...product,
      _score: finalScore,
      _debug: { // For debugging (can remove in production)
        textScore,
        ratingScore,
        salesScore,
        priceScore,
        stockScore,
        returnScore,
        trustScore,
        intentBoost,
        attributeBoost
      }
    };
  });

  // Sort by score (highest first) and filter very low scores
  return rankedProducts
    .filter(p => p._score > 0.05) // Remove irrelevant products
    .sort((a, b) => b._score - a._score);
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  rankProducts,
  
  // Export individual functions for testing
  calculateTextRelevance,
  calculateRatingScore,
  calculateSalesScore,
  calculatePriceScore,
  calculateStockScore,
  calculateReturnPenalty
};
