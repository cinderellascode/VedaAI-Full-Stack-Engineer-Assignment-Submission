import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';
import type { AssignmentInput } from '../types/assessment';

export const GENERATION_QUEUE = 'assessment-generation';

export interface GenerationJobData {
  assignmentId: string;
  input: AssignmentInput;
}

export const generationQueue = new Queue<GenerationJobData>(GENERATION_QUEUE, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});
