/**
 * E-commerce search microservice
 * Main entry point - loads products and starts Express server
 */

const express = require('express');
const path = require('path');
const catalog = require('./catalog');
const productRoutes = require('./routes/product');
const searchRoutes = require('./routes/search');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// CORS for frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Serve static frontend
app.use(express.static('public'));

// Load demo products on startup
const dataPath = path.join(process.cwd(), 'data', 'products-demo.json');
const loaded = catalog.loadFromFile(dataPath);
console.log(`✅ Catalog loaded: ${loaded} products from data/products-demo.json`);

// API routes
app.use('/api/v1', productRoutes);
app.use('/api/v1/search', searchRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, catalogSize: catalog.size() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 Frontend UI: http://localhost:${PORT}`);
  console.log(`🔍 Search API: http://localhost:${PORT}/api/v1/search/product?query=iPhone`);
});
