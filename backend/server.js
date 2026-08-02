const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./db');
const gameRoutes = require('./routes/game');

const app = express();
const PORT = process.env.PORT || 5000;

const corsOrigin = process.env.CORS_ORIGIN;
const allowedOrigins = (corsOrigin || "http://localhost:5500,http://127.0.0.1:5500,http://localhost:8080,http://127.0.0.1:8080,http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000")
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true
};

// Middleware
app.use(express.json());
app.use(cors(corsOptions));

// Test route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Backend is running!', timestamp: new Date() });
});

// API Routes
app.use('/api', gameRoutes);

// Start server
const start = async () => {
  const dbConnected = await connectDB();
  
  if (dbConnected) {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📝 Test endpoint: http://localhost:${PORT}/api/health`);
    });
  } else {
    console.log('⚠️  Server started but MongoDB is not connected. Make sure MongoDB is running!');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  }
};

start();
