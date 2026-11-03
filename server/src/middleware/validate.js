const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

/**
 * Validates and sanitizes request parts with zod schemas.
 * Parsed values are exposed as `req.valid.body` / `req.valid.query`; unknown fields are stripped.
 */
const validate = (schemas) => (req, _res, next) => {
  const errors = {};
  req.valid = {};
  for (const part of ['query', 'body']) {
    if (!schemas[part]) continue;
    const result = schemas[part].safeParse(req[part] ?? {});
    if (result.success) {
      req.valid[part] = result.data;
    } else {
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || part;
        errors[key] ??= issue.message;
      }
    }
  }
  if (Object.keys(errors).length > 0) return next(ApiError.badRequest('Validation failed', errors));
  next();
};

/** Malformed ids are treated as "not found" so ids can't be probed. */
const validateObjectId = (param, label) => (req, _res, next) =>
  mongoose.isValidObjectId(req.params[param]) ? next() : next(ApiError.notFound(`${label} not found`));

module.exports = { validate, validateObjectId };
