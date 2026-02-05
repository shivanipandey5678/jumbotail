# 🚀 How to Start Backend & Frontend

## ✅ Current Status

**Backend (Port 3000):** ✅ Running  
**Frontend (Port 3001):** ✅ Running

---

## 📋 Quick Start Guide

### **Method 1: Both Servers Running Separately (Current Setup)**

**Terminal 1 - Backend:**
```bash
npm start
```
- Backend runs on: **http://localhost:3000**
- APIs available at: `/api/v1/...`

**Terminal 2 - Frontend:**
```bash
npm run frontend
```
- Frontend UI runs on: **http://localhost:3001**
- Access the search interface here!

---

### **Method 2: Start Both at Once (Alternative)**

```bash
npm run start:all
```
This starts both backend and frontend together (Windows users may need to run separately)

---

## 🌐 Access Points

### **Frontend UI (Open in Browser)**
```
http://localhost:3001
```
**Features:**
- 🔍 Search for products
- ➕ Add new products
- ✏️ Update product metadata
- 🎯 Real-time suggestions

### **Backend API (For Testing)**
```
http://localhost:3000
```
**Endpoints:**
- `GET /api/v1/health` - Health check
- `GET /api/v1/search/product?query=iPhone` - Search
- `POST /api/v1/product` - Add product
- `PUT /api/v1/product/meta-data` - Update metadata
- `GET /api/v1/search/suggestions?q=iph` - Suggestions

---

## 🔧 Server Management

### **Check if Servers are Running**

**Check Backend (Port 3000):**
```bash
netstat -ano | findstr :3000
```

**Check Frontend (Port 3001):**
```bash
netstat -ano | findstr :3001
```

### **Stop Servers**

**Windows:**
```bash
# Find process ID (PID) from netstat output above
taskkill /PID <PID> /F
```

**Example:**
```bash
# If backend PID is 18488
taskkill /PID 18488 /F

# If frontend PID is 1240
taskkill /PID 1240 /F
```

### **Restart Servers**

Just run the start commands again:
```bash
npm start              # Backend
npm run frontend       # Frontend
```

---

## 🧪 Quick Test

### **1. Test Backend**
Open browser to: `http://localhost:3000`

You should see:
```json
{
  "message": "Jumbotail Search Engine API",
  "version": "1.0.0",
  "endpoints": {
    "health": "GET /health",
    "addProduct": "POST /api/v1/product",
    "updateMetadata": "PUT /api/v1/product/meta-data",
    "search": "GET /api/v1/search/product?query=iPhone",
    "suggestions": "GET /api/v1/search/suggestions?q=iph"
  }
}
```

### **2. Test Frontend**
Open browser to: `http://localhost:3001`

You should see:
- Search bar with placeholder "Search electronics..."
- Product cards displayed below
- Blue "Add Product" button

### **3. Test Search**
In the frontend (port 3001), try searching:
- "iPhone" → Should show iPhone products
- "sasta phone" → Should show cheaper products
- "latest Samsung" → Should show newer Samsung phones

---

## 🐛 Troubleshooting

### **Issue: "Port already in use"**

**Backend (3000):**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
npm start
```

**Frontend (3001):**
```bash
netstat -ano | findstr :3001
taskkill /PID <PID> /F
npm run frontend
```

### **Issue: "Cannot connect to backend"**

1. Check backend is running on port 3000
2. Open `http://localhost:3000` - should show API info
3. Check CORS is enabled in `src/index.js`

### **Issue: Frontend shows blank page**

1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify `public/index.html` exists
4. Try hard refresh (Ctrl + Shift + R)

### **Issue: Search not working**

1. Verify backend is running (port 3000)
2. Open browser DevTools → Network tab
3. Search for something
4. Check if API calls to `http://localhost:3000/api/v1/search/product` succeed
5. If you see CORS errors, backend CORS might need update

---

## 📊 Architecture

```
┌─────────────────────┐
│   Browser           │
│   localhost:3001    │ ← Frontend UI (React + Tailwind)
└──────────┬──────────┘
           │
           │ HTTP Requests
           ↓
┌─────────────────────┐
│   Backend API       │
│   localhost:3000    │ ← Express Server + Ranking Engine
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   In-Memory Store   │
│   (JavaScript Map)  │ ← Product Catalog (100+ products)
└─────────────────────┘
```

---

## 📝 File Structure

```
jumbotail/
├── src/
│   ├── index.js              ← Backend server (Port 3000)
│   ├── catalog.js            ← Product storage
│   ├── routes/
│   │   ├── product.js        ← Add/Update APIs
│   │   └── search.js         ← Search API
│   ├── services/
│   │   ├── intent.js         ← Query understanding
│   │   ├── ranking.js        ← Product ranking
│   │   └── search.js         ← Search orchestration
│   └── utils/
│       └── validation.js     ← Input validation
├── public/
│   └── index.html            ← Frontend UI (Port 3001)
├── data/
│   └── products-demo.json    ← Product data
├── frontend-server.js        ← Frontend server script
└── package.json              ← NPM scripts
```

---

## ⚡ Performance

**Expected Response Times:**
- Search API: **50-100ms** (for 100 products)
- Add Product: **< 10ms**
- Update Metadata: **< 10ms**

All well under the **< 1000ms** requirement! ✅

---

## 🎯 Next Steps

1. ✅ **Open http://localhost:3001 in your browser**
2. ✅ **Test search functionality**
3. ✅ **Try adding a product**
4. ✅ **Update metadata for a product**
5. ✅ **Review `EDGE_CASES_TESTING.md` for comprehensive tests**

---

## 📚 Additional Documentation

- **API Documentation:** `README.md`
- **Testing Guide:** `EDGE_CASES_TESTING.md`
- **Detailed Explanation:** `EXPLANATION.md`
- **Project Summary:** `SUMMARY.md`
- **Troubleshooting:** `QUICKSTART.md`

---

**🎉 Both servers are running! Open http://localhost:3001 and start testing!**
