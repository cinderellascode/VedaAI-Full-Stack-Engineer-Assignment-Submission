import mongoose, { Schema, Document } from 'mongoose';
import type { AssignmentInput, GeneratedPaper, JobStatus } from '../types/assessment';

export interface IAssignment extends Document {
  title: string;
  subject: string;
  grade?: string;
  dueDate: Date;
  questionTypes: string[];
  sections: AssignmentInput['sections'];
  additionalInstructions?: string;
  sourceText?: string;
  sourceFileName?: string;
  status: JobStatus;
  jobId?: string;
  error?: string;
  generatedPaper?: GeneratedPaper;
  createdAt: Date;
  updatedAt: Date;
}

const SectionConfigSchema = new Schema(
  {
    name: { type: String, required: true },
    questionCount: { type: Number, required: true },
    marksPerQuestion: { type: Number, required: true },
  },
  { _id: false }
);

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    grade: String,
    dueDate: { type: Date, required: true },
    questionTypes: [{ type: String, required: true }],
    sections: { type: [SectionConfigSchema], required: true },
    additionalInstructions: String,
    sourceText: String,
    sourceFileName: String,
    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed'],
      default: 'queued',
    },
    jobId: String,
    error: String,
    generatedPaper: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
