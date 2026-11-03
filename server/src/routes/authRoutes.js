const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { authLimiter, guestLimiter } = require('../middleware/rateLimit');
const auth = require('../controllers/authController');
const schemas = require('../validators/authSchemas');

const router = express.Router();

router.post('/register', authLimiter, validate({ body: schemas.register }), asyncHandler(auth.register));
router.post('/login', authLimiter, validate({ body: schemas.login }), asyncHandler(auth.login));
router.post('/guest', guestLimiter, asyncHandler(auth.createGuest));
router.post('/upgrade', requireAuth, authLimiter, validate({ body: schemas.register }), asyncHandler(auth.upgradeGuest));
router.get('/me', requireAuth, asyncHandler(auth.me));

module.exports = router;
