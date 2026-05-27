import { z } from 'zod';

export const QuestionTypeSchema = z.enum([
  'mcq',
  'short_answer',
  'long_answer',
  'true_false',
  'fill_blank',
]);

export const AssignmentInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subject: z.string().min(1, 'Subject is required'),
  grade: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  questionTypes: z.array(QuestionTypeSchema).min(1, 'Select at least one question type'),
  sections: z.array(
    z.object({
      name: z.string().min(1),
      questionCount: z.number().int().positive('Question count must be positive'),
      marksPerQuestion: z.number().positive('Marks must be positive'),
    })
  ).min(1, 'At least one section is required'),
  additionalInstructions: z.string().optional(),
  sourceText: z.string().optional(),
});

export type AssignmentInput = z.infer<typeof AssignmentInputSchema>;

export const DifficultySchema = z.enum(['easy', 'medium', 'hard']);

export const GeneratedQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  type: QuestionTypeSchema,
  difficulty: DifficultySchema,
  marks: z.number().positive(),
  options: z.array(z.string()).optional(),
});

export const GeneratedSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  instruction: z.string(),
  questions: z.array(GeneratedQuestionSchema),
});

export const GeneratedPaperSchema = z.object({
  title: z.string(),
  subject: z.string(),
  totalMarks: z.number(),
  sections: z.array(GeneratedSectionSchema),
  metadata: z.object({
    generatedAt: z.string(),
    model: z.string().optional(),
  }),
});

export type GeneratedPaper = z.infer<typeof GeneratedPaperSchema>;
export type GeneratedSection = z.infer<typeof GeneratedSectionSchema>;
export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';
