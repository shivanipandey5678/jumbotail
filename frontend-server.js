/**
 * FRONTEND SERVER - Separate from Backend
 * 
 * Purpose:
 * - Serve the frontend UI on a different port (3001)
 * - Keep frontend and backend separated
 * 
 * How to run:
 * node frontend-server.js
 * 
 * Frontend will run at: http://localhost:3001
 * Backend API runs at: http://localhost:3000
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for all routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log('');
  console.log('========================================');
  console.log('🎨 FRONTEND SERVER STARTED');
  console.log('========================================');
  console.log(`✅ Frontend URL: http://localhost:${PORT}`);
  console.log(`✅ Backend API:  http://localhost:3000`);
  console.log('========================================');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('1. Open http://localhost:3001 in your browser');
  console.log('2. Make sure backend is running on port 3000');
  console.log('3. Start searching for products!');
  console.log('');
});
