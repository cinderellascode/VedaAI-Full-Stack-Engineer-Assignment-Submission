'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { QuestionPaper } from '@/components/QuestionPaper';
import { getAssignment } from '@/lib/api';
import { useAssignmentStore } from '@/store/assignmentStore';
import type { GeneratedPaper } from '@/types/assessment';

export default function OutputPage() {
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [paper, setPaper] = useState<GeneratedPaper | null>(null);
  const { setAssignmentId } = useAssignmentStore();

  useEffect(() => {
    if (!id) return;
    setAssignmentId(id);

    getAssignment(id)
      .then((data) => {
        if (data.generatedPaper) setPaper(data.generatedPaper);
      })
      .finally(() => setLoading(false));
  }, [id, setAssignmentId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-zinc-600">Question paper not found or still generating.</p>
        <Link href={`/generate/${id}`} className="btn-primary mt-4 inline-flex">
          View Progress
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/"
        className="no-print mb-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Create New Assignment
      </Link>
      <QuestionPaper paper={paper} assignmentId={id} />
    </div>
  );
}
