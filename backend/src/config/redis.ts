import Redis from 'ioredis';
import { env } from './env';

export const redisConnection = new Redis(env.redisUrl, {
  maxRetriesPerRequest: null,
});

redisConnection.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});
