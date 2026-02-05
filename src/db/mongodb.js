/**
 * MONGODB CONNECTION MODULE
 * 
 * Purpose:
 * - Connect to MongoDB Atlas (cloud database)
 * - Provide database instance to other modules
 * - Create indexes for fast searching
 * 
 * Why MongoDB?
 * - JSON-like data structure (perfect for products with metadata)
 * - Flexible schema (easy to add new fields)
 * - Cloud hosted (free tier on Atlas)
 * - Fast text search with indexes
 */

const { MongoClient } = require('mongodb');

// Get connection string from environment variable
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI not found in environment variables');
  console.error('Make sure .env file exists with MONGODB_URI');
  process.exit(1);
}

const client = new MongoClient(uri);

let db;

/**
 * Connect to MongoDB Atlas
 * 
 * @returns {Promise<Db>} MongoDB database instance
 * 
 * Flow:
 * 1. Connect to MongoDB cluster
 * 2. Select 'jumbotail' database
 * 3. Create text indexes for fast searching
 * 4. Return database instance
 */
async function connect() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    
    await client.connect();
    
    // Select database
    db = client.db('jumbotail');
    
    console.log('✅ Connected to MongoDB Atlas');
    console.log('📊 Database: jumbotail');
    
    // Create text index for search functionality
    // This makes title/description searches FAST
    await db.collection('products').createIndex({ 
      title: 'text', 
      description: 'text' 
    }, {
      weights: {
        title: 10,        // Title matches are more important
        description: 5    // Description matches are less important
      },
      name: 'product_text_search'
    });
    
    console.log('✅ Search indexes created');
    
    return db;
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Check MONGODB_URI in .env file');
    console.error('2. Verify username/password are correct');
    console.error('3. Check Network Access whitelist in MongoDB Atlas');
    console.error('4. Make sure cluster is running');
    process.exit(1);
  }
}

/**
 * Get database instance
 * 
 * @returns {Db} MongoDB database instance
 * @throws {Error} If database not connected
 */
function getDB() {
  if (!db) {
    throw new Error('❌ Database not connected. Call connect() first.');
  }
  return db;
}

/**
 * Close MongoDB connection
 * Used during graceful shutdown
 */
async function close() {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await close();
  process.exit(0);
});

module.exports = {
  connect,
  getDB,
  close
};
