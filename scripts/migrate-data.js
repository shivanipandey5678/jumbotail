/**
 * DATA MIGRATION SCRIPT
 * 
 * Purpose:
 * - Upload products from JSON file to MongoDB
 * - One-time operation to move from in-memory to database
 * 
 * How to run:
 * node scripts/migrate-data.js
 * 
 * What it does:
 * 1. Reads data/products-demo.json
 * 2. Connects to MongoDB
 * 3. Clears existing products (if any)
 * 4. Inserts all products
 * 5. Shows success message
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { connect, getDB, close } = require('../src/db/mongodb');

/**
 * Main migration function
 */
async function migrate() {
  try {
    console.log('');
    console.log('========================================');
    console.log('📦 STARTING DATA MIGRATION');
    console.log('========================================');
    console.log('');
    
    // Step 1: Connect to MongoDB
    console.log('Step 1: Connecting to MongoDB...');
    await connect();
    const db = getDB();
    
    // Step 2: Read JSON file
    console.log('Step 2: Reading JSON file...');
    const jsonPath = path.join(__dirname, '../data/products-demo.json');
    
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`JSON file not found: ${jsonPath}`);
    }
    
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`   ✅ Found ${jsonData.length} products in JSON`);
    
    // Step 3: Clear existing data (optional - for clean migration)
    console.log('Step 3: Clearing existing products...');
    const deleteResult = await db.collection('products').deleteMany({});
    console.log(`   🗑️  Deleted ${deleteResult.deletedCount} existing products`);
    
    // Step 4: Insert all products
    console.log('Step 4: Inserting products into MongoDB...');
    
    // Add timestamps to each product
    const productsWithTimestamps = jsonData.map(product => ({
      ...product,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    const result = await db.collection('products').insertMany(productsWithTimestamps);
    console.log(`   ✅ Inserted ${result.insertedCount} products`);
    
    // Step 5: Verify count
    console.log('Step 5: Verifying...');
    const count = await db.collection('products').countDocuments();
    console.log(`   ✅ Total products in database: ${count}`);
    
    // Success!
    console.log('');
    console.log('========================================');
    console.log('🎉 MIGRATION COMPLETE!');
    console.log('========================================');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start server: npm start');
    console.log('2. Test search: curl "http://localhost:3000/api/v1/search/product?query=iPhone"');
    console.log('3. Check MongoDB Atlas dashboard to see your data');
    console.log('');
    
    // Close connection
    await close();
    process.exit(0);
    
  } catch (error) {
    console.error('');
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Make sure MongoDB is connected (check .env)');
    console.error('2. Verify JSON file exists: data/products-demo.json');
    console.error('3. Check MongoDB Atlas dashboard for errors');
    console.error('');
    process.exit(1);
  }
}

// Run migration
migrate();
