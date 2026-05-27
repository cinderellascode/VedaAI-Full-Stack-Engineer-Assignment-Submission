'use client';

import { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import type { GeneratedPaper } from '@/types/assessment';
import { DifficultyBadge } from '@/components/ui/DifficultyBadge';
import { getPdfDownloadUrl, regenerateAssignment } from '@/lib/api';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useRouter } from 'next/navigation';

interface Props {
  paper: GeneratedPaper;
  assignmentId: string;
}

export function QuestionPaper({ paper, assignmentId }: Props) {
  const router = useRouter();
  const { setJobStatus, setGeneratedPaper } = useAssignmentStore();
  const [student, setStudent] = useState({ name: '', rollNumber: '', section: '' });
  const [regenerating, setRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await regenerateAssignment(assignmentId);
      setGeneratedPaper(null);
      setJobStatus('queued', 0, 'Regenerating...');
      router.push(`/generate/${assignmentId}`);
    } catch {
      alert('Failed to regenerate');
    } finally {
      setRegenerating(false);
    }
  };

  const handleDownloadPdf = () => {
    window.open(getPdfDownloadUrl(assignmentId, student), '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-zinc-600">
          Model: {paper.metadata.model || 'AI'} · {paper.totalMarks} total marks
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="btn-secondary"
          >
            <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
          <button type="button" onClick={handleDownloadPdf} className="btn-primary">
            <Download className="h-4 w-4" />
            Download PDF
          </button>
        </div>
      </div>

      <article
        id="question-paper"
        className="mx-auto max-w-4xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-elevated sm:p-10 print:shadow-none print:border-zinc-300"
      >
        <header className="border-b-2 border-zinc-900 pb-6 text-center">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-zinc-900 sm:text-3xl">
            {paper.title}
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Subject: <span className="font-semibold">{paper.subject}</span>
            {' · '}
            Maximum Marks: <span className="font-semibold">{paper.totalMarks}</span>
          </p>
          <p className="mt-1 text-xs text-zinc-400">Time: 3 Hours · All questions carry marks as indicated</p>
        </header>

        <section className="mt-8 grid gap-6 border-b border-zinc-200 pb-8 sm:grid-cols-2">
          <StudentField
            label="Name"
            value={student.name}
            onChange={(v) => setStudent((s) => ({ ...s, name: v }))}
          />
          <StudentField
            label="Roll Number"
            value={student.rollNumber}
            onChange={(v) => setStudent((s) => ({ ...s, rollNumber: v }))}
          />
          <StudentField
            label="Section"
            value={student.section}
            onChange={(v) => setStudent((s) => ({ ...s, section: v }))}
          />
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Date
            </label>
            <div className="mt-1 border-b border-zinc-400 pb-1 text-sm text-zinc-400 print:text-transparent">
              _______________
            </div>
          </div>
        </section>

        {paper.sections.map((sec) => (
          <section key={sec.id} className="mt-10">
            <h2 className="font-display border-b border-zinc-300 pb-2 text-lg font-bold text-zinc-900">
              {sec.title}
            </h2>
            <p className="mt-2 text-sm italic text-zinc-600">{sec.instruction}</p>

            <ol className="mt-6 list-none space-y-8">
              {sec.questions.map((q, qi) => (
                <li key={q.id} className="break-inside-avoid">
                  <div className="flex flex-wrap items-start gap-2 sm:gap-3">
                    <span className="font-bold text-zinc-900">Q{qi + 1}.</span>
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                      <DifficultyBadge difficulty={q.difficulty} />
                      <span className="ml-auto text-sm font-medium text-zinc-500">
                        [{q.marks} {q.marks === 1 ? 'mark' : 'marks'}]
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 pl-0 text-[15px] leading-relaxed text-zinc-800 sm:pl-8">
                    {q.text}
                  </p>
                  {q.options && q.options.length > 0 && (
                    <ul className="mt-3 space-y-1.5 pl-6 sm:pl-10">
                      {q.options.map((opt, oi) => (
                        <li key={oi} className="flex gap-2 text-sm text-zinc-700">
                          <span className="font-semibold">
                            {String.fromCharCode(65 + oi)}.
                          </span>
                          {opt}
                        </li>
                      ))}
                    </ul>
                  )}
                  {!q.options?.length && (
                    <div className="mt-4 h-16 border-b border-dotted border-zinc-300 sm:ml-8" />
                  )}
                </li>
              ))}
            </ol>
          </section>
        ))}

        <footer className="mt-12 border-t border-zinc-200 pt-6 text-center text-xs text-zinc-400">
          — End of Question Paper —
        </footer>
      </article>
    </div>
  );
}

function StudentField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border-0 border-b border-zinc-400 bg-transparent pb-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-0 print:border-zinc-600"
        placeholder=""
      />
    </div>
  );
}
