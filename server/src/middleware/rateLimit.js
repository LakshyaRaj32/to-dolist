const rateLimit = require('express-rate-limit');
const { config } = require('../config/env');

const limiter = (limit, windowMs) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => config.isTest,
    handler: (_req, res) => res.status(429).json({ error: 'Too many attempts, please try again in a few minutes' }),
  });

// Slows down password guessing on login/register. (In-memory store: per instance.)
const authLimiter = limiter(20, 15 * 60 * 1000);
// Stops scripts from creating guest accounts in bulk.
const guestLimiter = limiter(30, 60 * 60 * 1000);

module.exports = { authLimiter, guestLimiter };
