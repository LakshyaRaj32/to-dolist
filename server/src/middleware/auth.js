const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/token');

/** Requires `Authorization: Bearer <jwt>` and sets `req.user = { id }`. */
function requireAuth(req, _res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) return next(ApiError.unauthorized());
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub };
    next();
  } catch (err) {
    next(ApiError.unauthorized(err.name === 'TokenExpiredError' ? 'Session expired, please log in again' : 'Invalid token'));
  }
}

module.exports = { requireAuth };
