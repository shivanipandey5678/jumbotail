# Testing Guide

## Start the server

```bash
npm start
```

Server runs at `http://localhost:3000`

## Test APIs

### 1. Health check
```bash
curl http://localhost:3000/health
```

### 2. Search for "iPhone"
```bash
curl "http://localhost:3000/api/v1/search/product?query=iPhone"
```

### 3. Search for "Sasta iPhone" (budget intent)
```bash
curl "http://localhost:3000/api/v1/search/product?query=Sasta%20iPhone"
```

### 4. Search with typo "Ifone"
```bash
curl "http://localhost:3000/api/v1/search/product?query=Ifone"
```

### 5. Get suggestions (typeahead)
```bash
curl "http://localhost:3000/api/v1/search/suggestions?q=iph"
```

### 6. Add a new product
```bash
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"iPhone 17\",\"description\":\"New iPhone 17 with A19 chip\",\"rating\":4.5,\"stock\":100,\"price\":81999,\"mrp\":89999,\"currency\":\"Rupee\"}"
```

### 7. Update metadata
```bash
curl -X PUT http://localhost:3000/api/v1/product/meta-data \
  -H "Content-Type: application/json" \
  -d "{\"productId\":61,\"Metadata\":{\"ram\":\"8GB\",\"storage\":\"256GB\",\"color\":\"Black\"}}"
```

## Sample queries to test ranking

- `Latest iphone` - should show newer models
- `Sasta wala iPhone` - should show cheaper iPhones
- `Ifone 16` - should fuzzy match to iPhone 16
- `iPhone 16 red color` - should filter by color
- `iPhone 50k rupees` - should show iPhones around 50k price
- `Samsung phone` - should show Samsung products
- `iPhone cover strong` - should show covers with strength attribute
