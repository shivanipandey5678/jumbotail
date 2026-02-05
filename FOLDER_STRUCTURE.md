# 📁 Project Folder Structure

```
jumbotail/
│
├── 📦 package.json                 # Dependencies & scripts
├── 📄 README.md                    # Setup & API documentation
├── 📄 CONVERSATION.md              # LLM conversation log (assignment requirement)
├── 📄 FOLDER_STRUCTURE.md          # This file
│
├── 📂 data/
│   ├── products-demo.json          # Your 100 products (will scale to 1000+)
│   └── question.txt                # Assignment requirements
│
├── 📂 src/
│   ├── 🟢 index.js                 # Main server entry point
│   ├── 🟢 catalog.js               # In-memory product storage
│   │
│   ├── 📂 services/
│   │   ├── intent.js               # Detect user intent (price/quality/latest)
│   │   ├── ranking.js              # Score & rank products
│   │   └── search.js               # Search pipeline orchestrator
│   │
│   └── 📂 routes/
│       ├── product.js              # POST /product, PUT /product/meta-data
│       └── search.js               # GET /search/product
│
└── 📂 tests/ (optional)
    └── api.test.js                 # Test cases
```

---

## 🔄 Execution Flow

### 1️⃣ **Server Startup**
```
npm start 
  ↓
src/index.js
  ↓
Loads catalog.js
  ↓
catalog.js reads data/products-demo.json
  ↓
100 products loaded into memory (Map)
  ↓
Express server starts on port 3000
```

### 2️⃣ **Search Request Flow**
```
User: GET /api/v1/search/product?query=Sasta iPhone
  ↓
src/index.js → routes/search.js (GET handler)
  ↓
services/search.js (search function)
  ↓
Step 1: catalog.getAllProducts() → Get all 100 products
  ↓
Step 2: services/intent.js → Detect "Sasta" = price intent
  ↓
Step 3: services/ranking.js → Score each product
        - Text match score (does title contain "iPhone"?)
        - Price score (cheaper = higher for "Sasta")
        - Rating score
        - Stock score, etc.
  ↓
Step 4: Sort by score (highest first)
  ↓
Step 5: Return top 50 results
  ↓
Response to user
```

### 3️⃣ **Add Product Flow**
```
User: POST /api/v1/product
  ↓
routes/product.js (POST handler)
  ↓
catalog.addProduct(body)
  ↓
New product stored in memory
  ↓
Response: { productId: 101 }
```

---

## 📚 File Purposes

| File | Purpose | When It Runs |
|------|---------|--------------|
| **index.js** | Express server, routes mounting, startup | Once at `npm start` |
| **catalog.js** | Product storage (Map), CRUD operations | Loads on startup, accessed by APIs |
| **intent.js** | Parse query, detect intent (price/quality/latest) | Every search request |
| **ranking.js** | Calculate score for each product | Every search request (for each product) |
| **search.js** | Orchestrate: get products → detect intent → rank → return | Every search request |
| **routes/product.js** | Handle POST/PUT product APIs | When user adds/updates product |
| **routes/search.js** | Handle GET search API | When user searches |

---

## 🎯 Key Design Decisions

### 1. **In-Memory Storage (Map)**
- **Why:** Fast O(1) lookup, perfect for 1000 products
- **Trade-off:** Data lost on restart (but we reload from JSON)
- **Alternative:** Database (slower, overkill for 1000 products)

### 2. **Modular Services**
- **Why:** Separation of concerns (intent ≠ ranking ≠ search)
- **Trade-off:** More files, but easier to test & maintain
- **Alternative:** One big file (messy, hard to debug)

### 3. **Synchronous Ranking**
- **Why:** Fast enough for 1000 products (~50-100ms)
- **Trade-off:** Won't scale to millions (would need 2-stage: retrieve → rank)
- **Alternative:** Async/parallel ranking (overkill for now)

### 4. **Weighted Scoring Formula**
- **Why:** Assignment requires combining multiple signals
- **Trade-off:** Weights are manual (not ML-based)
- **Alternative:** Machine learning (complex, not required)

---

## ⚡ Performance Targets

| Operation | Target | Expected |
|-----------|--------|----------|
| Load 100 products | < 100ms | ~10ms |
| Search 100 products | < 1000ms | ~50-100ms |
| Add product | < 50ms | ~5ms |
| Update metadata | < 50ms | ~5ms |

---

Now let me start building the files one by one with detailed explanations!
