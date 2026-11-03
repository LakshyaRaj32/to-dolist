const serverless = require('serverless-http');
const { createApp } = require('../../server/src/app');
const { connectDB } = require('../../server/src/config/db');
const { config } = require('../../server/src/config/env');

const app = createApp();
const handler = serverless(app);

module.exports.handler = async (event, context) => {
  // Keep the Mongo connection alive between warm invocations.
  context.callbackWaitsForEmptyEventLoop = false;
  await connectDB(config.mongoUri);
  return handler(event, context);
};
