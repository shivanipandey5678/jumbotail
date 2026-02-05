/**
 * MIGRATE REMAINING PRODUCTS
 * 
 * Purpose:
 * - Upload remaining products (109+) from JSON to MongoDB
 * - Skip already uploaded products
 * 
 * How to run:
 * node scripts/migrate-remaining.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { connect, getDB, close } = require('../src/db/mongodb');

async function migrateRemaining() {
  try {
    console.log('');
    console.log('========================================');
    console.log('📦 MIGRATING REMAINING PRODUCTS');
    console.log('========================================');
    console.log('');
    
    // Connect to MongoDB
    console.log('Step 1: Connecting to MongoDB...');
    await connect();
    const db = getDB();
    
    // Read JSON file
    console.log('Step 2: Reading JSON file...');
    const jsonPath = path.join(__dirname, '../data/products-demo.json');
    const allProducts = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`   ✅ Found ${allProducts.length} products in JSON`);
    
    // Check existing count
    const existingCount = await db.collection('products').countDocuments();
    console.log(`   📊 Currently ${existingCount} products in MongoDB`);
    
    if (existingCount >= allProducts.length) {
      console.log('');
      console.log('✅ All products already uploaded!');
      console.log('');
      await close();
      process.exit(0);
    }
    
    // Find remaining products to upload
    console.log('Step 3: Finding products to upload...');
    const remainingProducts = allProducts.slice(existingCount);
    console.log(`   📦 Need to upload ${remainingProducts.length} more products`);
    
    // Insert remaining products
    console.log('Step 4: Uploading products...');
    const productsWithTimestamps = remainingProducts.map(product => ({
      ...product,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    const result = await db.collection('products').insertMany(productsWithTimestamps);
    console.log(`   ✅ Inserted ${result.insertedCount} products`);
    
    // Verify final count
    console.log('Step 5: Verifying...');
    const finalCount = await db.collection('products').countDocuments();
    console.log(`   ✅ Total products in database: ${finalCount}`);
    
    // Success!
    console.log('');
    console.log('========================================');
    console.log('🎉 MIGRATION COMPLETE!');
    console.log('========================================');
    console.log('');
    console.log(`Total products: ${finalCount}/${allProducts.length}`);
    console.log('');
    console.log('Next: Test search with more products!');
    console.log('curl "http://localhost:3000/api/v1/search/product?query=laptop"');
    console.log('');
    
    await close();
    process.exit(0);
    
  } catch (error) {
    console.error('');
    console.error('❌ Migration failed:', error.message);
    console.error('');
    process.exit(1);
  }
}

migrateRemaining();
