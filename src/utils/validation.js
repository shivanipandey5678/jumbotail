/**
 * VALIDATION UTILITIES
 * 
 * Comprehensive input validation to prevent bugs and security issues
 */

const validator = require('validator');
const sanitizeHtml = require('sanitize-html');

// ============================================================================
// SANITIZATION
// ============================================================================

/**
 * Sanitize string input (prevent XSS)
 * Removes all HTML tags and dangerous characters
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  
  // Remove HTML tags
  const cleaned = sanitizeHtml(str, {
    allowedTags: [],
    allowedAttributes: {}
  });
  
  // Trim whitespace
  return cleaned.trim();
}

/**
 * Sanitize object (recursively sanitize all string values)
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return {};
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

// ============================================================================
// PRODUCT VALIDATION
// ============================================================================

/**
 * Validate product data for POST /api/v1/product
 * 
 * @param {object} body - Request body
 * @returns {object} { valid: boolean, errors: string[] }
 */
function validateProduct(body) {
  const errors = [];
  
  // Required fields check
  const requiredFields = ['title', 'description', 'rating', 'stock', 'price', 'mrp'];
  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  // Title validation
  if (typeof body.title !== 'string') {
    errors.push('Title must be a string');
  } else if (body.title.trim().length === 0) {
    errors.push('Title cannot be empty');
  } else if (body.title.length > 500) {
    errors.push('Title too long (max 500 characters)');
  }
  
  // Description validation
  if (typeof body.description !== 'string') {
    errors.push('Description must be a string');
  } else if (body.description.length > 5000) {
    errors.push('Description too long (max 5000 characters)');
  }
  
  // Rating validation
  const rating = Number(body.rating);
  if (isNaN(rating)) {
    errors.push('Rating must be a number');
  } else if (rating < 0 || rating > 5) {
    errors.push('Rating must be between 0 and 5');
  }
  
  // Stock validation
  const stock = Number(body.stock);
  if (isNaN(stock)) {
    errors.push('Stock must be a number');
  } else if (stock < 0) {
    errors.push('Stock cannot be negative');
  } else if (!Number.isInteger(stock)) {
    errors.push('Stock must be an integer');
  }
  
  // Price validation
  const price = Number(body.price);
  if (isNaN(price)) {
    errors.push('Price must be a number');
  } else if (price < 0) {
    errors.push('Price cannot be negative');
  }
  
  // MRP validation
  const mrp = Number(body.mrp);
  if (isNaN(mrp)) {
    errors.push('MRP must be a number');
  } else if (mrp < 0) {
    errors.push('MRP cannot be negative');
  }
  
  // Price vs MRP validation
  if (!isNaN(price) && !isNaN(mrp) && price > mrp) {
    errors.push('Price cannot exceed MRP');
  }
  
  // Currency validation (optional)
  if (body.currency && typeof body.currency !== 'string') {
    errors.push('Currency must be a string');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate metadata for PUT /api/v1/product/meta-data
 * 
 * @param {number} productId - Product ID
 * @param {object} metadata - Metadata object
 * @returns {object} { valid: boolean, errors: string[] }
 */
function validateMetadata(productId, metadata) {
  const errors = [];
  
  // Product ID validation
  const id = Number(productId);
  if (isNaN(id)) {
    errors.push('Product ID must be a number');
  } else if (id < 1) {
    errors.push('Product ID must be positive');
  } else if (!Number.isInteger(id)) {
    errors.push('Product ID must be an integer');
  }
  
  // Metadata validation
  if (metadata !== null && metadata !== undefined) {
    if (typeof metadata !== 'object' || Array.isArray(metadata)) {
      errors.push('Metadata must be an object');
    } else {
      // Check metadata size (prevent huge objects)
      const metadataString = JSON.stringify(metadata);
      if (metadataString.length > 10000) {
        errors.push('Metadata too large (max 10KB)');
      }
      
      // Validate each metadata value
      for (const [key, value] of Object.entries(metadata)) {
        // Key validation
        if (key.length > 100) {
          errors.push(`Metadata key "${key}" too long (max 100 chars)`);
        }
        
        // Value validation
        if (typeof value === 'string' && value.length > 1000) {
          errors.push(`Metadata value for "${key}" too long (max 1000 chars)`);
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate search query
 * 
 * @param {string} query - Search query
 * @param {object} options - Query options (limit, offset)
 * @returns {object} { valid: boolean, errors: string[], sanitized: object }
 */
function validateSearchQuery(query, options = {}) {
  const errors = [];
  const sanitized = {};
  
  // Query validation (optional, can be empty)
  if (query !== undefined && query !== null) {
    if (typeof query !== 'string') {
      errors.push('Query must be a string');
    } else if (query.length > 500) {
      errors.push('Query too long (max 500 characters)');
    } else {
      sanitized.query = sanitizeString(query);
    }
  } else {
    sanitized.query = '';
  }
  
  // Limit validation
  if (options.limit !== undefined) {
    const limit = Number(options.limit);
    if (isNaN(limit)) {
      sanitized.limit = 50; // Default
    } else if (limit < 1) {
      sanitized.limit = 1;
    } else if (limit > 100) {
      sanitized.limit = 100; // Max
    } else {
      sanitized.limit = Math.floor(limit);
    }
  } else {
    sanitized.limit = 50;
  }
  
  // Offset validation
  if (options.offset !== undefined) {
    const offset = Number(options.offset);
    if (isNaN(offset)) {
      sanitized.offset = 0;
    } else if (offset < 0) {
      sanitized.offset = 0;
    } else {
      sanitized.offset = Math.floor(offset);
    }
  } else {
    sanitized.offset = 0;
  }
  
  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  sanitizeString,
  sanitizeObject,
  validateProduct,
  validateMetadata,
  validateSearchQuery
};
