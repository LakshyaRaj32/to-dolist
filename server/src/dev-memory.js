// Runs the API against a throwaway in-memory MongoDB — no local install needed.
const { MongoMemoryServer } = require('mongodb-memory-server');
const { start } = require('./index');

(async () => {
  const mongo = await MongoMemoryServer.create();
  console.log('In-memory MongoDB started (data is lost on restart)');
  await start(mongo.getUri('todolist'));
})();
