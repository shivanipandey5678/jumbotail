/**
 * Search Service
 * Pipeline: get products → detect intent → rank → shape response
 */

const catalog = require('../catalog');
const { detectIntent } = require('./intent');
const { rankProducts } = require('./ranking');

/**
 * Search products by query - returns ranked results
 * @param {string} query - Search query
 * @param {object} options - { limit?: number }
 * @returns {object} { data: Array<product> }
 */
function search(query, options = {}) {
  const limit = Math.min(Number(options.limit) || 50, 100);
  const q = (query || '').trim();
  const all = catalog.getAllProducts();
  
  if (all.length === 0) {
    return { data: [] };
  }
  
  // Empty query: return highest rated products
  if (!q) {
    const sorted = [...all]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit);
    return { data: sorted.map(toSearchResult) };
  }

  // Detect intent
  const intent = detectIntent(q);
  
  // Rank products
  const ranked = rankProducts(all, q, intent);
  
  // Slice and shape response
  const slice = ranked.slice(0, limit);
  return { data: slice.map(toSearchResult) };
}

/**
 * Get suggestions for typeahead: titles/brands that match prefix
 * @param {string} q - Prefix (e.g. "iph")
 * @param {object} options - { limit?: number }
 * @returns {string[]} Suggestions
 */
function getSuggestions(q, options = {}) {
  const limit = Math.min(Number(options.limit) || 20, 50);
  const prefix = (q || '').trim().toLowerCase();
  
  if (!prefix) return [];
  
  const all = catalog.getAllProducts();
  const seen = new Set();
  const out = [];
  
  for (const p of all) {
    const title = (p.title || '').toLowerCase();
    const brand = (p.brand || '').toLowerCase();
    
    // Title starts with prefix
    if (title.startsWith(prefix) && !seen.has(p.title)) {
      seen.add(p.title);
      out.push(p.title);
    }
    
    // Brand starts with prefix
    if (brand.startsWith(prefix) && brand && !seen.has(p.brand)) {
      seen.add(p.brand);
      out.push(p.brand);
    }
    
    if (out.length >= limit) break;
  }
  
  return out.slice(0, limit);
}

/**
 * Shape product to search result (API response format)
 */
function toSearchResult(p) {
  return {
    productId: p.productId,
    title: p.title,
    description: p.description,
    mrp: p.mrp,
    Sellingprice: p.price,  // API uses "Sellingprice" per assignment
    Metadata: p.metadata || {},
    stock: p.stock,
  };
}

module.exports = { search, getSuggestions };
