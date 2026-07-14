# Multiplication RPG Backend

## What We Just Built

```
backend/
├── server.js          ← Main entry point
├── db.js              ← MongoDB connection
├── package.json       ← Dependencies
├── .env               ← Local settings (don't share)
├── .env.example       ← Template for .env
├── models/
│   ├── User.js        ← Player account
│   └── GameSave.js    ← Save progress
└── routes/
    └── game.js        ← API endpoints
```

## What the Backend Does

1. **Receives requests** from the frontend (React/HTML game)
2. **Saves data** to MongoDB (student progress, usernames, XP)
3. **Returns data** when students reload the page
4. **Handles errors** and validates input

## API Endpoints (Menu Items)

| Endpoint | Purpose | Example Request |
|---|---|---|
| `POST /api/user/create` | Create new player | `{ username: "Alice" }` |
| `GET /api/game/load/:username` | Load saved game | Visit URL with username |
| `POST /api/game/save` | Save progress | `{ username, currentLevel, xp, playerHp }` |
| `GET /api/health` | Check if server is running | Visit URL to test |

## Next Steps (DO THESE)

### Step 1: Install MongoDB Locally
- Download from: https://www.mongodb.com/try/download/community
- Run the installer
- Choose "Install as a Windows Service"
- Complete installation

### Step 2: Start MongoDB
Once installed, MongoDB starts automatically. To verify it's running:
```
mongosh
```
You should see a `>` prompt. Type `exit` to quit.

### Step 3: Test the Backend Locally

From the `backend/` folder:
```
npm run dev
```

You should see:
```
🔄 Connecting to MongoDB...
✅ MongoDB connected successfully!
🚀 Server running on http://localhost:5000
```

### Step 4: Test the API

Open your browser and visit:
```
http://localhost:5000/api/health
```

You should see:
```json
{
  "message": "Backend is running!",
  "timestamp": "2026-07-14T..."
}
```

✅ **If you see this, everything works!**

## How to Connect Frontend to Backend

In `frontend/js/storage.js`, replace localStorage calls with fetch requests:

```javascript
// OLD (localStorage)
localStorage.setItem("username", "Alice");

// NEW (API)
fetch('http://localhost:5000/api/user/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'Alice' })
})
```

## Troubleshooting

**"MongoDB connection failed"**
- Make sure MongoDB is running (mongosh should work)
- Check if MONGO_URI in .env is correct

**"Port 5000 already in use"**
- Change `PORT` in `.env` to something else like `5001`

**"npm command not found"**
- Install Node.js from https://nodejs.org

## Environment Variables (.env)

```
MONGO_URI=mongodb://localhost:27017/multiplication-rpg
PORT=5000
NODE_ENV=development
```

These get loaded automatically when server starts.

---

**Ready?** Answer when you've installed MongoDB and we'll test it together!
