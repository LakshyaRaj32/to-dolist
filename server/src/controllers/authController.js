const bcrypt = require('bcryptjs');
const { User } = require('../models/User');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/token');
const { removeStaleGuests } = require('../services/guestCleanup');

const SALT_ROUNDS = 10;

const session = (user) => ({ token: signToken(user), user });

async function register(req, res) {
  const { name, email, password } = req.valid.body;
  if (await User.exists({ email })) throw ApiError.conflict('An account with this email already exists');
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, SALT_ROUNDS) });
  res.status(201).json(session(user));
}

async function login(req, res) {
  const { email, password } = req.valid.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  // Same message for unknown email and wrong password, so accounts can't be discovered.
  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  res.json(session(user));
}

/** "Get Started": a private guest account, no sign-up form. */
async function createGuest(_req, res) {
  const user = await User.create({ name: 'Guest', isGuest: true });
  // Opportunistic housekeeping; never blocks or fails the request.
  removeStaleGuests().catch((err) => console.error('Guest cleanup failed:', err.message));
  res.status(201).json(session(user));
}

/** Turns the current guest into a full account, keeping all of their tasks. */
async function upgradeGuest(req, res) {
  const { name, email, password } = req.valid.body;
  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  if (!user.isGuest) throw ApiError.conflict('This account is already saved');
  if (await User.exists({ email })) throw ApiError.conflict('An account with this email already exists');

  user.set({ name, email, passwordHash: await bcrypt.hash(password, SALT_ROUNDS), isGuest: false });
  await user.save();
  res.json(session(user));
}

async function me(req, res) {
  const user = await User.findByIdAndUpdate(req.user.id, { lastActiveAt: new Date() }, { new: true });
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  res.json({ user });
}

module.exports = { register, login, createGuest, upgradeGuest, me };
