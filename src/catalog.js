/**
 * CATALOG MODULE - MongoDB Product Storage
 * 
 * Purpose:
 * - Store all products in MongoDB (cloud database)
 * - Provide CRUD operations for products
 * - Replaced in-memory Map with persistent database
 * 
 * Why MongoDB over Map?
 * - Data persists even after server restart
 * - Can scale to millions of products
 * - Built-in text search
 * - Cloud backup
 * 
 * Trade-off:
 * - Slightly slower than in-memory (~10-50ms per query)
 * - But still under 1000ms requirement!
 */

const { getDB } = require('./db/mongodb');
const { ObjectId } = require('mongodb');

// ============================================================================
// ADD PRODUCT
// ============================================================================

/**
 * Add a new product to MongoDB
 * 
 * @param {Object} productData - Product details
 * @returns {Promise<string>} MongoDB _id of inserted product
 * 
 * Flow:
 * 1. Get database connection
 * 2. Add timestamps
 * 3. Insert into 'products' collection
 * 4. Return generated _id
 */
async function addProduct(productData) {
  const db = getDB();
  
  const product = {
    ...productData,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const result = await db.collection('products').insertOne(product);
  return result.insertedId.toString();
}

// ============================================================================
// GET ALL PRODUCTS
// ============================================================================

/**
 * Get all products from MongoDB
 * 
 * @returns {Promise<Array>} Array of all products
 * 
 * Used by:
 * - Search service (to rank all products)
 * - Initial data load
 * 
 * Performance:
 * - ~50-100ms for 1000 products
 * - Well under 1000ms requirement
 */
async function getAllProducts() {
  const db = getDB();
  const products = await db.collection('products').find({}).toArray();
  
  // Convert MongoDB _id to productId for consistency
  return products.map(product => ({
    ...product,
    productId: product.productId || product._id.toString()
  }));
}

// ============================================================================
// UPDATE METADATA
// ============================================================================

/**
 * Update product metadata
 * 
 * @param {string} productId - Product ID (MongoDB _id or custom productId)
 * @param {Object} metadata - Metadata object (ram, storage, color, etc.)
 * @returns {Promise<Object|null>} Updated product or null if not found
 * 
 * Flow:
 * 1. Try to find by custom productId first
 * 2. If not found and looks like ObjectId, try MongoDB _id
 * 3. Update metadata field
 * 4. Update updatedAt timestamp
 * 5. Return updated product
 */
async function updateMetadata(productId, metadata) {
  const db = getDB();
  
  let query;
  
  // Try custom productId first
  if (!isNaN(productId)) {
    query = { productId: parseInt(productId) };
  } 
  // Try MongoDB _id if it looks like ObjectId format
  else if (ObjectId.isValid(productId) && productId.length === 24) {
    query = { _id: new ObjectId(productId) };
  }
  // Try both
  else {
    query = { $or: [
      { productId: parseInt(productId) || productId },
      ObjectId.isValid(productId) ? { _id: new ObjectId(productId) } : {}
    ]};
  }
  
  const result = await db.collection('products').findOneAndUpdate(
    query,
    { 
      $set: { 
        metadata,
        updatedAt: new Date()
      } 
    },
    { returnDocument: 'after' } // Return updated document
  );
  
  if (!result.value) {
    return null; // Product not found
  }
  
  return {
    ...result.value,
    productId: result.value.productId || result.value._id.toString()
  };
}

// ============================================================================
// GET PRODUCT BY ID
// ============================================================================

/**
 * Get a single product by ID
 * 
 * @param {string} productId - Product ID
 * @returns {Promise<Object|null>} Product or null if not found
 */
async function getProductById(productId) {
  const db = getDB();
  
  let query;
  
  // Try custom productId first
  if (!isNaN(productId)) {
    query = { productId: parseInt(productId) };
  } 
  // Try MongoDB _id
  else if (ObjectId.isValid(productId) && productId.length === 24) {
    query = { _id: new ObjectId(productId) };
  }
  else {
    return null;
  }
  
  const product = await db.collection('products').findOne(query);
  
  if (!product) {
    return null;
  }
  
  return {
    ...product,
    productId: product.productId || product._id.toString()
  };
}

// ============================================================================
// GET COLLECTION SIZE
// ============================================================================

/**
 * Get total number of products
 * 
 * @returns {Promise<number>} Count of products
 */
async function getSize() {
  const db = getDB();
  return await db.collection('products').countDocuments();
}

// ============================================================================
// SEARCH PRODUCTS (Text Search)
// ============================================================================

/**
 * Search products using MongoDB text search
 * 
 * @param {string} query - Search query
 * @returns {Promise<Array>} Matching products
 * 
 * Uses MongoDB's built-in text index for fast searching
 * Searches in: title, description
 */
async function searchProducts(query) {
  const db = getDB();
  
  const products = await db.collection('products').find({
    $text: { $search: query }
  }, {
    score: { $meta: "textScore" }
  })
  .sort({ score: { $meta: "textScore" } })
  .toArray();
  
  return products.map(product => ({
    ...product,
    productId: product.productId || product._id.toString()
  }));
}

// ============================================================================
// BULK INSERT (For Migration)
// ============================================================================

/**
 * Bulk insert multiple products
 * Used by migration script
 * 
 * @param {Array} productsArray - Array of products
 * @returns {Promise<number>} Number of products inserted
 */
async function bulkInsertProducts(productsArray) {
  const db = getDB();
  
  const productsWithTimestamps = productsArray.map(product => ({
    ...product,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  
  const result = await db.collection('products').insertMany(productsWithTimestamps);
  return result.insertedCount;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  addProduct,
  getAllProducts,
  updateMetadata,
  getProductById,
  getSize,
  searchProducts,
  bulkInsertProducts
};
