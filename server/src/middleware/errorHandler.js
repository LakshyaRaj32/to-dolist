const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Central error handler: every error becomes `{ error, errors? }` JSON.
 * Stack traces are logged on the server and never sent to clients.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  let status = 500;
  let body = { error: 'Internal server error' };

  if (err instanceof ApiError) {
    status = err.status;
    body = { error: err.message, ...(err.errors && { errors: err.errors }) };
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    const errors = Object.fromEntries(Object.entries(err.errors).map(([field, e]) => [field, e.message]));
    body = { error: 'Validation failed', errors };
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    body = { error: `Invalid value for "${err.path}"` };
  } else if (err?.code === 11000) {
    status = 409;
    body = { error: 'Duplicate value' };
  } else if (err?.type === 'entity.parse.failed') {
    status = 400;
    body = { error: 'Malformed JSON body' };
  } else if (err?.type === 'entity.too.large') {
    status = 413;
    body = { error: 'Request body too large' };
  }

  if (status >= 500) console.error(err);
  res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
