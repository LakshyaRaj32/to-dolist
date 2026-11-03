// Central place for configuration read from environment variables.
const isServerless = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME); // Netlify Functions run on Lambda
const isProduction = process.env.NODE_ENV === 'production' || isServerless;

const DEV_JWT_SECRET = 'dev-only-insecure-jwt-secret';

const config = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGODB_URI,
  // A missing secret is only tolerated in local development and tests.
  jwtSecret: process.env.JWT_SECRET || (isProduction ? null : DEV_JWT_SECRET),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  isProduction,
  isTest: process.env.NODE_ENV === 'test',
};

function assertConfig() {
  if (!config.jwtSecret) throw new Error('JWT_SECRET must be set in production');
  if (!process.env.JWT_SECRET && !config.isTest) {
    console.warn('JWT_SECRET is not set — using an insecure development secret.');
  }
}

module.exports = { config, assertConfig };
