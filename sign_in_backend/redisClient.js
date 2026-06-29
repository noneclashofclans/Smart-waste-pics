const { createClient } = require('redis');

let client;

async function getRedisClient() {
  if (client) return client;

  const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

  client = createClient({
    url: REDIS_URL,
  });

  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  
  await client.connect();
  return client;
}

module.exports = { getRedisClient };

