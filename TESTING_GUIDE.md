# 🧪 Complete Testing Guide

This guide shows you exactly how to test every part of the system.

---

## 📋 Prerequisites

1. **Server must be running:**
   ```bash
   npm start
   ```
   
2. **Tools needed:**
   - `curl` (terminal) OR
   - Postman (GUI) OR
   - Browser (for GET requests)

---

## 🚦 Test 1: Health Check

**Purpose:** Verify server is running and catalog is loaded

### Using curl:
```bash
curl http://localhost:3000/health
```

### Expected Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "catalogSize": 100,
  "uptime": 45.2
}
```

### ✅ Success Criteria:
- `status` is "healthy"
- `catalogSize` matches your product count (should be 100+)

### ❌ If It Fails:
- Server not running → Run `npm start`
- catalogSize is 0 → Check `data/products-demo.json` exists

---

## 🔍 Test 2: Basic Search

**Purpose:** Verify search works with simple query

### Using curl:
```bash
curl "http://localhost:3000/api/v1/search/product?query=iPhone"
```

### Expected Response:
```json
{
  "data": [
    {
      "productId": 1,
      "title": "iPhone 15 128GB Black",
      "description": "...",
      "sellingPrice": 23148,
      "mrp": 25059,
      "stock": 740,
      "rating": 1.1,
      "metadata": { ... },
      "_score": "0.7234"
    }
  ],
  "total": 12,
  "query": "iPhone",
  "intent": {
    "type": "general",
    "priceRange": null,
    "attributes": {}
  },
  "showing": 12,
  "_performance": {
    "duration_ms": 87,
    "target_ms": 1000
  }
}
```

### ✅ Success Criteria:
- `data` array has products
- Products with "iPhone" in title rank higher
- `duration_ms` < 1000ms
- `_score` is present (higher score = better match)

### ❌ If It Fails:
- Empty `data` → No products match "iPhone" in your catalog
- No `_score` field → Check ranking.js is working

---

## 💰 Test 3: Price Intent Search

**Purpose:** Verify "cheap" intent detection and ranking

### Using curl:
```bash
curl "http://localhost:3000/api/v1/search/product?query=Sasta%20iPhone"
```

### Expected Response:
```json
{
  "data": [
    {
      "productId": 13,
      "title": "iPhone 13 64GB",
      "sellingPrice": 35000,
      ...
    },
    {
      "productId": 16,
      "title": "iPhone 16 256GB",
      "sellingPrice": 59000,
      ...
    }
  ],
  "intent": {
    "type": "price",
    "priceRange": null,
    "attributes": {}
  }
}
```

### ✅ Success Criteria:
- `intent.type` is "price"
- Cheaper products rank higher (iPhone 13 before iPhone 16)
- Products with better price/quality ratio rank at top

### 📊 How to Verify Ranking:
1. Note the `sellingPrice` of top 3 results
2. Cheaper + good rating should rank higher
3. Out-of-stock expensive products should rank lower

---

## 🆕 Test 4: Latest Intent Search

**Purpose:** Verify "new/latest" intent detection

### Using curl:
```bash
curl "http://localhost:3000/api/v1/search/product?query=Latest%20iPhone"
```

### Expected Response:
```json
{
  "intent": {
    "type": "latest",
    "priceRange": null,
    "attributes": {}
  },
  "data": [
    {
      "title": "iPhone 16 Pro",
      ...
    },
    {
      "title": "iPhone 15 Pro",
      ...
    }
  ]
}
```

### ✅ Success Criteria:
- `intent.type` is "latest"
- Newer models rank higher (check launch_date in your data)
- Newest + high rating products at top

---

## 🎨 Test 5: Attribute Search (Color)

**Purpose:** Verify attribute extraction and matching

### Using curl:
```bash
curl "http://localhost:3000/api/v1/search/product?query=iPhone%2016%20red%20color"
```

### Expected Response:
```json
{
  "intent": {
    "type": "general",
    "priceRange": null,
    "attributes": {
      "color": "red"
    }
  },
  "data": [
    {
      "title": "iPhone 16 ...",
      "metadata": {
        "color": "Red"
      },
      "_score": "0.9234" // Higher score due to color match
    }
  ]
}
```

### ✅ Success Criteria:
- `intent.attributes.color` is "red"
- Products with red color in metadata rank higher
- Color match boosts score by ~15%

---

## 🔤 Test 6: Typo Handling

**Purpose:** Verify fuzzy matching handles spelling mistakes

### Using curl:
```bash
curl "http://localhost:3000/api/v1/search/product?query=Ifone%2016"
```

### Expected Response:
```json
{
  "query": "Ifone 16",
  "data": [
    {
      "title": "iPhone 16 ...",
      "_score": "0.8123" // High score despite typo
    }
  ]
}
```

### ✅ Success Criteria:
- Returns iPhone products (not "Ifone")
- Scores are still high (> 0.7)
- Fuzzy matching worked ("Ifone" matched "iPhone")

### More Typos to Test:
```bash
# "sastha" → "sasta"
curl "http://localhost:3000/api/v1/search/product?query=sastha%20wala%20phone"

# "Sumsung" → "Samsung"
curl "http://localhost:3000/api/v1/search/product?query=Sumsung%20Galaxy"
```

---

## 💵 Test 7: Price Range Extraction

**Purpose:** Verify price range extraction from query

### Using curl:
```bash
curl "http://localhost:3000/api/v1/search/product?query=iPhone%2050k%20rupees"
```

### Expected Response:
```json
{
  "intent": {
    "type": "price",
    "priceRange": 50000,
    "attributes": {}
  },
  "data": [
    {
      "title": "iPhone 15 ...",
      "sellingPrice": 48000, // Close to 50k
      ...
    }
  ]
}
```

### ✅ Success Criteria:
- `intent.priceRange` is 50000
- Products around ₹50k rank higher
- Products far from 50k (₹20k or ₹80k) rank lower

### More Price Tests:
```bash
# "30k"
curl "http://localhost:3000/api/v1/search/product?query=phone%2030k"

# "under 40k"
curl "http://localhost:3000/api/v1/search/product?query=phone%20under%2040k"
```

---

## ➕ Test 8: Add Product (POST)

**Purpose:** Verify product can be added to catalog

### Using curl:
```bash
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test iPhone 99",
    "description": "Test product for API testing",
    "rating": 4.5,
    "stock": 100,
    "price": 99999,
    "mrp": 109999,
    "currency": "Rupee"
  }'
```

### Expected Response:
```json
{
  "productId": 101
}
```

### ✅ Success Criteria:
- Returns `productId` (should be > 100 if you have 100 products)
- Next search for "Test iPhone 99" should find it

### Verify Product Was Added:
```bash
curl "http://localhost:3000/api/v1/search/product?query=Test%20iPhone%2099"
```

Should return the product you just added.

---

## 🔧 Test 9: Update Metadata (PUT)

**Purpose:** Verify metadata can be updated

### Step 1: Add a product (if not done)
```bash
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d '{"title":"Meta Test","description":"test","rating":4,"stock":10,"price":1000,"mrp":1200,"currency":"Rupee"}'
```

**Note the productId** (e.g., 102)

### Step 2: Update metadata
```bash
curl -X PUT http://localhost:3000/api/v1/product/meta-data \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 102,
    "metadata": {
      "ram": "16GB",
      "storage": "512GB",
      "color": "Midnight Blue"
    }
  }'
```

### Expected Response:
```json
{
  "productId": 102,
  "Metadata": {
    "ram": "16GB",
    "storage": "512GB",
    "color": "Midnight Blue"
  }
}
```

### ✅ Success Criteria:
- Returns updated metadata
- Search for product now includes metadata

### Verify Metadata Was Updated:
```bash
curl "http://localhost:3000/api/v1/search/product?query=Meta%20Test"
```

Check that `metadata` field has the values you set.

---

## 🔢 Test 10: Pagination

**Purpose:** Verify limit and offset work

### Test with limit:
```bash
curl "http://localhost:3000/api/v1/search/product?query=phone&limit=5"
```

Should return exactly 5 products.

### Test with offset:
```bash
# Get first 5
curl "http://localhost:3000/api/v1/search/product?query=phone&limit=5&offset=0"

# Get next 5
curl "http://localhost:3000/api/v1/search/product?query=phone&limit=5&offset=5"
```

### ✅ Success Criteria:
- `showing` field matches `limit`
- Second request returns different products
- `total` is same in both requests

---

## 💡 Test 11: Suggestions (Typeahead)

**Purpose:** Verify autocomplete suggestions work

### Using curl:
```bash
curl "http://localhost:3000/api/v1/search/suggestions?q=iph"
```

### Expected Response:
```json
{
  "suggestions": [
    "iPhone 16",
    "iPhone 15",
    "iPhone 13"
  ]
}
```

### ✅ Success Criteria:
- Returns product titles/brands starting with "iph"
- Max 10 suggestions (or whatever limit you set)

### More Tests:
```bash
# "sam" → Samsung products
curl "http://localhost:3000/api/v1/search/suggestions?q=sam"

# "lap" → Laptop products
curl "http://localhost:3000/api/v1/search/suggestions?q=lap"
```

---

## 📊 Test 12: Performance Check

**Purpose:** Verify latency requirement (< 1000ms)

### Method 1: Check response `_performance` field
```bash
curl "http://localhost:3000/api/v1/search/product?query=iPhone" | grep duration_ms
```

Should show something like:
```
"duration_ms": 87
```

### Method 2: Measure with `time` command
```bash
time curl "http://localhost:3000/api/v1/search/product?query=iPhone" > /dev/null
```

Should complete in < 1 second.

### ✅ Success Criteria:
- Search: < 1000ms (typically 50-200ms)
- Add product: < 50ms
- Update metadata: < 50ms

---

## ❌ Error Handling Tests

### Test 13: Missing Required Field (400)
```bash
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d '{"title":"Test"}'
```

**Expected:** 400 error with message about missing fields

### Test 14: Invalid Product ID (404)
```bash
curl -X PUT http://localhost:3000/api/v1/product/meta-data \
  -H "Content-Type: application/json" \
  -d '{"productId":99999,"metadata":{}}'
```

**Expected:** 404 error "Product not found"

### Test 15: Invalid Route (404)
```bash
curl http://localhost:3000/api/v1/invalid-route
```

**Expected:** 404 error with list of available endpoints

---

## 🎯 Full Test Suite (Run All)

Copy-paste this to run all tests:

```bash
#!/bin/bash
echo "🧪 Running Full Test Suite..."

echo "\n1️⃣ Health Check"
curl -s http://localhost:3000/health | head -n 5

echo "\n2️⃣ Basic Search"
curl -s "http://localhost:3000/api/v1/search/product?query=iPhone" | head -n 10

echo "\n3️⃣ Price Intent"
curl -s "http://localhost:3000/api/v1/search/product?query=Sasta%20iPhone" | grep -A 5 '"intent"'

echo "\n4️⃣ Typo Handling"
curl -s "http://localhost:3000/api/v1/search/product?query=Ifone" | head -n 10

echo "\n5️⃣ Add Product"
curl -s -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"test","rating":4,"stock":10,"price":1000,"mrp":1200,"currency":"Rupee"}'

echo "\n6️⃣ Suggestions"
curl -s "http://localhost:3000/api/v1/search/suggestions?q=iph"

echo "\n\n✅ All tests complete!"
```

Save as `test.sh`, run with: `bash test.sh`

---

## 📝 Testing Checklist

Copy this to track your testing:

```
[ ] Health check returns 200
[ ] Catalog size > 0
[ ] Basic search returns results
[ ] Search latency < 1000ms
[ ] Price intent detection works ("Sasta")
[ ] Latest intent detection works ("Latest")
[ ] Color attribute extraction works
[ ] Typo handling works ("Ifone" → "iPhone")
[ ] Price range extraction works ("50k rupees")
[ ] Add product returns productId
[ ] Added product appears in search
[ ] Update metadata returns updated data
[ ] Metadata appears in search
[ ] Pagination (limit) works
[ ] Pagination (offset) works
[ ] Suggestions return relevant titles
[ ] Error handling: 400 for missing fields
[ ] Error handling: 404 for invalid productId
[ ] Error handling: 404 for invalid route
```

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot GET /api/v1/search/product"
**Cause:** Server not running  
**Solution:** Run `npm start`

### Issue: Empty search results
**Cause:** No products match query  
**Solution:** Try query "phone" or check catalog size

### Issue: Intent type always "general"
**Cause:** Keywords not matching  
**Solution:** Use exact keywords: "Sasta", "Latest", "Best"

### Issue: Scores all the same
**Cause:** Ranking not working  
**Solution:** Check console for errors in ranking.js

### Issue: Latency > 1000ms
**Cause:** Too many products or slow CPU  
**Solution:** Check catalog size (`GET /health`)

---

## 📞 Need Help?

1. Check server logs (terminal running `npm start`)
2. Check `FOLDER_STRUCTURE.md` for detailed flow
3. Check code comments in `src/services/`
4. Test one API at a time (don't test everything at once)

---

**Happy Testing!** 🎉
