import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate, generateTokens } from '../middleware/auth.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import { validate, registerSchema, loginSchema } from '../validators/schemas.js';

const router = Router();

router.post('/register', validate(registerSchema), catchAsync(async (req, res) => {
  const { email, username, password, displayName } = req.validatedBody;

  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    throw new AppError(
      existing.email === email ? 'Email already registered' : 'Username taken',
      409, 'DUPLICATE'
    );
  }

  const user = await User.create({
    email, username, password, displayName: displayName || username,
  });

  const tokens = generateTokens(user);
  const userJSON = user.toPublicJSON();

  user.refreshToken = tokens.refreshToken;
  await user.save();

  res.status(201).json({
    success: true,
    data: { user: userJSON, ...tokens },
  });
}));

router.post('/login', validate(loginSchema), (req, res, next) => {
  passport.authenticate('local', { session: false }, async (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ success: false, message: info.message });

    const tokens = generateTokens(user);
    const dbUser = await User.findById(user.id);
    if (dbUser) {
      dbUser.refreshToken = tokens.refreshToken;
      dbUser.isOnline = true;
      dbUser.lastSeen = new Date();
      await dbUser.save();
    }

    res.json({
      success: true,
      data: { user, ...tokens },
    });
  })(req, res, next);
});

router.post('/google', catchAsync(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) throw new AppError('Google ID token required', 400, 'VALIDATION');

  const decoded = jwt.decode(idToken);
  if (!decoded?.email) throw new AppError('Invalid Google token', 401, 'INVALID_TOKEN');

  let user = await User.findOne({
    $or: [{ providerId: decoded.sub }, { email: decoded.email }],
  });

  if (!user) {
    user = await User.create({
      email: decoded.email,
      username: `${decoded.given_name || 'user'}_${decoded.sub.slice(-6)}`,
      displayName: decoded.name,
      avatar: decoded.picture,
      provider: 'google',
      providerId: decoded.sub,
    });
  } else if (user.provider === 'local') {
    user.provider = 'google';
    user.providerId = decoded.sub;
    await user.save();
  }

  const tokens = generateTokens(user.toPublicJSON());
  res.json({
    success: true,
    data: { user: user.toPublicJSON(), ...tokens },
  });
}));

router.post('/refresh', catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError('Refresh token required', 400, 'VALIDATION');

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') throw new Error();

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      throw new Error();
    }

    const tokens = generateTokens(user.toPublicJSON());
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json({ success: true, data: tokens });
  } catch {
    throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
  }
}));

router.post('/logout', authenticate, catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (user) {
    user.refreshToken = null;
    user.isOnline = false;
    user.lastSeen = new Date();
    await user.save();
  }
  res.json({ success: true, message: 'Logged out' });
}));

router.get('/me', authenticate, catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('goals')
    .populate('groups', 'name coverImage memberCount');
  res.json({ success: true, data: user ? user.toPublicJSON() : req.user });
}));

router.put('/profile', authenticate, catchAsync(async (req, res) => {
  const allowed = ['displayName', 'bio', 'avatar'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
  res.json({ success: true, data: user.toPublicJSON() });
}));

export default router;
