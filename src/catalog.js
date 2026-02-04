/**
 * In-memory product catalog
 * - Loads products from JSON file on startup
 * - Supports add, update metadata, get, list
 */

const fs = require('fs');
const path = require('path');

// In-memory storage: Map of productId -> product
const products = new Map();
let nextId = 1;

/**
 * Load products from JSON file
 * @param {string} filePath - Path to products JSON
 * @returns {number} Count of products loaded
 */
function loadFromFile(filePath) {
  const resolved = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(resolved)) {
    console.log(`⚠️  File not found: ${resolved}`);
    return 0;
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(resolved, 'utf8'));
    const list = Array.isArray(data) ? data : [];
    
    list.forEach((p) => {
      const id = p.productId != null ? p.productId : nextId++;
      products.set(id, { ...p, productId: id });
      if (id >= nextId) nextId = id + 1;
    });
    
    return list.length;
  } catch (err) {
    console.error('❌ Catalog load error:', err.message);
    return 0;
  }
}

/**
 * Add a new product
 * @param {object} body - Product data (title, description, rating, stock, price, mrp, currency)
 * @returns {number} productId
 */
function addProduct(body) {
  const productId = nextId++;
  const product = {
    productId,
    title: body.title ?? '',
    description: body.description ?? '',
    category: body.category ?? 'mobile',
    brand: body.brand ?? '',
    rating: Number(body.rating) || 0,
    review_count: body.review_count ?? 0,
    units_sold: body.units_sold ?? 0,
    stock: Number(body.stock) || 0,
    price: Number(body.price) || 0,
    mrp: Number(body.mrp) || 0,
    currency: body.currency ?? 'Rupee',
    verified_review_count: body.verified_review_count ?? 0,
    photo_review_count: body.photo_review_count ?? 0,
    return_rate: body.return_rate ?? 0,
    complaint_count: body.complaint_count ?? 0,
    launch_date: body.launch_date ?? new Date().toISOString().split('T')[0],
    metadata: body.metadata && typeof body.metadata === 'object' ? { ...body.metadata } : {},
  };
  
  products.set(productId, product);
  return productId;
}

/**
 * Update metadata for a product
 * @param {number} productId
 * @param {object} metadata - Metadata object (ram, storage, etc.)
 * @returns {object|null} { productId, Metadata } or null if not found
 */
function updateMetadata(productId, metadata) {
  const p = products.get(Number(productId));
  if (!p) return null;
  
  const meta = metadata && typeof metadata === 'object' ? { ...metadata } : {};
  p.metadata = { ...(p.metadata || {}), ...meta };
  
  return { productId: p.productId, Metadata: p.metadata };
}

/**
 * Get product by ID
 */
function getProduct(productId) {
  return products.get(Number(productId));
}

/**
 * Get all products (for search)
 */
function getAllProducts() {
  return Array.from(products.values());
}

/**
 * Get catalog size
 */
function size() {
  return products.size;
}

module.exports = {
  loadFromFile,
  addProduct,
  updateMetadata,
  getProduct,
  getAllProducts,
  size,
};
