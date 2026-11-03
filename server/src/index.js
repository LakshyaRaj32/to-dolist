const { createApp } = require('./app');
const { connectDB } = require('./config/db');
const { config } = require('./config/env');

async function start(uri = config.mongoUri) {
  const app = createApp(); // validates config before connecting
  await connectDB(uri);
  const server = app.listen(config.port, () =>
    console.log(`API listening on http://localhost:${config.port}`)
  );
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${config.port} is already in use — stop the other process or set PORT.`);
    } else {
      console.error('Server error:', err.message);
    }
    process.exit(1);
  });
}

if (require.main === module) {
  start().catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
}

module.exports = { start };
