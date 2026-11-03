const express = require('express');
const { requireAuth } = require('../middleware/auth');
const authRoutes = require('./authRoutes');
const taskRoutes = require('./taskRoutes');

const router = express.Router();

router.get('/health', (_req, res) => res.json({ ok: true }));
router.use('/auth', authRoutes);
router.use('/tasks', requireAuth, taskRoutes);

module.exports = router;
