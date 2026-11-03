const mongoose = require('mongoose');

let connecting = null;

// Reuses one connection per process; serverless invocations share it while warm.
async function connectDB(uri) {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!uri) throw new Error('MONGODB_URI is not set');
  if (!connecting) {
    connecting = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 8000 })
      .catch((err) => {
        connecting = null;
        throw err;
      });
  }
  await connecting;
  return mongoose.connection;
}

module.exports = { connectDB };
