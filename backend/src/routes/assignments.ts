import { Router, Request, Response } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { AssignmentInputSchema } from '../types/assessment';
import { Assignment } from '../models/Assignment';
import { generationQueue } from '../queues/generationQueue';
import { getCachedPaper, getJobState } from '../services/cacheService';
import { generatePdfBuffer } from '../services/pdfService';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'text/plain'];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and text files are allowed'));
    }
  },
});

export const assignmentsRouter = Router();

assignmentsRouter.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    let sourceText = req.body.sourceText || '';

    if (req.file) {
      if (req.file.mimetype === 'application/pdf') {
        const parsed = await pdfParse(req.file.buffer);
        sourceText = parsed.text;
      } else {
        sourceText = req.file.buffer.toString('utf-8');
      }
    }

    let sections = req.body.sections;
    let questionTypes = req.body.questionTypes;

    if (typeof sections === 'string') sections = JSON.parse(sections);
    if (typeof questionTypes === 'string') questionTypes = JSON.parse(questionTypes);

    const parsed = AssignmentInputSchema.safeParse({
      title: req.body.title,
      subject: req.body.subject,
      grade: req.body.grade || undefined,
      dueDate: req.body.dueDate,
      questionTypes,
      sections,
      additionalInstructions: req.body.additionalInstructions || undefined,
      sourceText: sourceText || undefined,
    });

    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const assignment = await Assignment.create({
      ...parsed.data,
      dueDate: new Date(parsed.data.dueDate),
      sourceFileName: req.file?.originalname,
      status: 'queued',
    });

    const job = await generationQueue.add(
      'generate',
      { assignmentId: assignment.id, input: parsed.data },
      { jobId: `gen-${assignment.id}` }
    );

    assignment.jobId = job.id;
    await assignment.save();

    res.status(201).json({
      id: assignment.id,
      status: assignment.status,
      jobId: job.id,
    });
  } catch (err) {
    console.error('Create assignment error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Server error' });
  }
});

assignmentsRouter.get('/', async (_req, res) => {
  const list = await Assignment.find()
    .select('title subject status dueDate createdAt')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  res.json(
    list.map((a) => ({
      id: a._id,
      title: a.title,
      subject: a.subject,
      status: a.status,
      dueDate: a.dueDate,
      createdAt: a.createdAt,
    }))
  );
});

assignmentsRouter.get('/:id', async (req, res) => {
  const assignment = await Assignment.findById(req.params.id).lean();
  if (!assignment) {
    res.status(404).json({ error: 'Assignment not found' });
    return;
  }

  const cached = await getCachedPaper(req.params.id);
  const jobState = await getJobState(req.params.id);

  res.json({
    id: assignment._id,
    title: assignment.title,
    subject: assignment.subject,
    grade: assignment.grade,
    dueDate: assignment.dueDate,
    questionTypes: assignment.questionTypes,
    sections: assignment.sections,
    additionalInstructions: assignment.additionalInstructions,
    status: assignment.status,
    error: assignment.error,
    jobState,
    generatedPaper: assignment.generatedPaper || cached,
  });
});

assignmentsRouter.post('/:id/regenerate', async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    res.status(404).json({ error: 'Assignment not found' });
    return;
  }

  const input = {
    title: assignment.title,
    subject: assignment.subject,
    grade: assignment.grade,
    dueDate: assignment.dueDate.toISOString().split('T')[0],
    questionTypes: assignment.questionTypes,
    sections: assignment.sections,
    additionalInstructions: assignment.additionalInstructions,
    sourceText: assignment.sourceText,
  };

  const parsed = AssignmentInputSchema.safeParse(input);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid stored assignment data' });
    return;
  }

  assignment.status = 'queued';
  assignment.error = undefined;
  assignment.generatedPaper = undefined;
  await assignment.save();

  const job = await generationQueue.add(
    'generate',
    { assignmentId: assignment.id, input: parsed.data },
    { jobId: `regen-${assignment.id}-${Date.now()}` }
  );

  res.json({ id: assignment.id, status: 'queued', jobId: job.id });
});

assignmentsRouter.get('/:id/pdf', async (req, res) => {
  const assignment = await Assignment.findById(req.params.id).lean();
  if (!assignment?.generatedPaper) {
    res.status(404).json({ error: 'Generated paper not available' });
    return;
  }

  const studentInfo = {
    name: (req.query.name as string) || '',
    rollNumber: (req.query.rollNumber as string) || '',
    section: (req.query.section as string) || '',
  };

  try {
    const buffer = await generatePdfBuffer(assignment.generatedPaper, studentInfo);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${assignment.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`
    );
    res.send(buffer);
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});
