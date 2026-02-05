/**
 * SEARCH ROUTES
 * 
 * Endpoints:
 * 1. GET /api/v1/search/product?query=... - Search products
 * 2. GET /api/v1/search/suggestions?q=... - Get search suggestions (bonus)
 * 
 * Responsibility:
 * - Parse query parameters
 * - Call search service
 * - Return results
 * - Handle errors
 * 
 * Why separate from product routes?
 * - Logical separation: search vs. product management
 * - Can mount on different base paths
 * - Easier to add more search features (filters, facets, etc.)
 */

const express = require('express');
const searchService = require('../services/search');
const { validateSearchQuery } = require('../utils/validation');

const router = express.Router();

// ============================================================================
// GET /api/v1/search/product - Search Products
// ============================================================================

/**
 * Search products by query
 * 
 * Query parameters:
 * - query (required): Search query (e.g., "Sasta iPhone")
 * - limit (optional): Max results to return (default: 50, max: 100)
 * - offset (optional): Pagination offset (default: 0)
 * 
 * Example request:
 * GET /api/v1/search/product?query=Sasta%20iPhone&limit=10
 * 
 * Example response (from assignment):
 * {
 *   "data": [
 *     {
 *       "productId": 80,
 *       "title": "iPhone 13",
 *       "sellingPrice": 35000,
 *       "stock": 10
 *     },
 *     {
 *       "productId": 101,
 *       "title": "iPhone 16",
 *       "sellingPrice": 59000,
 *       "stock": 10
 *     }
 *   ]
 * }
 * 
 * Performance requirement: < 1000ms
 */
router.get('/product', async (req, res) => {
  try {
    // STEP 1: Validate and sanitize inputs
    const query = req.query.query || req.query.q || '';
    const validation = validateSearchQuery(query, {
      limit: req.query.limit,
      offset: req.query.offset
    });
    
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Search validation failed',
        errors: validation.errors
      });
    }
    
    // Use sanitized values
    const { query: sanitizedQuery, limit, offset } = validation.sanitized;

    // STEP 2: Call search service (NOW ASYNC!)
    const startTime = Date.now();
    
    const results = await searchService.search(sanitizedQuery, { limit, offset });
    
    const duration = Date.now() - startTime;

    // STEP 3: Log performance
    console.log(`🔍 Search "${sanitizedQuery}" took ${duration}ms (${results.total} results)`);

    if (duration > 500) {
      console.warn(`⚠️  Search latency high: ${duration}ms (target: <1000ms)`);
    }

    // STEP 4: Return results
    res.json({
      ...results,
      _performance: {
        duration_ms: duration,
        target_ms: 1000
      }
    });

  } catch (error) {
    console.error('GET /api/v1/search/product error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' ? 'An error occurred' : error.message
    });
  }
});

// ============================================================================
// GET /api/v1/search/suggestions - Get Suggestions (BONUS)
// ============================================================================

/**
 * Get search suggestions for typeahead
 * 
 * Not required by assignment, but improves UX
 * 
 * Query parameters:
 * - q (required): Partial query (e.g., "iph")
 * - limit (optional): Max suggestions (default: 10, max: 20)
 * 
 * Example request:
 * GET /api/v1/search/suggestions?q=iph&limit=5
 * 
 * Example response:
 * {
 *   "suggestions": [
 *     "iPhone 16",
 *     "iPhone 15",
 *     "iPhone 13"
 *   ]
 * }
 */
router.get('/suggestions', async (req, res) => {
  try {
    const prefix = req.query.q || req.query.query || '';
    const limit = parseInt(req.query.limit) || 10;

    if (prefix.length < 2) {
      return res.json({ suggestions: [] });
    }

    const suggestions = await searchService.getSuggestions(prefix, { limit });

    res.json({ suggestions });

  } catch (error) {
    console.error('GET /api/v1/search/suggestions error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;
