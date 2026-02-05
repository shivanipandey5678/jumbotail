/**
 * MAIN SERVER - Entry Point
 * 
 * Purpose:
 * - Initialize Express server
 * - Connect to MongoDB Atlas (cloud database)
 * - Mount API routes
 * - Start listening on port 3000
 * 
 * Startup flow:
 * 1. Load environment variables (.env)
 * 2. Create Express app
 * 3. Add middleware (JSON parser, CORS, logging)
 * 4. Connect to MongoDB
 * 5. Mount routes (/api/v1/product, /api/v1/search)
 * 6. Add error handlers
 * 7. Start server
 * 
 * How to run:
 * npm start
 * 
 * Server will run at: http://localhost:3000
 * Database: MongoDB Atlas (cloud)
 */

require('dotenv').config(); // Load environment variables from .env

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connect } = require('./db/mongodb'); // MongoDB connection
const catalog = require('./catalog');
const productRoutes = require('./routes/product');
const searchRoutes = require('./routes/search');

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(process.cwd(), 'data', 'products-demo.json');

// ============================================================================
// CREATE EXPRESS APP
// ============================================================================

const app = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * 1. Security Headers (Helmet)
 * Adds security headers to prevent common attacks
 */
app.use(helmet({
  contentSecurityPolicy: false // Disable for CDN scripts in frontend
}));

/**
 * 2. JSON Body Parser (with size limit)
 * Prevents huge payloads from crashing server
 */
app.use(express.json({ limit: '1mb' }));

/**
 * 3. Rate Limiting
 * Prevent abuse: max 100 requests per 15 minutes per IP
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per window
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all API routes
app.use('/api/', limiter);

/**
 * 2. CORS Headers
 * Allow cross-origin requests (if frontend is on different port/domain)
 * 
 * Why needed?
 * - If you build a React frontend on port 3001, it needs CORS to call port 3000
 * - Production: Set specific allowed origins
 * - Development: Allow all (*)
 */
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

/**
 * 5. Request Logger
 * Log all incoming API requests for debugging
 */
app.use('/api', (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// MONGODB CONNECTION
// ============================================================================

/**
 * MongoDB replaces in-memory storage
 * 
 * Benefits:
 * - Data persists after server restart
 * - Can scale to millions of products
 * - Built-in text search
 * - Cloud backup
 * 
 * Performance:
 * - Queries: 10-50ms (still under 1000ms requirement!)
 * - With indexes: Even faster
 */

// ============================================================================
// MOUNT ROUTES
// ============================================================================

/**
 * Product management routes
 * - POST /api/v1/product
 * - PUT /api/v1/product/meta-data
 */
app.use('/api/v1', productRoutes);

/**
 * Search routes
 * - GET /api/v1/search/product
 * - GET /api/v1/search/suggestions
 */
app.use('/api/v1/search', searchRoutes);

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

/**
 * GET /health
 * 
 * Check if server is running and catalog is loaded
 * Useful for:
 * - Load balancers
 * - Monitoring systems
 * - Quick server test
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    catalogSize: catalog.getSize(),
    uptime: process.uptime()
  });
});

/**
 * GET / - Root endpoint
 * 
 * Show welcome message with API docs
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Jumbotail Search Engine API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      addProduct: 'POST /api/v1/product',
      updateMetadata: 'PUT /api/v1/product/meta-data',
      search: 'GET /api/v1/search/product?query=iPhone',
      suggestions: 'GET /api/v1/search/suggestions?q=iph'
    },
    docs: 'See README.md for detailed API documentation'
  });
});

// ============================================================================
// ERROR HANDLERS
// ============================================================================

/**
 * 404 Handler - Route not found
 * 
 * Catches all requests that don't match any route
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableEndpoints: [
      'GET /health',
      'GET /api/v1/search/product?query=...',
      'POST /api/v1/product',
      'PUT /api/v1/product/meta-data'
    ]
  });
});

/**
 * 500 Handler - Global error handler
 * 
 * Catches any unhandled errors from routes
 * Last line of defense before server crash
 */
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================================================
// START SERVER WITH MONGODB
// ============================================================================

/**
 * Async startup to connect to MongoDB first
 */
async function startServer() {
  try {
    console.log('');
    console.log('🚀 Starting Jumbotail Search Engine...');
    console.log('');
    
    // Step 1: Connect to MongoDB
    await connect();
    
    // Step 2: Check product count
    const productCount = await catalog.getSize();
    console.log(`📦 Products in database: ${productCount}`);
    
    if (productCount === 0) {
      console.log('');
      console.log('⚠️  Warning: No products in database!');
      console.log('   Run: node scripts/migrate-data.js');
      console.log('');
    }
    
    // Step 3: Start Express server
    app.listen(PORT, () => {
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎉 Server is running!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`📊 Database: MongoDB Atlas (jumbotail)`);
      console.log(`📦 Products: ${productCount}`);
      console.log('');
      console.log('📚 API Endpoints:');
      console.log(`   Health:      GET  http://localhost:${PORT}/api/v1/health`);
      console.log(`   Search:      GET  http://localhost:${PORT}/api/v1/search/product?query=iPhone`);
      console.log(`   Add Product: POST http://localhost:${PORT}/api/v1/product`);
      console.log(`   Update Meta: PUT  http://localhost:${PORT}/api/v1/product/meta-data`);
      console.log('');
      console.log('💡 Test search:');
      console.log(`   curl "http://localhost:${PORT}/api/v1/search/product?query=iPhone"`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Check .env file exists with MONGODB_URI');
    console.error('2. Verify MongoDB Atlas connection string is correct');
    console.error('3. Check network access whitelist in MongoDB Atlas');
    console.error('');
    process.exit(1);
  }
}

// Start the server
startServer();

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

/**
 * Handle SIGINT (Ctrl+C) and SIGTERM (Docker/PM2 stop)
 * 
 * Why?
 * - Close server gracefully (finish ongoing requests)
 * - Log shutdown (helps debugging if server crashes)
 * - Clean up resources (if we had DB connections, close them here)
 */
process.on('SIGINT', () => {
  console.log('\n\n⏸️  Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⏸️  Shutting down gracefully...');
  process.exit(0);
});
