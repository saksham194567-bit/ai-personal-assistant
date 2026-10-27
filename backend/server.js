/**
 * server.js — Express backend entry point for AI Personal Assistant
 *
 * Architecture:
 *   - Firebase Admin SDK validates tokens from the frontend
 *   - MongoDB (via Mongoose) stores user data server-side
 *   - Gemini API proxied here so API key is never exposed to the browser
 *   - All routes are protected by the verifyToken middleware
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

// ─── Route Imports ────────────────────────────────────────────────────────────
const authRoutes    = require('./routes/auth');
const taskRoutes    = require('./routes/tasks');
const noteRoutes    = require('./routes/notes');
const plannerRoutes = require('./routes/planner');
const chatRoutes    = require('./routes/chat');
const userRoutes    = require('./routes/user');
const adminRoutes   = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://localhost:5173',
    'http://localhost:3000',
    'https://localhost:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 200,                   // max 200 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Stricter limit for AI chat (it's expensive)
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 10,              // 10 AI messages per minute
  message: { error: 'Chat rate limit reached. Please wait a moment.' },
});
app.use('/api/chat', chatLimiter);

// ─── General Middleware ───────────────────────────────────────────────────────
app.use(morgan('dev'));              // HTTP request logger
app.use(express.json({ limit: '25kb' }));  // Bound JSON requests, including planner task lists.
app.use(express.urlencoded({ extended: true }));

// ─── MongoDB Connection ────────────────────────────────────────────────────────
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch((err) => {
      console.warn('⚠️ MongoDB connection warning:', err.message);
      console.warn('   Make sure MongoDB is running or check your MONGO_URI in backend/.env');
    });
} else {
  console.warn('⚠️ MONGO_URI is not set in backend/.env. Using offline mode.');
}

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/tasks',   taskRoutes);
app.use('/api/notes',   noteRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/chat',    chatRoutes);
app.use('/api/user',    userRoutes);
app.use('/api/admin',   adminRoutes);

// ─── Welcome & Health Check ──────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '🚀 AI Personal Assistant Backend API is running!',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      tasks: '/api/tasks',
      notes: '/api/notes',
      planner: '/api/planner',
      chat: '/api/chat',
      user: '/api/user',
    },
    status: 'online',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;
  res.status(status).json({ error: message });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
