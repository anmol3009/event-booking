require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// ─── Route Imports ───────────────────────────────────────────────────────────
const authRoutes      = require('./routes/auth');
const userRoutes      = require('./routes/users');
const eventRoutes     = require('./routes/events');
const bookingRoutes   = require('./routes/bookings');
const resaleRoutes    = require('./routes/resale');
const offerRoutes     = require('./routes/offers');
const waitlistRoutes  = require('./routes/waitlist');
const ticketRoutes    = require('./routes/tickets');
const adminRoutes     = require('./routes/admin');
const errorHandler    = require('./middleware/errorHandler');

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/events',   eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/resale',   resaleRoutes);
app.use('/api/offers',   offerRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/tickets',  ticketRoutes);
app.use('/api/admin',    adminRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 CookMyShow API running on port ${PORT}`);
});

module.exports = app;
