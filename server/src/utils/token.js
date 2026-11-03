const jwt = require('jsonwebtoken');
const { config } = require('../config/env');

const signToken = (user) =>
  jwt.sign({ sub: String(user._id) }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

const verifyToken = (token) => jwt.verify(token, config.jwtSecret);

module.exports = { signToken, verifyToken };
