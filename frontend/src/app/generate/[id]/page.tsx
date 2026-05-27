'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { GenerationProgress, GenerationCompleteBanner } from '@/components/GenerationProgress';
import { QuestionPaper } from '@/components/QuestionPaper';
import { getAssignment } from '@/lib/api';
import { assignmentWs } from '@/lib/websocket';
import { useAssignmentStore } from '@/store/assignmentStore';
import type { WsMessage } from '@/types/assessment';

export default function GeneratePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const {
    jobStatus,
    generatedPaper,
    setAssignmentId,
    setJobStatus,
    setGeneratedPaper,
    setWsConnected,
  } = useAssignmentStore();

  useEffect(() => {
    if (!id) return;
    setAssignmentId(id);

    const load = async () => {
      try {
        const data = await getAssignment(id);
        setJobStatus(data.status, data.jobState?.progress ?? 0, data.jobState?.message);
        if (data.generatedPaper) {
          setGeneratedPaper(data.generatedPaper);
          if (data.status === 'completed') {
            router.replace(`/output/${id}`);
          }
        }
      } catch {
        console.error('Failed to load assignment');
      }
    };

    load();

    assignmentWs.connect(id);
    const unsub = assignmentWs.subscribe((msg: WsMessage) => {
      if (msg.type === 'connected') {
        setWsConnected(true);
      }
      if (msg.type === 'job:update') {
        setJobStatus(msg.status!, msg.progress ?? 0, msg.message);
      }
      if (msg.type === 'job:complete' && msg.paper) {
        setJobStatus('completed', 100, 'Done');
        setGeneratedPaper(msg.paper);
        router.replace(`/output/${id}`);
      }
      if (msg.type === 'job:error') {
        setJobStatus('failed', 0, msg.error);
      }
    });

    return () => {
      unsub();
      assignmentWs.disconnect();
      setWsConnected(false);
    };
  }, [id, router, setAssignmentId, setGeneratedPaper, setJobStatus, setWsConnected]);

  if (jobStatus === 'failed') {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-xl font-bold">Generation Failed</h2>
        <p className="mt-2 text-zinc-600">Please try again from the create page.</p>
        <button onClick={() => router.push('/')} className="btn-primary mt-6">
          Back to Create
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <GenerationProgress />
      <GenerationCompleteBanner />

      {generatedPaper ? (
        <QuestionPaper paper={generatedPaper} assignmentId={id} />
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-card">
          <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-brand-100" />
          <p className="mt-6 font-medium text-zinc-700">
            Your question paper is being crafted...
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            You&apos;ll be redirected automatically when ready.
          </p>
        </div>
      )}
    </div>
  );
}
