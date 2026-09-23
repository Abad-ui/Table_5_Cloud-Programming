const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel');

// ================================
// Google Strategy Setup (CONDITIONAL)
// Only initialize if credentials exist
// ================================
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/users/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({ email: profile.emails[0].value });

          // If not found, create a new user with Google credentials
          if (!user) {
            user = await User.create({
              username: profile.displayName,
              email: profile.emails[0].value,
              authProvider: 'google',
              isVerified: true, // Google users are auto-verified
            });
          }

          // Return authenticated user
          return done(null, user);
        } catch (err) {
          // Handle authentication or DB errors
          return done(err, null);
        }
      }
    )
  );

  // ================================
  // Serialize User
  // ================================
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // ================================
  // Deserialize User
  // ================================
  passport.deserializeUser((id, done) => {
    User.findById(id)
      .then((user) => done(null, user))
      .catch((err) => done(err, null));
  });

  console.log('✅ Google OAuth Strategy initialized');
} else {
  console.log('⚠️ Google OAuth not configured - skipping (add GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET to .env)');
}

// ================================
// Exported Passport Configuration
// ================================
module.exports = passport;