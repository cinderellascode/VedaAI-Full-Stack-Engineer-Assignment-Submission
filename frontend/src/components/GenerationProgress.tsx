'use client';

import { CheckCircle2, Loader2, Wifi, WifiOff } from 'lucide-react';
import { useAssignmentStore } from '@/store/assignmentStore';

export function GenerationProgress() {
  const { jobStatus, progress, statusMessage, wsConnected } = useAssignmentStore();

  if (!jobStatus || jobStatus === 'completed') return null;

  return (
    <div className="mb-8 rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 to-white p-6 shadow-card">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-zinc-900">
              Generating your question paper...
            </h3>
            <span title={wsConnected ? 'Live updates connected' : 'Connecting...'}>
              {wsConnected ? (
                <Wifi className="h-4 w-4 text-emerald-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-zinc-400" />
              )}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-600">{statusMessage || 'Please wait'}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-zinc-500">{progress}% complete</p>
        </div>
      </div>
    </div>
  );
}

export function GenerationCompleteBanner() {
  const { jobStatus } = useAssignmentStore();
  if (jobStatus !== 'completed') return null;

  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      <CheckCircle2 className="h-5 w-5 shrink-0" />
      Question paper generated successfully!
    </div>
  );
}
