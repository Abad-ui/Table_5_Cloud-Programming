// Load environment variables FIRST
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// ==============================================
// Routes & Middleware Imports
// ==============================================
const userRoutes = require('./routes/userRoutes');
const hazardRoutes = require('./routes/hazardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const analysisRoutes = require('./routes/analysisRoutes');

const logger = require('./middleware/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const noSqlInjection = require('./middleware/noSqlInjection');

// Load passport AFTER dotenv and other imports
const passport = require('./middleware/passport');

// ==============================================
// Express App Initialization
// ==============================================
const app = express();

// ==============================================
// Global Middleware
// ==============================================
app.use(cors());
app.use(express.json());
app.use(passport.initialize());
app.use(logger);

// Protect against NoSQL injection & prototype pollution on all request input
app.use(noSqlInjection);

// Global fallback limiter for all API routes (safety net)
app.use('/api', apiLimiter);

// ==============================================
// API Routes
// ==============================================
app.use('/api/users', userRoutes);
app.use('/api/hazards', hazardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analysis', analysisRoutes);
app.use("/uploads", express.static("uploads"));

// ==============================================
// Database Connection & Server Launch
// ==============================================
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');

    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
  });