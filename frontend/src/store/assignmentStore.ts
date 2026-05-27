import { create } from 'zustand';
import type {
  AssignmentFormData,
  GeneratedPaper,
  JobStatus,
  QuestionType,
  SectionConfig,
} from '@/types/assessment';

const defaultSection = (): SectionConfig => ({
  name: 'Objective Questions',
  questionCount: 5,
  marksPerQuestion: 2,
});

const initialForm: AssignmentFormData = {
  title: '',
  subject: '',
  grade: '',
  dueDate: '',
  questionTypes: ['mcq', 'short_answer'],
  sections: [defaultSection()],
  additionalInstructions: '',
  file: null,
};

interface AssignmentState {
  form: AssignmentFormData;
  errors: Record<string, string>;
  assignmentId: string | null;
  jobStatus: JobStatus | null;
  progress: number;
  statusMessage: string;
  generatedPaper: GeneratedPaper | null;
  wsConnected: boolean;

  setField: <K extends keyof AssignmentFormData>(
    key: K,
    value: AssignmentFormData[K]
  ) => void;
  toggleQuestionType: (type: QuestionType) => void;
  addSection: () => void;
  removeSection: (index: number) => void;
  updateSection: (index: number, patch: Partial<SectionConfig>) => void;
  validate: () => boolean;
  resetForm: () => void;
  setAssignmentId: (id: string | null) => void;
  setJobStatus: (status: JobStatus, progress?: number, message?: string) => void;
  setGeneratedPaper: (paper: GeneratedPaper | null) => void;
  setWsConnected: (connected: boolean) => void;
  setError: (key: string, message: string) => void;
  clearErrors: () => void;
}

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  form: { ...initialForm },
  errors: {},
  assignmentId: null,
  jobStatus: null,
  progress: 0,
  statusMessage: '',
  generatedPaper: null,
  wsConnected: false,

  setField: (key, value) =>
    set((s) => ({ form: { ...s.form, [key]: value }, errors: { ...s.errors, [key]: '' } })),

  toggleQuestionType: (type) =>
    set((s) => {
      const types = s.form.questionTypes.includes(type)
        ? s.form.questionTypes.filter((t) => t !== type)
        : [...s.form.questionTypes, type];
      return { form: { ...s.form, questionTypes: types } };
    }),

  addSection: () =>
    set((s) => ({
      form: {
        ...s.form,
        sections: [
          ...s.form.sections,
          {
            name: `Section ${String.fromCharCode(65 + s.form.sections.length)}`,
            questionCount: 3,
            marksPerQuestion: 5,
          },
        ],
      },
    })),

  removeSection: (index) =>
    set((s) => ({
      form: {
        ...s.form,
        sections: s.form.sections.filter((_, i) => i !== index),
      },
    })),

  updateSection: (index, patch) =>
    set((s) => ({
      form: {
        ...s.form,
        sections: s.form.sections.map((sec, i) =>
          i === index ? { ...sec, ...patch } : sec
        ),
      },
    })),

  validate: () => {
    const { form } = get();
    const errors: Record<string, string> = {};

    if (!form.title.trim()) errors.title = 'Title is required';
    if (!form.subject.trim()) errors.subject = 'Subject is required';
    if (!form.dueDate) errors.dueDate = 'Due date is required';
    else if (new Date(form.dueDate) < new Date(new Date().toDateString())) {
      errors.dueDate = 'Due date cannot be in the past';
    }
    if (form.questionTypes.length === 0) {
      errors.questionTypes = 'Select at least one question type';
    }

    form.sections.forEach((sec, i) => {
      if (!sec.name.trim()) errors[`section-${i}-name`] = 'Section name required';
      if (sec.questionCount <= 0 || !Number.isInteger(sec.questionCount)) {
        errors[`section-${i}-count`] = 'Must be a positive whole number';
      }
      if (sec.marksPerQuestion <= 0) {
        errors[`section-${i}-marks`] = 'Marks must be positive';
      }
    });

    if (form.sections.length === 0) errors.sections = 'Add at least one section';

    set({ errors });
    return Object.keys(errors).length === 0;
  },

  resetForm: () =>
    set({
      form: { ...initialForm, sections: [defaultSection()] },
      errors: {},
    }),

  setAssignmentId: (id) => set({ assignmentId: id }),
  setJobStatus: (status, progress = 0, message = '') =>
    set({ jobStatus: status, progress, statusMessage: message }),
  setGeneratedPaper: (paper) => set({ generatedPaper: paper }),
  setWsConnected: (connected) => set({ wsConnected: connected }),
  setError: (key, message) => set((s) => ({ errors: { ...s.errors, [key]: message } })),
  clearErrors: () => set({ errors: {} }),
}));
