/**
 * SEARCH SERVICE - Orchestrator
 * 
 * Purpose:
 * - Tie together all search components (catalog, intent, ranking)
 * - Provide clean interface for route handlers
 * - Handle edge cases (empty query, no results, etc.)
 * 
 * This is the "glue" that connects:
 * catalog.js → intent.js → ranking.js → response
 * 
 * Why separate file?
 * - Routes should be thin (just handle HTTP)
 * - Business logic lives in services
 * - Easy to add features (caching, filtering, etc.)
 */

const catalog = require('../catalog');
const { detectIntent } = require('./intent');
const { rankProducts } = require('./ranking');

// ============================================================================
// MAIN SEARCH FUNCTION
// ============================================================================

/**
 * Search products by query
 * 
 * @param {string} query - User search query
 * @param {object} options - Search options { limit, offset }
 * @returns {object} Search results { data: [...], total, query, intent }
 * 
 * Flow:
 * 1. Get all products from catalog
 * 2. Handle empty query (return top-rated products)
 * 3. Detect intent from query
 * 4. Rank products using ranking engine
 * 5. Apply pagination (limit, offset)
 * 6. Format response
 * 
 * Performance:
 * - For 100 products: ~50-100ms
 * - For 1000 products: ~100-200ms
 * - Well under 1000ms requirement!
 */
async function search(query, options = {}) {
  // -----------------------------------
  // 1. GET ALL PRODUCTS (NOW ASYNC!)
  // -----------------------------------
  const allProducts = await catalog.getAllProducts();
  
  if (allProducts.length === 0) {
    return {
      data: [],
      total: 0,
      query: query || '',
      message: 'No products in catalog'
    };
  }

  // -----------------------------------
  // 2. HANDLE EMPTY QUERY
  // -----------------------------------
  // If no query, return highest-rated products
  // (Common e-commerce pattern: show popular items)
  if (!query || query.trim() === '') {
    const topRated = [...allProducts]
      .sort((a, b) => {
        // Sort by: rating desc, review_count desc
        const ratingDiff = (b.rating || 0) - (a.rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return (b.review_count || 0) - (a.review_count || 0);
      })
      .slice(0, options.limit || 50)
      .map(formatProductForResponse);

    return {
      data: topRated,
      total: topRated.length,
      query: '',
      message: 'Showing top-rated products'
    };
  }

  // -----------------------------------
  // 3. DETECT INTENT
  // -----------------------------------
  const intent = detectIntent(query);

  // -----------------------------------
  // 4. RANK PRODUCTS
  // -----------------------------------
  const rankedProducts = rankProducts(allProducts, query, intent);

  // -----------------------------------
  // 5. PAGINATION
  // -----------------------------------
  const limit = Math.min(options.limit || 50, 100); // Max 100 results
  const offset = Math.max(options.offset || 0, 0);
  
  const paginatedProducts = rankedProducts
    .slice(offset, offset + limit)
    .map(formatProductForResponse);

  // -----------------------------------
  // 6. RETURN RESPONSE
  // -----------------------------------
  return {
    data: paginatedProducts,
    total: rankedProducts.length,
    query: query,
    intent: intent, // Include intent for debugging/analytics
    showing: paginatedProducts.length
  };
}

// ============================================================================
// RESPONSE FORMATTING
// ============================================================================

/**
 * Format product for API response
 * 
 * Maps internal product structure to API contract (from assignment)
 * 
 * Assignment specifies:
 * - productId
 * - title
 * - sellingPrice (not "price")
 * - stock
 * 
 * We also include:
 * - description (helpful for UI)
 * - mrp (to show discount)
 * - metadata (RAM, storage, etc.)
 * 
 * @param {object} product - Internal product object
 * @returns {object} API-formatted product
 */
function formatProductForResponse(product) {
  return {
    productId: product.productId,
    title: product.title || '',
    description: product.description || '',
    sellingPrice: product.price || 0,  // Assignment uses "sellingPrice"
    mrp: product.mrp || 0,
    stock: product.stock || 0,
    rating: product.rating || 0,
    metadata: product.metadata || {},
    
    // Include score for debugging (can remove in production)
    _score: product._score ? product._score.toFixed(4) : undefined
  };
}

// ============================================================================
// SUGGESTIONS (BONUS FEATURE)
// ============================================================================

/**
 * Get search suggestions (typeahead)
 * 
 * Not required by assignment, but improves UX
 * 
 * @param {string} prefix - Partial query (e.g., "iph")
 * @param {object} options - { limit }
 * @returns {string[]} Array of suggested queries
 * 
 * Logic:
 * - Find products whose title starts with prefix
 * - Return unique titles
 * 
 * Example:
 * prefix: "iph"
 * → ["iPhone 16", "iPhone 15", "iPhone 13"]
 */
async function getSuggestions(prefix, options = {}) {
  if (!prefix || prefix.trim().length < 2) {
    return [];
  }

  const normalizedPrefix = prefix.trim().toLowerCase();
  const allProducts = await catalog.getAllProducts();
  const limit = Math.min(options.limit || 10, 20);

  const suggestions = new Set();

  for (const product of allProducts) {
    const title = (product.title || '').toLowerCase();
    const brand = (product.brand || '').toLowerCase();

    // Title starts with prefix
    if (title.startsWith(normalizedPrefix)) {
      suggestions.add(product.title);
    }

    // Brand starts with prefix
    if (brand && brand.startsWith(normalizedPrefix)) {
      suggestions.add(product.brand);
    }

    // Stop once we have enough suggestions
    if (suggestions.size >= limit) break;
  }

  return Array.from(suggestions).slice(0, limit);
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  search,
  getSuggestions,
  formatProductForResponse // Export for testing
};
