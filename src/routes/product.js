/**
 * Product Routes
 * POST /api/v1/product - Add product
 * PUT /api/v1/product/meta-data - Update metadata
 */

const express = require('express');
const catalog = require('../catalog');

const router = express.Router();

/**
 * POST /api/v1/product
 * Add a new product to the catalog
 */
router.post('/product', (req, res) => {
  try {
    const body = req.body || {};
    const { title, description, rating, stock, price, mrp, currency } = body;
    
    // Validate required fields
    if (title == null || description == null || rating == null || stock == null || price == null || mrp == null) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: title, description, rating, stock, price, mrp',
      });
    }
    
    // Add product
    const productId = catalog.addProduct({
      title,
      description,
      rating: Number(rating),
      stock: Number(stock),
      price: Number(price),
      mrp: Number(mrp),
      currency: currency ?? 'Rupee',
    });
    
    res.status(201).json({ productId });
  } catch (err) {
    console.error('POST /product error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

/**
 * PUT /api/v1/product/meta-data
 * Update product metadata
 */
router.put('/product/meta-data', (req, res) => {
  try {
    const body = req.body || {};
    const { productId, Metadata: metadata } = body;
    
    // Validate
    if (productId == null) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required field: productId',
      });
    }
    
    // Update
    const result = catalog.updateMetadata(productId, metadata);
    
    if (result == null) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Product ${productId} not found`,
      });
    }
    
    res.json(result);
  } catch (err) {
    console.error('PUT /product/meta-data error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

module.exports = router;
