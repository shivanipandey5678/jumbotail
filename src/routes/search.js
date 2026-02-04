/**
 * Search Routes
 * GET /api/v1/search/product?query=... - Search products
 * GET /api/v1/search/suggestions?q=... - Get suggestions for typeahead
 */

const express = require('express');
const searchService = require('../services/search');

const router = express.Router();

/**
 * GET /api/v1/search/product?query=...
 * Search products - returns ranked results
 */
router.get('/product', (req, res) => {
  try {
    const query = req.query.query ?? req.query.q ?? '';
    const limit = req.query.limit;
    
    const result = searchService.search(query, { limit });
    
    res.json(result);
  } catch (err) {
    console.error('GET /search/product error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

/**
 * GET /api/v1/search/suggestions?q=...
 * Get suggestions for typeahead
 */
router.get('/suggestions', (req, res) => {
  try {
    const q = req.query.q ?? req.query.query ?? '';
    const limit = req.query.limit;
    
    const suggestions = searchService.getSuggestions(q, { limit });
    
    res.json(suggestions);
  } catch (err) {
    console.error('GET /search/suggestions error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

module.exports = router;
