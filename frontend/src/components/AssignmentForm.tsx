'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  FileUp,
  Loader2,
  Plus,
  Trash2,
  Wand2,
} from 'lucide-react';
import { useAssignmentStore } from '@/store/assignmentStore';
import { createAssignment } from '@/lib/api';
import type { QuestionType } from '@/types/assessment';

const QUESTION_TYPES: { id: QuestionType; label: string }[] = [
  { id: 'mcq', label: 'Multiple Choice' },
  { id: 'short_answer', label: 'Short Answer' },
  { id: 'long_answer', label: 'Long Answer' },
  { id: 'true_false', label: 'True / False' },
  { id: 'fill_blank', label: 'Fill in the Blank' },
];

export function AssignmentForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    form,
    errors,
    setField,
    toggleQuestionType,
    addSection,
    removeSection,
    updateSection,
    validate,
    setAssignmentId,
    setJobStatus,
  } = useAssignmentStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setField('file', file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const result = await createAssignment(form);
      setAssignmentId(result.id);
      setJobStatus('queued', 0, 'Queued for generation...');
      router.push(`/generate/${result.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-card sm:p-8">
        <h2 className="font-display mb-6 text-xl font-bold text-zinc-900">
          Assignment Details
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label-text">Title *</label>
            <input
              className="input-field"
              placeholder="e.g. Mid-Term Physics Assessment"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
            />
            {errors.title && <p className="error-text">{errors.title}</p>}
          </div>
          <div>
            <label className="label-text">Subject *</label>
            <input
              className="input-field"
              placeholder="e.g. Physics"
              value={form.subject}
              onChange={(e) => setField('subject', e.target.value)}
            />
            {errors.subject && <p className="error-text">{errors.subject}</p>}
          </div>
          <div>
            <label className="label-text">Grade / Class</label>
            <input
              className="input-field"
              placeholder="e.g. Class 10"
              value={form.grade}
              onChange={(e) => setField('grade', e.target.value)}
            />
          </div>
          <div>
            <label className="label-text flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-zinc-400" />
              Due Date *
            </label>
            <input
              type="date"
              className="input-field"
              value={form.dueDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setField('dueDate', e.target.value)}
            />
            {errors.dueDate && <p className="error-text">{errors.dueDate}</p>}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-card sm:p-8">
        <h2 className="font-display mb-2 text-xl font-bold text-zinc-900">
          Reference Material
        </h2>
        <p className="mb-5 text-sm text-zinc-500">Optional — upload PDF or text to guide AI</p>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-10 transition hover:border-brand-400 hover:bg-brand-50/30">
          <FileUp className="mb-3 h-10 w-10 text-brand-500" />
          <span className="text-sm font-medium text-zinc-700">
            {form.file ? form.file.name : 'Drop PDF or .txt file, or click to browse'}
          </span>
          <span className="mt-1 text-xs text-zinc-400">Max 10MB</span>
          <input
            type="file"
            accept=".pdf,.txt,text/plain,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-card sm:p-8">
        <h2 className="font-display mb-6 text-xl font-bold text-zinc-900">Question Types *</h2>
        <div className="flex flex-wrap gap-2">
          {QUESTION_TYPES.map((qt) => {
            const active = form.questionTypes.includes(qt.id);
            return (
              <button
                key={qt.id}
                type="button"
                onClick={() => toggleQuestionType(qt.id)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  active
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                }`}
              >
                {qt.label}
              </button>
            );
          })}
        </div>
        {errors.questionTypes && (
          <p className="error-text mt-2">{errors.questionTypes}</p>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-card sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-zinc-900">
            Sections & Marks
          </h2>
          <button type="button" onClick={addSection} className="btn-secondary text-xs">
            <Plus className="h-4 w-4" />
            Add Section
          </button>
        </div>

        <div className="space-y-4">
          {form.sections.map((sec, i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 sm:p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-brand-600">
                  Section {String.fromCharCode(65 + i)}
                </span>
                {form.sections.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSection(i)}
                    className="text-zinc-400 hover:text-red-500"
                    aria-label="Remove section"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label className="label-text">Section Name</label>
                  <input
                    className="input-field"
                    value={sec.name}
                    onChange={(e) => updateSection(i, { name: e.target.value })}
                  />
                  {errors[`section-${i}-name`] && (
                    <p className="error-text">{errors[`section-${i}-name`]}</p>
                  )}
                </div>
                <div>
                  <label className="label-text">No. of Questions</label>
                  <input
                    type="number"
                    min={1}
                    className="input-field"
                    value={sec.questionCount}
                    onChange={(e) =>
                      updateSection(i, { questionCount: parseInt(e.target.value, 10) || 0 })
                    }
                  />
                  {errors[`section-${i}-count`] && (
                    <p className="error-text">{errors[`section-${i}-count`]}</p>
                  )}
                </div>
                <div>
                  <label className="label-text">Marks per Question</label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    className="input-field"
                    value={sec.marksPerQuestion}
                    onChange={(e) =>
                      updateSection(i, {
                        marksPerQuestion: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  {errors[`section-${i}-marks`] && (
                    <p className="error-text">{errors[`section-${i}-marks`]}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-card sm:p-8">
        <h2 className="font-display mb-4 text-xl font-bold text-zinc-900">
          Additional Instructions
        </h2>
        <textarea
          className="input-field min-h-[120px] resize-y"
          placeholder="e.g. Focus on thermodynamics, include diagram-based questions, avoid duplicates..."
          value={form.additionalInstructions}
          onChange={(e) => setField('additionalInstructions', e.target.value)}
        />
      </section>

      {submitError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={submitting} className="btn-primary min-w-[200px]">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Generate Question Paper
            </>
          )}
        </button>
      </div>
    </form>
  );
}
