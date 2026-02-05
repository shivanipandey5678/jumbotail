# 🐛 Complete Edge Cases & Bug Testing Guide

**Purpose:** Try to break the application! Find all possible bugs before submission.

---

## 🎯 CRITICAL FIXES IMPLEMENTED

### ✅ Bugs Fixed:
1. ✅ **Negative stock/price** - Now validated and rejected
2. ✅ **Price > MRP** - Now validated and rejected  
3. ✅ **Empty title** - Now validated and rejected
4. ✅ **Very long strings** - Now limited (title: 500, description: 5000)
5. ✅ **XSS attacks** - All strings sanitized with sanitize-html
6. ✅ **Rate limiting** - Max 100 requests per 15 minutes per IP
7. ✅ **Request body size** - Limited to 1MB
8. ✅ **Invalid types** - Comprehensive type checking
9. ✅ **Request timeout** - 10 second timeout on all requests
10. ✅ **Debouncing** - 300ms debounce on search (prevent spam)

### 🛡️ Security Added:
1. ✅ **Helmet** - Security headers
2. ✅ **Rate limiting** - Prevent DDoS
3. ✅ **Input sanitization** - Prevent XSS
4. ✅ **Body size limit** - Prevent payload attacks
5. ✅ **Error masking** - Don't expose internals in production

---

## 📋 Testing Checklist

### 1️⃣ **POST /api/v1/product - Add Product**

#### ✅ Valid Cases:
```bash
# Normal product
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d '{"title":"iPhone 17","description":"Latest model","rating":4.5,"stock":100,"price":80000,"mrp":90000,"currency":"Rupee"}'
# Expected: 201 with productId
```

#### ❌ Edge Cases to Test:

```bash
# Test 1: Missing required fields
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d '{"title":"iPhone"}'
# Expected: 400 with errors array

# Test 2: Invalid rating (> 5)
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"test","rating":10,"stock":100,"price":50000,"mrp":60000,"currency":"Rupee"}'
# Expected: 400 "Rating must be between 0 and 5"

# Test 3: Negative rating
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"test","rating":-1,"stock":100,"price":50000,"mrp":60000,"currency":"Rupee"}'
# Expected: 400 "Rating must be between 0 and 5"

# Test 4: Negative stock (FIXED!)
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"test","rating":4,"stock":-10,"price":50000,"mrp":60000,"currency":"Rupee"}'
# Expected: 400 "Stock cannot be negative"

# Test 5: Negative price (FIXED!)
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"test","rating":4,"stock":100,"price":-50000,"mrp":60000,"currency":"Rupee"}'
# Expected: 400 "Price cannot be negative"

# Test 6: Price > MRP (FIXED!)
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"test","rating":4,"stock":100,"price":60000,"mrp":50000,"currency":"Rupee"}'
# Expected: 400 "Price cannot exceed MRP"

# Test 7: Empty title (FIXED!)
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d '{"title":"","description":"test","rating":4,"stock":100,"price":50000,"mrp":60000,"currency":"Rupee"}'
# Expected: 400 "Title cannot be empty"

# Test 8: Very long title (FIXED!)
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"$(python -c 'print("A"*1000)')\",\"description\":\"test\",\"rating\":4,\"stock\":100,\"price\":50000,\"mrp\":60000,\"currency\":\"Rupee\"}"
# Expected: 400 "Title too long (max 500 characters)"

# Test 9: XSS attempt (FIXED!)
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d '{"title":"<script>alert(1)</script>","description":"test","rating":4,"stock":100,"price":50000,"mrp":60000,"currency":"Rupee"}'
# Expected: 201 but title is sanitized to "scriptalert(1)/script"

# Test 10: String instead of number
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"test","rating":"hello","stock":100,"price":50000,"mrp":60000,"currency":"Rupee"}'
# Expected: 400 "Rating must be a number"

# Test 11: Float stock (should be integer)
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"test","rating":4.5,"stock":10.5,"price":50000,"mrp":60000,"currency":"Rupee"}'
# Expected: 400 "Stock must be an integer"

# Test 12: Invalid JSON
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d '{title:test}'
# Expected: 400 JSON parse error
```

---

### 2️⃣ **PUT /api/v1/product/meta-data - Update Metadata**

#### ❌ Edge Cases:

```bash
# Test 1: Invalid productId
curl -X PUT http://localhost:3000/api/v1/product/meta-data \
  -H "Content-Type: application/json" \
  -d '{"productId":99999,"metadata":{"ram":"8GB"}}'
# Expected: 404 "Product not found"

# Test 2: Missing productId (FIXED!)
curl -X PUT http://localhost:3000/api/v1/product/meta-data \
  -H "Content-Type: application/json" \
  -d '{"metadata":{"ram":"8GB"}}'
# Expected: 400 "Missing required field: productId"

# Test 3: String productId
curl -X PUT http://localhost:3000/api/v1/product/meta-data \
  -H "Content-Type: application/json" \
  -d '{"productId":"hello","metadata":{"ram":"8GB"}}'
# Expected: 400 "Product ID must be a number"

# Test 4: Negative productId
curl -X PUT http://localhost:3000/api/v1/product/meta-data \
  -H "Content-Type: application/json" \
  -d '{"productId":-1,"metadata":{"ram":"8GB"}}'
# Expected: 400 "Product ID must be positive"

# Test 5: Huge metadata (FIXED!)
# Create huge metadata object
curl -X PUT http://localhost:3000/api/v1/product/meta-data \
  -H "Content-Type: application/json" \
  -d "{\"productId\":1,\"metadata\":{\"test\":\"$(python -c 'print("A"*20000)')\"}}"
# Expected: 400 "Metadata too large (max 10KB)"

# Test 6: XSS in metadata (FIXED!)
curl -X PUT http://localhost:3000/api/v1/product/meta-data \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"metadata":{"ram":"<script>alert(1)</script>"}}'
# Expected: 200 but value is sanitized

# Test 7: Empty metadata object
curl -X PUT http://localhost:3000/api/v1/product/meta-data \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"metadata":{}}'
# Expected: 200 (no change)

# Test 8: Null metadata
curl -X PUT http://localhost:3000/api/v1/product/meta-data \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"metadata":null}'
# Expected: 200 (acceptable)
```

---

### 3️⃣ **GET /api/v1/search/product - Search**

#### ❌ Edge Cases:

```bash
# Test 1: Empty query (WORKING!)
curl "http://localhost:3000/api/v1/search/product?query="
# Expected: 200 with top-rated products

# Test 2: No query parameter
curl "http://localhost:3000/api/v1/search/product"
# Expected: 200 with top-rated products

# Test 3: Very long query (FIXED!)
curl "http://localhost:3000/api/v1/search/product?query=$(python -c 'print("A"*1000)')"
# Expected: 400 "Query too long (max 500 characters)"

# Test 4: Special characters
curl "http://localhost:3000/api/v1/search/product?query=%3Cscript%3Ealert%281%29%3C%2Fscript%3E"
# Expected: 200 (sanitized, no XSS)

# Test 5: Very large limit (FIXED!)
curl "http://localhost:3000/api/v1/search/product?query=iPhone&limit=999999"
# Expected: 200 (capped at 100)

# Test 6: Negative limit (FIXED!)
curl "http://localhost:3000/api/v1/search/product?query=iPhone&limit=-10"
# Expected: 200 (defaults to 50)

# Test 7: String limit
curl "http://localhost:3000/api/v1/search/product?query=iPhone&limit=hello"
# Expected: 200 (defaults to 50)

# Test 8: Negative offset (FIXED!)
curl "http://localhost:3000/api/v1/search/product?query=iPhone&offset=-10"
# Expected: 200 (defaults to 0)

# Test 9: Unicode characters
curl "http://localhost:3000/api/v1/search/product?query=iPhone%20🔥"
# Expected: 200 (handled gracefully)
```

---

### 4️⃣ **Rate Limiting Test**

```bash
# Send 101 requests rapidly (should block 101st)
for i in {1..101}; do
  echo "Request $i"
  curl "http://localhost:3000/api/v1/search/product?query=test"
done
# Expected: First 100 succeed, 101st returns 429 "Too Many Requests"
```

---

### 5️⃣ **Frontend Testing**

#### Search Input:

**Test in browser (http://localhost:3000):**

1. ✅ Empty search → Toast: "Please enter a search query"
2. ✅ Valid search → Toast: "Found N products in Xms"
3. ✅ No results → Toast: "No products found"
4. ✅ Server down → Toast: "Search failed. Make sure server is running"
5. ✅ Very long query (type 1000 chars) → maxLength="500" prevents
6. ✅ Press Enter rapidly 10 times → Debounced (only 1 request after 300ms)
7. ✅ Click Search while loading → Button disabled
8. ✅ Network timeout (disable network in DevTools) → Toast: "Request timeout"

#### Add Product Form:

1. ✅ Submit empty → Browser validation (required fields)
2. ✅ Rating > 5 → Browser validation (max="5")
3. ✅ Rating < 0 → Browser validation (min="0")
4. ✅ Negative price → Toast: "Price cannot be negative"
5. ✅ Price > MRP → Toast: "Price cannot exceed MRP"
6. ✅ Very long title → maxLength="500" prevents
7. ✅ Submit twice rapidly → Debounced by loading state
8. ✅ Server error → Toast with error message
9. ✅ Success → Toast: "Product added! ID: X"

#### Update Metadata Form:

1. ✅ Submit all empty → Works (no change)
2. ✅ Very long values → maxLength on each field
3. ✅ XSS attempt → Sanitized on backend
4. ✅ Invalid productId → Toast: "Product not found"
5. ✅ Success → Toast + product card updates
6. ✅ Shows current metadata → User can see what they're updating
7. ✅ Clear instructions → Blue info box explains how to use

---

## 🚀 Performance Testing

### Test 1: Search Latency

```bash
# Measure search time
time curl "http://localhost:3000/api/v1/search/product?query=iPhone"
# Expected: < 1000ms (should be 50-100ms)
```

### Test 2: Concurrent Requests

```bash
# Send 50 requests simultaneously
for i in {1..50}; do
  curl "http://localhost:3000/api/v1/search/product?query=iPhone" &
done
wait
# Expected: All complete successfully (rate limit allows 100)
```

### Test 3: Large Catalog

1. Scale data to 1000 products
2. Search for "iPhone"
3. Check \`_performance.duration_ms\` in response
4. Expected: < 200ms (well under 1000ms)

---

## 🔒 Security Testing

### Test 1: XSS Prevention

```bash
# Try to inject script
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d '{"title":"<script>alert(\"XSS\")</script>","description":"test","rating":4,"stock":100,"price":50000,"mrp":60000,"currency":"Rupee"}'
# Expected: 201 but title sanitized (no script tags)

# Verify in search
curl "http://localhost:3000/api/v1/search/product?query=XSS"
# Check: No <script> tags in response
```

### Test 2: SQL Injection (Safe)

```bash
curl "http://localhost:3000/api/v1/search/product?query=iPhone' OR 1=1--"
# Expected: 200 (safe, no database)
```

### Test 3: Rate Limiting

```bash
# Send 110 requests rapidly
for i in {1..110}; do
  curl -s "http://localhost:3000/api/v1/search/product?query=test" &
done
wait
# Expected: Last 10 return 429 "Too Many Requests"
```

### Test 4: Huge Payload

```bash
# Try to send 10MB payload
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"$(python -c 'print("A"*10000000)')\",\"description\":\"test\",\"rating\":4,\"stock\":100,\"price\":50000,\"mrp\":60000}"
# Expected: 413 "Payload Too Large" or connection closed
```

---

## 🌐 Browser Testing

### Test in Chrome DevTools:

#### 1. Network Tab:
- Search for "iPhone"
- Check: Request completes in < 1000ms
- Check: Response has \`_performance.duration_ms\`
- Check: Status 200

#### 2. Network Throttling:
- Set throttle to "Slow 3G"
- Search for "iPhone"
- Check: Loading spinner shows
- Check: Request timeout handled (10s limit)

#### 3. Offline Mode:
- Disable network
- Try searching
- Expected: Toast "Search failed. Make sure server is running"

#### 4. Console:
- Open Console tab
- Search for "iPhone"
- Check: No JavaScript errors
- Check: No XSS warnings

---

## 🐛 Edge Cases by Component

### **Frontend - Search Input:**

| Test Case | How to Test | Expected Result |
|-----------|-------------|-----------------|
| Empty search | Click Search with empty input | Toast: "Please enter a search query" |
| Only spaces | Type "     " and search | Toast: "Please enter a search query" |
| Very long (600 chars) | Type 600 characters | Input maxLength=500 prevents |
| Special chars | Type `<script>alert(1)</script>` | Sanitized on backend, no XSS |
| Press Enter 10x | Hold Enter key | Debounced, only 1 request |
| Click Search 10x | Click button rapidly | Disabled while loading |
| Server down | Stop server, search | Toast: "Search failed..." |

### **Frontend - Add Product:**

| Test Case | How to Test | Expected Result |
|-----------|-------------|-----------------|
| Submit empty | Click "Add Product" without filling | Browser validation (required) |
| Rating = 10 | Enter 10 in rating | Browser validation (max=5) |
| Rating = -1 | Enter -1 in rating | Browser validation (min=0) |
| Stock = -10 | Enter -10 in stock | Frontend validation before submit |
| Price = -1000 | Enter -1000 | Frontend validation before submit |
| Price > MRP | Price=100k, MRP=50k | Frontend validation before submit |
| Submit 5x rapidly | Click submit 5 times fast | Loading state prevents duplicates |
| Server error | Simulate 500 error | Toast: "Error: [message]" |

### **Frontend - Update Metadata:**

| Test Case | How to Test | Expected Result |
|-----------|-------------|-----------------|
| Submit all empty | Leave all fields blank | Works (no change) |
| Very long value | Type 2000 chars | maxLength prevents |
| Invalid productId | Manually change product ID | 404 toast |
| Success | Update RAM to "16GB" | Toast + card updates |
| Close while loading | Submit then close modal | Request completes anyway |
| Update same product 2x | Update, close, update again | Both updates work |

---

## 📊 Full Test Script

Save as `test-all.sh`:

```bash
#!/bin/bash

echo "🧪 Running Complete Edge Case Tests..."

API="http://localhost:3000"

echo "\n1️⃣ Testing POST /api/v1/product"
echo "Test 1.1: Valid product"
curl -s -X POST $API/api/v1/product -H "Content-Type: application/json" \
  -d '{"title":"Test1","description":"test","rating":4.5,"stock":100,"price":50000,"mrp":60000,"currency":"Rupee"}' | head -n 3

echo "\nTest 1.2: Negative price (should fail)"
curl -s -X POST $API/api/v1/product -H "Content-Type: application/json" \
  -d '{"title":"Test2","description":"test","rating":4,"stock":100,"price":-1000,"mrp":60000,"currency":"Rupee"}' | head -n 5

echo "\nTest 1.3: Price > MRP (should fail)"
curl -s -X POST $API/api/v1/product -H "Content-Type: application/json" \
  -d '{"title":"Test3","description":"test","rating":4,"stock":100,"price":100000,"mrp":50000,"currency":"Rupee"}' | head -n 5

echo "\n2️⃣ Testing PUT /api/v1/product/meta-data"
echo "Test 2.1: Update valid product"
curl -s -X PUT $API/api/v1/product/meta-data -H "Content-Type: application/json" \
  -d '{"productId":1,"metadata":{"ram":"16GB","storage":"512GB"}}' | head -n 5

echo "\nTest 2.2: Invalid productId (should fail)"
curl -s -X PUT $API/api/v1/product/meta-data -H "Content-Type: application/json" \
  -d '{"productId":99999,"metadata":{"ram":"8GB"}}' | head -n 3

echo "\n3️⃣ Testing GET /api/v1/search/product"
echo "Test 3.1: Normal search"
curl -s "$API/api/v1/search/product?query=iPhone" | head -n 5

echo "\nTest 3.2: Empty query"
curl -s "$API/api/v1/search/product?query=" | head -n 5

echo "\nTest 3.3: Typo handling"
curl -s "$API/api/v1/search/product?query=Ifone" | head -n 5

echo "\n4️⃣ Testing Performance"
echo "Measuring search latency..."
time curl -s "$API/api/v1/search/product?query=iPhone" > /dev/null

echo "\n✅ All tests complete!"
```

Run with: `bash test-all.sh`

---

## ✅ Final Checklist

Before submission, verify:

### API Tests:
- [ ] All valid requests work (200, 201)
- [ ] All invalid requests fail gracefully (400, 404)
- [ ] Rate limiting works (429 after 100 requests)
- [ ] XSS prevented (sanitized output)
- [ ] Validation rejects negative values
- [ ] Validation rejects price > MRP
- [ ] Validation rejects empty strings
- [ ] Validation rejects very long strings
- [ ] Search latency < 1000ms
- [ ] Error messages are clear

### Frontend Tests:
- [ ] Search shows results
- [ ] Empty search shows toast error
- [ ] Server down shows toast error
- [ ] Add product works
- [ ] Add product validation works (negative, price>MRP)
- [ ] Update metadata works
- [ ] Update metadata shows current values
- [ ] Update metadata shows instructions
- [ ] Toasts auto-dismiss after 5 seconds
- [ ] Loading states show (spinners, disabled buttons)
- [ ] No console errors in browser
- [ ] UI responsive on mobile
- [ ] Product cards show metadata clearly
- [ ] "Update Specs" button obvious

---

## 🎯 Summary of Fixes

### Security (10 fixes):
1. ✅ Helmet (security headers)
2. ✅ Rate limiting (100 req/15min)
3. ✅ Body size limit (1MB max)
4. ✅ Input sanitization (XSS prevention)
5. ✅ Error masking (production mode)
6. ✅ Request timeout (10s)
7. ✅ CORS properly configured
8. ✅ Debouncing (prevent spam)
9. ✅ Max length validation
10. ✅ Type checking

### Validation (12 fixes):
1. ✅ Negative stock → rejected
2. ✅ Negative price → rejected
3. ✅ Negative MRP → rejected
4. ✅ Price > MRP → rejected
5. ✅ Rating > 5 → rejected
6. ✅ Rating < 0 → rejected
7. ✅ Empty title → rejected
8. ✅ Title > 500 chars → rejected
9. ✅ Description > 5000 chars → rejected
10. ✅ Float stock → rejected (must be integer)
11. ✅ Invalid productId → 404
12. ✅ Metadata > 10KB → rejected

### UX (8 improvements):
1. ✅ Toast notifications (success/error/info/warning)
2. ✅ Loading spinners
3. ✅ Disabled buttons while loading
4. ✅ Clear error messages
5. ✅ Request timeout handling
6. ✅ Debouncing (smooth UX)
7. ✅ Instructions in update metadata modal
8. ✅ Current metadata display

---

**Total: 30 fixes/improvements!** 🎉

All critical bugs resolved. Ready for production testing!
