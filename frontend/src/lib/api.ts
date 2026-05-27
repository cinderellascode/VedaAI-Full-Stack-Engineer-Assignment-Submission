import type { AssignmentFormData, GeneratedPaper } from '@/types/assessment';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function createAssignment(data: AssignmentFormData): Promise<{
  id: string;
  status: string;
  jobId: string;
}> {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('subject', data.subject);
  if (data.grade) formData.append('grade', data.grade);
  formData.append('dueDate', data.dueDate);
  formData.append('questionTypes', JSON.stringify(data.questionTypes));
  formData.append('sections', JSON.stringify(data.sections));
  if (data.additionalInstructions) {
    formData.append('additionalInstructions', data.additionalInstructions);
  }
  if (data.file) formData.append('file', data.file);

  const res = await fetch(`${API_URL}/api/assignments`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create assignment');
  }

  return res.json();
}

export async function getAssignment(id: string) {
  const res = await fetch(`${API_URL}/api/assignments/${id}`);
  if (!res.ok) throw new Error('Failed to fetch assignment');
  return res.json();
}

export async function regenerateAssignment(id: string) {
  const res = await fetch(`${API_URL}/api/assignments/${id}/regenerate`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to regenerate');
  return res.json();
}

export function getPdfDownloadUrl(
  id: string,
  student: { name: string; rollNumber: string; section: string }
): string {
  const params = new URLSearchParams({
    name: student.name,
    rollNumber: student.rollNumber,
    section: student.section,
  });
  return `${API_URL}/api/assignments/${id}/pdf?${params}`;
}
