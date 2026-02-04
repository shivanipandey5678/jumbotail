# Jumbotail Search – E-commerce Search Engine

Smart search engine for electronics (Tier-2/3 India) with intent-aware ranking and typeahead suggestions.

## Features

- ✅ **60 demo products** (phones, accessories, laptops, headphones) with all ranking fields
- ✅ **Smart search** with intent detection (price/quality/latest) and fuzzy matching for typos
- ✅ **Advanced ranking** - relevance + rating + sales + stock + trust + newness boost
- ✅ **Typeahead suggestions** - instant suggestions as you type
- ✅ **Fast** - &lt; 100ms search latency (well under 1000ms requirement)
- ✅ **Simple UI** - React + Tailwind frontend included
- ✅ **3 APIs** - POST product, PUT metadata, GET search

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Start the server

```bash
npm start
```

Server runs at **http://localhost:3000**

- **Frontend:** http://localhost:3000
- **Search API:** http://localhost:3000/api/v1/search/product?query=iPhone
- **Health:** http://localhost:3000/health

---

## APIs

### 1. Search Products

```http
GET /api/v1/search/product?query=Sasta%20iPhone
```

**Response:**
```json
{
  "data": [
    {
      "productId": 1,
      "title": "iPhone 13 64GB",
      "description": "...",
      "mrp": 62999,
      "Sellingprice": 35000,
      "Metadata": { "ram": "6GB", "storage": "64GB", ... },
      "stock": 10
    }
  ]
}
```

### 2. Get Suggestions (Typeahead)

```http
GET /api/v1/search/suggestions?q=iph
```

**Response:** `["iPhone 15 128GB Black", "iPhone 16", ...]`

### 3. Add Product

```http
POST /api/v1/product
Content-Type: application/json

{
  "title": "iPhone 17",
  "description": "New iPhone 17 with A19 chip",
  "rating": 4.5,
  "stock": 100,
  "price": 81999,
  "mrp": 89999,
  "currency": "Rupee"
}
```

**Response:** `{ "productId": 61 }`

### 4. Update Metadata

```http
PUT /api/v1/product/meta-data
Content-Type: application/json

{
  "productId": 61,
  "Metadata": {
    "ram": "8GB",
    "storage": "256GB",
    "color": "Black"
  }
}
```

**Response:** `{ "productId": 61, "Metadata": { ... } }`

---

## Sample Queries (Try These!)

Open http://localhost:3000 and try:

- **"Latest iphone"** → shows newer models (iPhone 16, 15)
- **"Sasta wala iPhone"** → shows cheaper iPhones with high ratings
- **"Ifone 16"** → fuzzy-matches to "iPhone 16" (typo handling)
- **"iPhone 16 red color"** → filters by color attribute
- **"iPhone 50k rupees"** → shows iPhones around ₹50k price
- **"Samsung phone"** → shows Samsung products
- **"iPhone cover strong"** → shows strong/durable covers

---

## How It Works

### Intent Detection (Manual + Fuzzy)

Detects user intent from query:
- **Price intent:** "sasta", "cheap", "budget", "50k rupees" → ranks cheaper products higher
- **Quality intent:** "best", "top", "badiya" → ranks higher-rated products
- **Latest intent:** "latest", "naya", "new" → ranks recent products
- **Attributes:** "red color", "more storage", "strong cover" → filters/boosts by attributes

Uses `string-similarity` library for typo handling (e.g. "Ifone" → "iPhone").

### Ranking Formula

Combines multiple signals (weighted):

1. **Text Relevance (30%)** - query vs title/description/metadata with fuzzy matching
2. **Intent Alignment (20%)** - matches user intent (price/quality/latest)
3. **Quality (18%)** - rating + review count (confidence)
4. **Trust (12%)** - verified reviews, photo reviews, low return rate
5. **Popularity (12%)** - units sold (social proof)
6. **Stock (8%)** - heavily penalizes out-of-stock products
7. **Newness Boost** - 15% boost for products launched in last 6 months with rating ≥ 4.0
8. **Attribute Boost** - 10-20% boost if query attributes (color, storage, strength) match

**Example:** "Sasta iPhone" → price intent → cheaper iPhones with good ratings and high sales rank at top.

---

## Project Structure

```
jumbotail/
├── data/
│   └── products-demo.json          # 60 products with all fields
├── public/
│   └── index.html                  # React + Tailwind UI
├── scripts/
│   └── generate-demo-data.js       # Generate 60/1000 products
├── src/
│   ├── index.js                    # Express server
│   ├── catalog.js                  # In-memory product store
│   ├── routes/
│   │   ├── product.js              # POST, PUT APIs
│   │   └── search.js               # GET search, suggestions
│   └── services/
│       ├── intent.js               # Intent detection
│       ├── ranking.js              # Ranking formula
│       └── search.js               # Search pipeline
├── package.json
├── README.md
├── EXPLANATION.md                  # Detailed explanation (for beginners)
└── TESTING.md                      # Test cases
```

---

## Generate 1000 Products (Scale Up)

1. Edit `scripts/generate-demo-data.js`:
   - Change `i <= 60` to `i <= 1000`

2. Run generator:
   ```bash
   npm run generate-demo
   ```

3. Restart server:
   ```bash
   npm start
   ```

Now you have 1000 products!

---

## Future Enhancements (Not Implemented)

### LLM Integration (Optional "Good to Have")

**Why we skipped:** Assignment requires &lt; 1000ms latency; LLM adds 1-3s. Our manual approach handles 80-90% of queries.

**How to add later:**
- Use LLM only for complex queries (e.g. "mujhe ek achha sa phone chahiye jo zyada mehenga na ho")
- Call LLM to normalize/rewrite → "cheap good phone" → run normal search
- Or use LLM to enrich product descriptions with more metadata

### Persistence

Currently in-memory (fast for 60-1000 products). For production:
- Use SQLite / MongoDB / PostgreSQL
- Add indexes on title, brand, category for fast retrieval
- Use full-text search (PostgreSQL, Elasticsearch)

### Personalization

- Track user history (past searches, purchases)
- Add "repeat customer" boost
- Recommend products based on user preferences

---

## Tech Stack

- **Backend:** Node.js + Express
- **Storage:** In-memory (Map)
- **Fuzzy Matching:** `string-similarity` (Dice coefficient)
- **Frontend:** React (CDN) + Tailwind CSS

---

## Assignment Deliverables ✅

- [x] In-memory catalog with 60+ products (all ranking fields)
- [x] POST /api/v1/product
- [x] PUT /api/v1/product/meta-data
- [x] GET /api/v1/search/product with ranking
- [x] Intent detection (manual + fuzzy)
- [x] Ranking algorithm (creative, multi-factor)
- [x] Error handling (400, 404, 500)
- [x] Clean, modular, documented code
- [x] &lt; 1000ms latency (search is ~50-100ms)
- [x] README with run instructions
- [x] Extra: GET /api/v1/search/suggestions (typeahead)
- [x] Extra: Frontend UI for demo

---

## Testing

See [TESTING.md](TESTING.md) for curl commands and test cases.

---

## License

MIT
