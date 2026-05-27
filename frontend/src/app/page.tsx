import { AssignmentForm } from '@/components/AssignmentForm';
import { BookOpen, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-sm font-medium text-brand-700">
          <Zap className="h-4 w-4" />
          AI-Powered Assessment Creator
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Create Your Assignment
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-zinc-600">
          Configure sections, question types, and marks — then let AI generate a
          structured, exam-ready question paper in seconds.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: BookOpen, title: 'Structured Output', desc: 'Sections A, B, C with marks & difficulty' },
          { icon: Zap, title: 'Real-time Updates', desc: 'WebSocket progress while AI generates' },
          { icon: BookOpen, title: 'Export Ready', desc: 'Download professionally formatted PDF' },
        ].map((item, i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-100 bg-white p-4 text-center shadow-sm"
          >
            <item.icon className="mx-auto mb-2 h-5 w-5 text-brand-500" />
            <p className="text-sm font-semibold text-zinc-800">{item.title}</p>
            <p className="mt-1 text-xs text-zinc-500">{item.desc}</p>
          </div>
        ))}
      </div>

      <AssignmentForm />
    </div>
  );
}
