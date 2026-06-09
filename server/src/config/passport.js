import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

const configurePassport = () => {
  passport.use(
    new LocalStrategy(
      { usernameField: 'email', passwordField: 'password' },
      async (email, password, done) => {
        try {
          const user = await User.findOne({ email }).select('+password');
          if (!user) return done(null, false, { message: 'Invalid email or password' });
          if (user.provider !== 'local') return done(null, false, { message: 'Use Google login' });
          const isMatch = await user.comparePassword(password);
          if (!isMatch) return done(null, false, { message: 'Invalid email or password' });
          return done(null, user.toPublicJSON());
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET,
      },
      async (payload, done) => {
        try {
          const user = await User.findById(payload.id);
          if (!user) return done(null, false);
          return done(null, user.toPublicJSON());
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  if (process.env.GOOGLE_CLIENT_ID) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            let user = await User.findOne({
              $or: [{ providerId: profile.id }, { email: profile.emails?.[0]?.value }],
            });
            if (user) {
              if (user.provider === 'local') {
                user.provider = 'google';
                user.providerId = profile.id;
                await user.save();
              }
              return done(null, user.toPublicJSON());
            }
            user = await User.create({
              email: profile.emails?.[0]?.value || `${profile.id}@google.auth`,
              username: `${profile.name?.givenName || 'user'}_${profile.id.slice(-6)}`,
              displayName: profile.displayName,
              avatar: profile.photos?.[0]?.value || undefined,
              provider: 'google',
              providerId: profile.id,
            });
            return done(null, user.toPublicJSON());
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user ? user.toPublicJSON() : null);
    } catch (error) {
      done(error);
    }
  });
};

export default configurePassport;
