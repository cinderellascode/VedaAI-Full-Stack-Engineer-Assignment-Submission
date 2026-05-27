export type QuestionType =
  | 'mcq'
  | 'short_answer'
  | 'long_answer'
  | 'true_false'
  | 'fill_blank';

export interface SectionConfig {
  name: string;
  questionCount: number;
  marksPerQuestion: number;
}

export interface AssignmentFormData {
  title: string;
  subject: string;
  grade: string;
  dueDate: string;
  questionTypes: QuestionType[];
  sections: SectionConfig[];
  additionalInstructions: string;
  file: File | null;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GeneratedQuestion {
  id: string;
  text: string;
  type: QuestionType;
  difficulty: Difficulty;
  marks: number;
  options?: string[];
}

export interface GeneratedSection {
  id: string;
  title: string;
  instruction: string;
  questions: GeneratedQuestion[];
}

export interface GeneratedPaper {
  title: string;
  subject: string;
  totalMarks: number;
  sections: GeneratedSection[];
  metadata: {
    generatedAt: string;
    model?: string;
  };
}

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface WsMessage {
  type: 'job:update' | 'job:complete' | 'job:error' | 'connected';
  assignmentId: string;
  status?: JobStatus;
  progress?: number;
  message?: string;
  paper?: GeneratedPaper;
  error?: string;
}
