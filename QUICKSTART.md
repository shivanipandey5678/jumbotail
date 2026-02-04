# Quick Start Guide (3 Commands)

## Step 1: Install Dependencies

```bash
cd c:\Users\DELL\Desktop\jumbotail
npm install
```

**What this does:** Installs Express and string-similarity libraries.

---

## Step 2: Start the Server

```bash
npm start
```

**Expected output:**
```
✅ Catalog loaded: 60 products from data/products-demo.json
🚀 Server running at http://localhost:3000
📊 Frontend UI: http://localhost:3000
🔍 Search API: http://localhost:3000/api/v1/search/product?query=iPhone
```

**What this does:**
- Loads 60 products from `data/products-demo.json` into memory
- Starts Express server on port 3000
- Serves frontend UI at http://localhost:3000

---

## Step 3: Test the Search

### Option A: Use the Frontend (Easiest)

1. Open **http://localhost:3000** in your browser
2. You'll see a beautiful search page with:
   - Search box (type "Sasta iPhone")
   - Popular searches (click to try)
   - Features section

3. **Try these queries:**
   - Type "**Sasta iPhone**" → click Search → see cheaper iPhones ranked at top
   - Type "**Latest iphone**" → see newer models (iPhone 16, 15)
   - Type "**Ifone**" → typo gets fuzzy-matched to "iPhone"
   - Type "**iph**" → see suggestions dropdown (typeahead)
   - Click "**iPhone 16**" in popular searches → instant results

4. **Try the Add Product form:**
   - Click orange "**+ Add Product**" button (top right)
   - Fill form: title, rating, price, etc.
   - Click "Add Product"
   - See success message with productId

### Option B: Use curl (For API testing)

```bash
# Search for "Sasta iPhone"
curl "http://localhost:3000/api/v1/search/product?query=Sasta%20iPhone"

# Get suggestions
curl "http://localhost:3000/api/v1/search/suggestions?q=iph"

# Add a product
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d '{"title":"iPhone 17","description":"New model","rating":4.5,"stock":100,"price":81999,"mrp":89999,"currency":"Rupee"}'

# Health check
curl http://localhost:3000/health
```

---

## What You Should See

### Frontend UI Screenshot (conceptual)

```
┌─────────────────────────────────────────────────────────────┐
│  [ES] ElectroSearch                      [+ Add Product]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│         ✨ Smart Search for Electronics                    │
│                                                             │
│    Find the Best Electronics at Unbeatable Prices          │
│                                                             │
│    Search in your language — "Sasta iPhone", "Latest..."   │
│                                                             │
│    ┌────────────────────────────────────────┬─────────┐   │
│    │ Search for phones, laptops...          │ Search  │   │
│    └────────────────────────────────────────┴─────────┘   │
│                                                             │
│    📈 Popular searches                                      │
│    [iPhone 16] [Samsung Galaxy] [Laptop under 50k]...     │
│                                                             │
│    ⚡ Lightning Fast    ✨ Smart Search    📈 Best Deals   │
└─────────────────────────────────────────────────────────────┘

(After search: Product cards appear below in a grid)
```

### Search Results

```json
{
  "data": [
    {
      "productId": 1,
      "title": "iPhone 15 128GB Black",
      "description": "High quality accessory: iPhone 15...",
      "mrp": 25059,
      "Sellingprice": 23148,
      "Metadata": {
        "ram": null,
        "storage": null,
        "model": "iPhone 15",
        "color": "Green"
      },
      "stock": 740
    }
  ]
}
```

---

## Troubleshooting

### Error: "Cannot find module 'express'"

**Solution:** Run `npm install` first.

### Error: "Port 3000 already in use"

**Solution:** Kill the process using port 3000 or change the port:
```bash
PORT=3001 npm start
```

### Error: "Catalog loaded: 0 products"

**Solution:** The `data/products-demo.json` file is missing or empty. Run:
```bash
npm run generate-demo
```
Then restart: `npm start`

### Frontend shows "Failed to search. Make sure server is running..."

**Solution:** Backend is not running. Make sure you ran `npm start` and see the "Server running" message.

---

## Next Steps

1. ✅ **Test different queries** - Try all sample queries in README
2. ✅ **Add a product** - Use the frontend form or curl
3. ✅ **Read EXPLANATION.md** - Understand how everything works
4. ✅ **Scale to 1000** - Edit generator script, change 60 → 1000, run `npm run generate-demo`
5. ✅ **Review code** - Check `src/services/ranking.js` for ranking logic

---

## Summary

**Total time:** ~2 minutes to start and test

**Commands:**
```bash
npm install          # 1-2 min
npm start            # instant
# Open http://localhost:3000 in browser and search!
```

**That's it! You're ready to test the e-commerce search engine.**
