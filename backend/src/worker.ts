import mongoose from 'mongoose';
import { env } from './config/env';
import { startGenerationWorker } from './workers/generationWorker';

async function start() {
  await mongoose.connect(env.mongodbUri);
  console.log('Worker: MongoDB connected');
  startGenerationWorker();
}

start().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
