const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { config, assertConfig } = require('./config/env');
const apiRoutes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  assertConfig();
  const app = express();

  app.set('trust proxy', 1); // behind Netlify / a load balancer: needed for correct client IPs (rate limiting)
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '100kb' }));

  // "/.netlify/functions/api" is the path seen when running as a Netlify Function.
  app.use(['/api', '/.netlify/functions/api'], apiRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
