import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { GENERATION_QUEUE, type GenerationJobData } from '../queues/generationQueue';
import { Assignment } from '../models/Assignment';
import { generateQuestionPaper } from '../services/aiService';
import { cachePaper, setJobState } from '../services/cacheService';
import { wsManager } from '../websocket/manager';

async function processJob(job: Job<GenerationJobData>) {
  const { assignmentId, input } = job.data;

  await setJobState(assignmentId, { status: 'processing', progress: 10, message: 'Starting generation...' });
  wsManager.notifyProgress(assignmentId, 'processing', 10, 'Starting generation...');
  await Assignment.findByIdAndUpdate(assignmentId, { status: 'processing' });

  await job.updateProgress(30);
  await setJobState(assignmentId, { status: 'processing', progress: 30, message: 'Building prompt...' });
  wsManager.notifyProgress(assignmentId, 'processing', 30, 'Building prompt...');

  await job.updateProgress(50);
  await setJobState(assignmentId, { status: 'processing', progress: 50, message: 'AI is generating questions...' });
  wsManager.notifyProgress(assignmentId, 'processing', 50, 'AI is generating questions...');

  const paper = await generateQuestionPaper(input);

  await job.updateProgress(80);
  await setJobState(assignmentId, { status: 'processing', progress: 80, message: 'Validating output...' });
  wsManager.notifyProgress(assignmentId, 'processing', 80, 'Validating output...');

  await cachePaper(assignmentId, paper);

  await Assignment.findByIdAndUpdate(assignmentId, {
    status: 'completed',
    generatedPaper: paper,
  });

  await setJobState(assignmentId, { status: 'completed', progress: 100, message: 'Done' });
  wsManager.notifyComplete(assignmentId, paper);

  return paper;
}

export function startGenerationWorker() {
  const worker = new Worker<GenerationJobData>(GENERATION_QUEUE, processJob, {
    connection: redisConnection,
    concurrency: 2,
  });

  worker.on('failed', async (job, err) => {
    if (!job?.data?.assignmentId) return;
    const { assignmentId } = job.data;
    const message = err.message || 'Generation failed';

    await Assignment.findByIdAndUpdate(assignmentId, {
      status: 'failed',
      error: message,
    });
    await setJobState(assignmentId, { status: 'failed', progress: 0, message });
    wsManager.notifyError(assignmentId, message);
  });

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed for assignment ${job.data.assignmentId}`);
  });

  console.log('Generation worker started');
  return worker;
}
