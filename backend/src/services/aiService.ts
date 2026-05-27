import OpenAI from 'openai';
import { env } from '../config/env';
import { buildGenerationPrompt } from './promptBuilder';
import {
  GeneratedPaperSchema,
  type AssignmentInput,
  type GeneratedPaper,
} from '../types/assessment';

const openai = env.openaiApiKey
  ? new OpenAI({ apiKey: env.openaiApiKey, baseURL: env.openaiBaseUrl })
  : null;

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = fenceMatch ? fenceMatch[1].trim() : trimmed;
  const start = jsonStr.indexOf('{');
  const end = jsonStr.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found in LLM response');
  return JSON.parse(jsonStr.slice(start, end + 1));
}

function normalizePaper(raw: Record<string, unknown>, input: AssignmentInput): GeneratedPaper {
  const sections = (raw.sections as Array<Record<string, unknown>>) || [];
  const normalized = {
    title: (raw.title as string) || input.title,
    subject: (raw.subject as string) || input.subject,
    totalMarks: (raw.totalMarks as number) || 0,
    sections: sections.map((sec, si) => ({
      id: (sec.id as string) || `sec-${si}`,
      title: (sec.title as string) || input.sections[si]?.name || `Section ${String.fromCharCode(65 + si)}`,
      instruction: (sec.instruction as string) || 'Attempt all questions',
      questions: ((sec.questions as Array<Record<string, unknown>>) || []).map((q, qi) => ({
        id: (q.id as string) || `q-${si}-${qi}`,
        text: (q.text as string) || '',
        type: (q.type as string) || input.questionTypes[qi % input.questionTypes.length],
        difficulty: (q.difficulty as string) || 'medium',
        marks: (q.marks as number) || input.sections[si]?.marksPerQuestion || 1,
        options: q.options as string[] | undefined,
      })),
    })),
    metadata: {
      generatedAt: new Date().toISOString(),
      model: env.useMockAi ? 'mock' : env.openaiModel,
    },
  };

  const total = normalized.sections.reduce(
    (sum, s) => sum + s.questions.reduce((qs, q) => qs + q.marks, 0),
    0
  );
  normalized.totalMarks = total || normalized.totalMarks;

  return GeneratedPaperSchema.parse(normalized);
}

function generateMockPaper(input: AssignmentInput): GeneratedPaper {
  const difficulties = ['easy', 'medium', 'hard'] as const;
  const typeLabels: Record<string, string> = {
    mcq: 'Which of the following best describes',
    short_answer: 'Briefly explain',
    long_answer: 'Discuss in detail',
    true_false: 'State whether the following is True or False',
    fill_blank: 'Complete the following',
  };

  const fixedSections = input.sections.map((sec, si) => {
    const letter = String.fromCharCode(65 + si);
    const questions = Array.from({ length: sec.questionCount }, (_, qi) => {
      const qType = input.questionTypes[qi % input.questionTypes.length];
      const diff = difficulties[qi % 3];
      const base = `${typeLabels[qType] || 'Answer'} the concept related to ${input.subject} (Q${qi + 1})?`;
      return {
        id: `q-${letter.toLowerCase()}-${qi + 1}`,
        text: base,
        type: qType,
        difficulty: diff,
        marks: sec.marksPerQuestion,
        ...(qType === 'mcq'
          ? {
              options: [
                'Option A — foundational concept',
                'Option B — applied understanding',
                'Option C — common misconception',
                'Option D — advanced insight',
              ],
            }
          : {}),
      };
    });

    return {
      id: `sec-${letter.toLowerCase()}`,
      title: sec.name.startsWith('Section') ? sec.name : `Section ${letter}: ${sec.name}`,
      instruction:
        sec.questionCount > 3
          ? 'Attempt any five questions. All questions carry equal marks.'
          : 'Attempt all questions.',
      questions,
    };
  });

  const totalMarks = fixedSections.reduce(
    (sum, s) => sum + s.questions.reduce((qs, q) => qs + q.marks, 0),
    0
  );

  return GeneratedPaperSchema.parse({
    title: input.title,
    subject: input.subject,
    totalMarks,
    sections: fixedSections,
    metadata: { generatedAt: new Date().toISOString(), model: 'mock' },
  });
}

export async function generateQuestionPaper(input: AssignmentInput): Promise<GeneratedPaper> {
  if (env.useMockAi) {
    await new Promise((r) => setTimeout(r, 1500));
    return generateMockPaper(input);
  }

  if (!openai) {
    throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY or USE_MOCK_AI=true');
  }

  const prompt = buildGenerationPrompt(input);

  const response = await openai.chat.completions.create({
    model: env.openaiModel,
    messages: [
      {
        role: 'system',
        content:
          'You generate examination question papers. Always respond with valid JSON only, no markdown fences.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from LLM');

  const parsed = extractJson(content) as Record<string, unknown>;
  return normalizePaper(parsed, input);
}
