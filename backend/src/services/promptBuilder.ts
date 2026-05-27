import type { AssignmentInput } from '../types/assessment';

const QUESTION_TYPE_LABELS: Record<string, string> = {
  mcq: 'Multiple Choice (4 options)',
  short_answer: 'Short Answer',
  long_answer: 'Long Answer / Essay',
  true_false: 'True / False',
  fill_blank: 'Fill in the Blank',
};

export function buildGenerationPrompt(input: AssignmentInput): string {
  const sectionsDesc = input.sections
    .map(
      (s, i) =>
        `Section ${String.fromCharCode(65 + i)} ("${s.name}"): ${s.questionCount} questions, ${s.marksPerQuestion} marks each`
    )
    .join('\n');

  const typesList = input.questionTypes
    .map((t) => QUESTION_TYPE_LABELS[t] || t)
    .join(', ');

  return `You are an expert teacher creating a formal examination question paper.

SUBJECT: ${input.subject}
TITLE: ${input.title}
${input.grade ? `GRADE/CLASS: ${input.grade}` : ''}
DUE DATE CONTEXT: ${input.dueDate}

ALLOWED QUESTION TYPES: ${typesList}

SECTIONS TO GENERATE:
${sectionsDesc}

${input.additionalInstructions ? `TEACHER INSTRUCTIONS:\n${input.additionalInstructions}` : ''}

${input.sourceText ? `REFERENCE MATERIAL (use as context, do not copy verbatim):\n${input.sourceText.slice(0, 8000)}` : ''}

REQUIREMENTS:
1. Return ONLY valid JSON matching the schema below — no markdown, no commentary.
2. Each section must have a clear title (e.g., "Section A"), instruction (e.g., "Attempt all questions"), and questions array.
3. Distribute question types across sections as appropriate.
4. Assign difficulty: "easy", "medium", or "hard" to each question — vary within sections.
5. Marks per question must match the section config (${input.sections.map((s) => `${s.name}: ${s.marksPerQuestion}`).join(', ')}).
6. For MCQ, include exactly 4 options in the "options" array.
7. Questions must be original, academically sound, and exam-appropriate.

JSON SCHEMA:
{
  "title": "string",
  "subject": "string",
  "totalMarks": number,
  "sections": [
    {
      "id": "sec-a",
      "title": "Section A",
      "instruction": "Attempt all questions",
      "questions": [
        {
          "id": "q1",
          "text": "question text",
          "type": "mcq|short_answer|long_answer|true_false|fill_blank",
          "difficulty": "easy|medium|hard",
          "marks": number,
          "options": ["A", "B", "C", "D"]
        }
      ]
    }
  ]
}`;
}
