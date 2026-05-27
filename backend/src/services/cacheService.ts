import { redisConnection } from '../config/redis';
import type { GeneratedPaper } from '../types/assessment';

const CACHE_PREFIX = 'paper:';
const JOB_PREFIX = 'job:';
const TTL_SECONDS = 3600;

export async function cachePaper(assignmentId: string, paper: GeneratedPaper): Promise<void> {
  await redisConnection.setex(
    `${CACHE_PREFIX}${assignmentId}`,
    TTL_SECONDS,
    JSON.stringify(paper)
  );
}

export async function getCachedPaper(assignmentId: string): Promise<GeneratedPaper | null> {
  const data = await redisConnection.get(`${CACHE_PREFIX}${assignmentId}`);
  if (!data) return null;
  return JSON.parse(data) as GeneratedPaper;
}

export async function setJobState(
  assignmentId: string,
  state: { status: string; progress: number; message?: string }
): Promise<void> {
  await redisConnection.setex(`${JOB_PREFIX}${assignmentId}`, TTL_SECONDS, JSON.stringify(state));
}

export async function getJobState(assignmentId: string): Promise<{
  status: string;
  progress: number;
  message?: string;
} | null> {
  const data = await redisConnection.get(`${JOB_PREFIX}${assignmentId}`);
  if (!data) return null;
  return JSON.parse(data);
}
