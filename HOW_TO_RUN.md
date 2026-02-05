# 🚀 How to Run - Complete Guide

This is your **step-by-step guide** to run and test the Jumbotail Search Engine.

---

## ⚡ Quick Start (3 Steps)

### Step 1: Install Dependencies
```bash
cd c:\Users\DELL\Desktop\jumbotail
npm install
```

**What this does:** Installs Express and string-similarity libraries

**Expected output:**
```
added 57 packages in 3s
```

---

### Step 2: Verify Data File
```bash
# Check if products file exists
dir data\products-demo.json
```

**Expected:** File should exist with ~100 products

**If missing:** You'll see "File Not Found" - need to generate products first

---

### Step 3: Start Server
```bash
npm start
```

**Expected output:**
```
🚀 Starting Jumbotail Search Engine...

✅ Loaded 100 products from products-demo.json

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Server is running!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 URL: http://localhost:3000
📊 Catalog: 100 products

📚 API Endpoints:
   Health:      GET  http://localhost:3000/health
   Search:      GET  http://localhost:3000/api/v1/search/product?query=iPhone
   Add Product: POST http://localhost:3000/api/v1/product
   Update Meta: PUT  http://localhost:3000/api/v1/product/meta-data

💡 Test search: curl "http://localhost:3000/api/v1/search/product?query=Sasta%20iPhone"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Server is now running!** Leave this terminal open.

---

## ✅ Verify Server is Running

### Test 1: Health Check

Open a **new terminal** and run:
```bash
curl http://localhost:3000/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "catalogSize": 100,
  "uptime": 5.2
}
```

✅ If you see `"status": "healthy"` and `catalogSize: 100`, you're good!

---

### Test 2: Simple Search

```bash
curl "http://localhost:3000/api/v1/search/product?query=iPhone"
```

**Expected:** JSON response with products containing "iPhone"

**Check:**
- `data` array has products
- `duration_ms` < 1000
- Products have `productId`, `title`, `sellingPrice`, `stock`

---

## 🧪 Test All Features

### 1. Price Intent Search
```bash
curl "http://localhost:3000/api/v1/search/product?query=Sasta%20iPhone"
```

**What to check:**
- `intent.type` is "price"
- Cheaper iPhones rank higher

---

### 2. Latest Intent Search
```bash
curl "http://localhost:3000/api/v1/search/product?query=Latest%20iPhone"
```

**What to check:**
- `intent.type` is "latest"
- Newer models rank higher

---

### 3. Typo Handling
```bash
curl "http://localhost:3000/api/v1/search/product?query=Ifone"
```

**What to check:**
- Returns iPhone products (not "Ifone")
- Fuzzy matching worked

---

### 4. Color Attribute
```bash
curl "http://localhost:3000/api/v1/search/product?query=iPhone%20red%20color"
```

**What to check:**
- `intent.attributes.color` is "red"
- Red products rank higher

---

### 5. Add Product
```bash
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Test iPhone\",\"description\":\"test\",\"rating\":4.5,\"stock\":100,\"price\":50000,\"mrp\":60000,\"currency\":\"Rupee\"}"
```

**Expected response:**
```json
{
  "productId": 101
}
```

---

### 6. Update Metadata
```bash
# Use productId from step 5 (e.g., 101)
curl -X PUT http://localhost:3000/api/v1/product/meta-data \
  -H "Content-Type: application/json" \
  -d "{\"productId\":101,\"metadata\":{\"ram\":\"8GB\",\"storage\":\"256GB\"}}"
```

**Expected:**
```json
{
  "productId": 101,
  "Metadata": {
    "ram": "8GB",
    "storage": "256GB"
  }
}
```

---

### 7. Search Suggestions (Typeahead)
```bash
curl "http://localhost:3000/api/v1/search/suggestions?q=iph"
```

**Expected:**
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

## 🌐 Test in Browser

### Method 1: Health Check
Open browser and visit:
```
http://localhost:3000/health
```

Should show JSON with `status: "healthy"`

---

### Method 2: Search
Open browser and visit:
```
http://localhost:3000/api/v1/search/product?query=iPhone
```

Should show JSON with search results

---

### Method 3: Root Endpoint
Open browser and visit:
```
http://localhost:3000/
```

Should show welcome message with API list

---

## 🐛 Troubleshooting

### Problem: "npm: command not found"
**Solution:** Install Node.js from https://nodejs.org/ (v18+)

---

### Problem: "Cannot find module 'express'"
**Solution:** Run `npm install`

---

### Problem: "Port 3000 already in use"
**Solution:** 
- Kill process using port 3000
- OR change port: `PORT=3001 npm start`

---

### Problem: "Loaded 0 products"
**Cause:** `data/products-demo.json` is missing or empty

**Solution:**
1. Check file exists: `dir data\products-demo.json`
2. Check file has content (should be >50KB)
3. If empty/missing, you need to generate or add products

---

### Problem: Search returns empty results
**Cause:** No products match the query

**Solution:** Try a broader query like "phone" or check what products you have

---

### Problem: "Error: ECONNREFUSED"
**Cause:** Server is not running

**Solution:** Run `npm start` in a separate terminal

---

## 📊 Performance Check

### Check Latency
```bash
curl "http://localhost:3000/api/v1/search/product?query=iPhone" | grep duration_ms
```

**Expected:** `"duration_ms": 87` (or similar, should be < 1000)

---

### Check Catalog Size
```bash
curl http://localhost:3000/health | grep catalogSize
```

**Expected:** `"catalogSize": 100` (or your product count)

---

## 🎯 Next Steps

### 1. Scale to 1000 Products
- Edit your data file to have 1000+ products
- OR generate more products using a script
- Restart server: `Ctrl+C` then `npm start`

### 2. Test Different Queries
Try these queries to test ranking:
- "Sasta wala iPhone" (price intent)
- "Best iPhone" (quality intent)
- "Latest Samsung" (latest intent)
- "iPhone 16 red" (color attribute)
- "iPhone 50k rupees" (price range)
- "Ifone 16" (typo)

### 3. Test Error Handling
```bash
# Missing required field (400)
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Test\"}"

# Invalid product ID (404)
curl -X PUT http://localhost:3000/api/v1/product/meta-data \
  -H "Content-Type: application/json" \
  -d "{\"productId\":99999,\"metadata\":{}}"

# Invalid route (404)
curl http://localhost:3000/invalid
```

### 4. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit - Jumbotail Search Engine"
git branch -M main
git remote add origin https://github.com/shivanipandey5678/jumbotail.git
git push -u origin main
```

---

## 📚 Documentation

For more details, see:
- **README.md** - Full API documentation
- **FOLDER_STRUCTURE.md** - Architecture explanation
- **TESTING_GUIDE.md** - Complete test cases
- **CONVERSATION.md** - LLM conversation log

---

## 🎉 Success Criteria

Your backend is working if:
- [x] Server starts without errors
- [x] Health check returns `"status": "healthy"`
- [x] Search returns products
- [x] Search latency < 1000ms (check `duration_ms`)
- [x] Price intent works ("Sasta" → cheaper products rank higher)
- [x] Typo handling works ("Ifone" → finds iPhone)
- [x] Add product returns productId
- [x] Update metadata works

**All checks passed? You're ready to submit!** 🚀

---

## 💡 Pro Tips

1. **Keep server terminal open** - Don't close it while testing
2. **Use another terminal for curl** - Server terminal shows logs
3. **Check server logs** - Shows each request and performance
4. **Test one API at a time** - Easier to debug
5. **Read error messages** - They tell you exactly what's wrong

---

## 🆘 Need Help?

1. Check server logs (terminal running `npm start`)
2. Check `TESTING_GUIDE.md` for detailed test cases
3. Check `FOLDER_STRUCTURE.md` for architecture explanation
4. Check code comments (heavily documented)

---

**Happy Testing!** 🎉
