import http from 'http';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { env } from './config/env';
import { assignmentsRouter } from './routes/assignments';
import { wsManager } from './websocket/manager';

const app = express();

app.use(
  cors({
    origin: [env.frontendUrl, 'http://localhost:3000'],
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', mockAi: env.useMockAi });
});

app.use('/api/assignments', assignmentsRouter);

const server = http.createServer(app);
wsManager.init(server);

async function start() {
  try {
    await mongoose.connect(env.mongodbUri);
    console.log('MongoDB connected');

    server.listen(env.port, () => {
      console.log(`API server running on http://localhost:${env.port}`);
      console.log(`WebSocket: ws://localhost:${env.port}/ws?assignmentId=<id>`);
      if (env.useMockAi) console.log('Using MOCK AI (set OPENAI_API_KEY for real generation)');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
