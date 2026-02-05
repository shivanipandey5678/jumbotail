/**
 * PRODUCT ROUTES (HARDENED VERSION)
 * 
 * Fixed all edge cases:
 * - Input validation (negative values, max lengths, type checking)
 * - XSS prevention (sanitize all strings)
 * - Proper error messages
 * - Security best practices
 */

const express = require('express');
const catalog = require('../catalog');
const { validateProduct, validateMetadata, sanitizeObject } = require('../utils/validation');

const router = express.Router();

// ============================================================================
// POST /api/v1/product - Add Product (WITH VALIDATION)
// ============================================================================

router.post('/product', async (req, res) => {
  try {
    const body = req.body || {};
    
    // STEP 1: Validate all inputs
    const validation = validateProduct(body);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Product validation failed',
        errors: validation.errors
      });
    }
    
    // STEP 2: Sanitize strings (prevent XSS)
    const sanitized = sanitizeObject(body);
    
    // STEP 3: Add product with clean data (NOW ASYNC!)
    const productId = await catalog.addProduct({
      title: sanitized.title,
      description: sanitized.description,
      rating: Number(body.rating),
      stock: Number(body.stock),
      price: Number(body.price),
      mrp: Number(body.mrp),
      currency: sanitized.currency || 'Rupee',
      category: sanitized.category || 'electronics',
      brand: sanitized.brand || ''
    });
    
    res.status(201).json({ productId });

  } catch (error) {
    console.error('POST /api/v1/product error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' ? 'An error occurred' : error.message
    });
  }
});

// ============================================================================
// PUT /api/v1/product/meta-data - Update Metadata (WITH VALIDATION)
// ============================================================================

router.put('/product/meta-data', async (req, res) => {
  try {
    const body = req.body || {};
    
    // Get metadata (support both lowercase and uppercase per assignment)
    const metadata = body.metadata || body.Metadata || {};
    
    // STEP 1: Validate inputs
    const validation = validateMetadata(body.productId, metadata);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Metadata validation failed',
        errors: validation.errors
      });
    }
    
    // STEP 2: Sanitize metadata (prevent XSS)
    const sanitizedMetadata = sanitizeObject(metadata);
    
    // STEP 3: Update metadata (NOW ASYNC!)
    const productId = body.productId;
    const result = await catalog.updateMetadata(productId, sanitizedMetadata);

    if (result === null) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Product with ID ${productId} not found`
      });
    }
    
    res.json({
      productId: result.productId,
      Metadata: result.metadata
    });

  } catch (error) {
    console.error('PUT /api/v1/product/meta-data error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' ? 'An error occurred' : error.message
    });
  }
});

module.exports = router;
