# 🛒 Jumbotail Search Engine

E-commerce search & ranking microservice for electronics targeting Tier-2 and Tier-3 cities in India.



## 📋 Features

- ✅ **MongoDB Atlas (Cloud Database)** - 255 products, persistent storage
- ✅ **Intent-aware search** - Understands "Sasta iPhone", "Latest Samsung", etc.
- ✅ **Typo tolerance** - Fuzzy matching handles "Ifone" → "iPhone"
- ✅ **Multi-factor ranking** - Combines text relevance, rating, sales, price, stock
- ✅ **Hinglish support** - Keywords: sasta, achha, naya, etc.
- ✅ **< 1000ms latency** - Typically 50-150ms for 255 products
- ✅ **RESTful APIs** - POST product, PUT metadata, GET search
- ✅ **Production-ready** - Security, validation, rate limiting

---

## 🎨 UI Screenshots


---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm
- MongoDB Atlas account (free tier)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/shivanipandey5678/jumbotail.git
cd jumbotail

# 2. Install dependencies
npm install

# 3. Setup environment variables
# Create .env file with:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jumbotail
# PORT=3000

# 4. Migrate data to MongoDB
node scripts/migrate-data.js

# 5. Start server
npm start
```

Server will start at: **http://localhost:3000**  
Frontend available at: **http://localhost:3001** (if running separately)

---

## 📡 API Documentation

### 1. Search Products

**Endpoint:** `GET /api/v1/search/product`

**Query Parameters:**
- `query` (required) - Search query
- `limit` (optional) - Max results (default: 50, max: 100)
- `offset` (optional) - Pagination offset (default: 0)

**Example Request:**
```bash
curl "http://localhost:3000/api/v1/search/product?query=Sasta%20iPhone"
```

**Example Response:**
```json
{
  "data": [
    {
      "productId": 13,
      "title": "iPhone 13 64GB",
      "description": "High quality mobile: iPhone 13 64GB",
      "sellingPrice": 35000,
      "mrp": 40000,
      "stock": 10,
      "rating": 4.2,
      "metadata": {
        "ram": "6GB",
        "storage": "64GB",
        "color": "Black"
      },
      "_score": "0.8234"
    }
  ],
  "total": 15,
  "query": "Sasta iPhone",
  "intent": {
    "type": "price",
    "priceRange": null,
    "attributes": {}
  },
  "showing": 15,
  "_performance": {
    "duration_ms": 87,
    "target_ms": 1000
  }
}
```

---

### 2. Add Product

**Endpoint:** `POST /api/v1/product`

**Request Body:**
```json
{
  "title": "iPhone 17",
  "description": "6.3-inch OLED, A19 chip, 48MP camera",
  "rating": 4.2,
  "stock": 1000,
  "price": 81999,
  "mrp": 82999,
  "currency": "Rupee"
}
```

**Response:**
```json
{
  "productId": 101
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d '{
    "title": "iPhone 17",
    "description": "Latest iPhone model",
    "rating": 4.5,
    "stock": 500,
    "price": 81999,
    "mrp": 89999,
    "currency": "Rupee"
  }'
```

---

### 3. Update Product Metadata

**Endpoint:** `PUT /api/v1/product/meta-data`

**Request Body:**
```json
{
  "productId": 101,
  "metadata": {
    "ram": "8GB",
    "storage": "128GB",
    "screensize": "6.3 inches",
    "model": "iPhone 17",
    "brightness": "300 nits"
  }
}
```

**Response:**
```json
{
  "productId": 101,
  "Metadata": {
    "ram": "8GB",
    "storage": "128GB",
    "screensize": "6.3 inches",
    "model": "iPhone 17",
    "brightness": "300 nits"
  }
}
```

**Example:**
```bash
curl -X PUT http://localhost:3000/api/v1/product/meta-data \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 101,
    "metadata": {
      "ram": "8GB",
      "storage": "256GB",
      "color": "Space Black"
    }
  }'
```

---

### 4. Health Check (Bonus)

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "catalogSize": 100,
  "uptime": 3600
}
```

---

### 5. Search Suggestions (Bonus)

**Endpoint:** `GET /api/v1/search/suggestions`

**Query Parameters:**
- `q` (required) - Partial query (min 2 characters)
- `limit` (optional) - Max suggestions (default: 10)

**Example:**
```bash
curl "http://localhost:3000/api/v1/search/suggestions?q=iph"
```

**Response:**
```json
{
  "suggestions": [
    "iPhone 16",
    "iPhone 15",
    "iPhone 13"
  ]
}
```

---

## 🔍 Search Examples

### Query: "Sasta iPhone"
**Intent:** Price (cheap)  
**Result:** Cheaper iPhones rank higher (iPhone 13 before iPhone 16)

### Query: "Latest iPhone"
**Intent:** Latest (new)  
**Result:** Newer models rank higher (iPhone 16 before iPhone 13)

### Query: "Ifone 16"
**Intent:** General (with typo)  
**Result:** Fuzzy matches to "iPhone 16"

### Query: "iPhone 16 red color"
**Intent:** General + color attribute  
**Result:** Red iPhone 16 ranks higher due to color match

### Query: "iPhone 50k rupees"
**Intent:** Price + price range  
**Result:** iPhones around ₹50,000 rank higher

---

## 🧮 Ranking Formula

Based on assignment requirements + enhancements:

```
FinalScore = (TextMatch × 0.35) +
             (Rating × 0.20) +
             (Sales × 0.15) +
             (Price × 0.15) +
             (Stock × 0.10) +
             (ReturnPenalty × 0.05) +
             (TrustBonus × 0.10)

FinalScore × IntentBoost × AttributeBoost
```

### Ranking Signals

| Signal | Weight | Description |
|--------|--------|-------------|
| **Text Relevance** | 35% | Query matches title/description/metadata (fuzzy) |
| **Rating** | 20% | Product rating (0-5 stars) + review count confidence |
| **Sales** | 15% | Units sold (social proof) |
| **Price** | 15% | Intent-aware: cheap for "sasta", neutral otherwise |
| **Stock** | 10% | In stock = 1.0, out of stock = 0.2 (penalty) |
| **Return Rate** | 5% | Low return rate = quality |
| **Trust** | 10% | Verified reviews + photo reviews |
| **Intent Boost** | Multiplier | 1.2x for matching "latest" intent |
| **Attribute Boost** | Multiplier | 1.15x for matching color/storage |

---

## 📁 Project Structure

```
jumbotail/
├── package.json              # Dependencies & scripts
├── README.md                 # This file
├── FOLDER_STRUCTURE.md       # Detailed structure explanation
├── data/
│   ├── products-demo.json    # 100 products (your data)
│   └── question.txt          # Assignment requirements
└── src/
    ├── index.js              # Main server (Express)
    ├── catalog.js            # In-memory product storage
    ├── services/
    │   ├── intent.js         # Intent detection (price/quality/latest)
    │   ├── ranking.js        # Scoring & ranking algorithm
    │   └── search.js         # Search pipeline orchestrator
    └── routes/
        ├── product.js        # POST, PUT product APIs
        └── search.js         # GET search API
```

---

## 🧪 Testing

### Test Health Check
```bash
curl http://localhost:3000/health
```

### Test Search (Various Queries)
```bash
# General search
curl "http://localhost:3000/api/v1/search/product?query=iPhone"

# Price intent
curl "http://localhost:3000/api/v1/search/product?query=Sasta%20iPhone"

# Latest intent
curl "http://localhost:3000/api/v1/search/product?query=Latest%20iPhone"

# Typo handling
curl "http://localhost:3000/api/v1/search/product?query=Ifone%2016"

# Color attribute
curl "http://localhost:3000/api/v1/search/product?query=iPhone%2016%20red"

# Price range
curl "http://localhost:3000/api/v1/search/product?query=iPhone%2050k%20rupees"
```

### Test Add Product
```bash
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Product",
    "description": "Test description",
    "rating": 4.0,
    "stock": 100,
    "price": 10000,
    "mrp": 12000,
    "currency": "Rupee"
  }'
```

### Test Update Metadata
```bash
# Use productId from add product response
curl -X PUT http://localhost:3000/api/v1/product/meta-data \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 101,
    "metadata": {
      "ram": "8GB",
      "storage": "128GB"
    }
  }'
```

---

## ⚡ Performance

| Operation | Target | Typical |
|-----------|--------|---------|
| Load 100 products | < 100ms | ~10ms |
| Search (100 products) | < 1000ms | 50-100ms |
| Add product | < 50ms | ~5ms |
| Update metadata | < 50ms | ~5ms |

**For 1000 products:** Search typically takes 100-200ms (still well under 1000ms requirement)

---

## 🐛 Troubleshooting

### Server won't start
- Check Node version: `node --version` (need >= 18)
- Check port 3000: Another process might be using it

### No products loaded
- Check `data/products-demo.json` exists
- Check JSON is valid (use JSON validator)
- Check console logs for error messages

### Search returns empty results
- Check if products are loaded: `GET /health` (check catalogSize)
- Check query is not empty
- Check products actually match the query

### Latency > 1000ms
- Check catalog size (should be < 10,000 for in-memory)
- Check server resources (CPU, RAM)
- Consider database for larger catalogs

---

## 🎯 Next Steps (Future Enhancements)

### Short Term
- [ ] Add unit tests (Jest)
- [ ] Add more ranking signals (recency, newness boost)
- [ ] Add filters (category, brand, price range)
- [ ] Add pagination metadata (hasMore, nextOffset)

### Long Term
- [x] Database persistence (MongoDB Atlas - DONE!)
- [ ] LLM integration for complex queries
- [ ] Personalized ranking (user history)
- [ ] A/B testing framework for ranking weights
- [ ] Analytics (search logs, click-through rate)

---

## 📊 Current Status

**Database:** MongoDB Atlas (Cloud) ✅  
**Products:** 255 ✅  
**APIs:** All Working ✅  
**Performance:** < 200ms average ✅  
**Security:** Implemented ✅  
**Frontend:** Functional ✅  
**Documentation:** Complete ✅

---

## 📝 Assignment Checklist

### **Must Have:**
- [x] Store products in datastore (MongoDB Atlas)
- [x] Add relevant metadata (10+ fields per product)
- [x] Search API with ranking
- [x] Handle exceptions gracefully
- [x] Clean, modular code
- [x] Well-documented (7+ documentation files)
- [x] < 1000ms latency (50-150ms achieved)
- [x] README with setup steps
- [x] LLM conversation log (CONVERSATION.md)
- [x] GitHub repo with commits

### **APIs Implemented:**
- [x] POST /api/v1/product (Add Product)
- [x] PUT /api/v1/product/meta-data (Update Metadata)
- [x] GET /api/v1/search/product (Search & Rank)
- [x] GET /api/v1/search/suggestions (Bonus: Typeahead)
- [x] GET /health (Health Check)

### **Features:**
- [x] 255 products loaded (exceeded 100+ requirement)
- [x] Multi-factor ranking (6 signals + bonuses)
- [x] Intent detection (price, quality, latest)
- [x] Typo tolerance (fuzzy matching)
- [x] Hinglish support (sasta, achha, naya)
- [x] Attribute matching (color, storage, RAM)
- [x] Security (validation, XSS prevention, rate limiting)

### **Good to Have:**
- [x] Database persistence (MongoDB)
- [x] Fuzzy search/typo tolerance
- [x] Synonym matching (via fuzzy)
- [ ] LLM enrichment (not critical path)

---

## 🧪 Testing

**30+ test cases documented in `API_TESTING_RESULTS.md`**

Quick tests:
```bash
# Search
curl "http://localhost:3000/api/v1/search/product?query=iPhone"

# Hinglish
curl "http://localhost:3000/api/v1/search/product?query=sasta+phone"

# Typo tolerance
curl "http://localhost:3000/api/v1/search/product?query=Samsang"

# Latest intent
curl "http://localhost:3000/api/v1/search/product?query=latest+laptop"
```

All tests passing ✅

---

## 📞 Support

For questions or issues:
1. Check `FOLDER_STRUCTURE.md` for detailed explanations
2. Check code comments (heavily documented)
3. Check assignment `data/question.txt`

---

## 📄 License

MIT

---

**Built for Jumbotail Assignment** 🚀
