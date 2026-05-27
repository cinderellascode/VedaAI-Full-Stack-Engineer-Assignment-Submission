import type { Difficulty } from '@/types/assessment';

const styles: Record<Difficulty, string> = {
  easy: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  hard: 'bg-rose-100 text-rose-800 border-rose-200',
};

const labels: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Moderate',
  hard: 'Hard',
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[difficulty]}`}
    >
      {labels[difficulty]}
    </span>
  );
}
