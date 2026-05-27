import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="font-display text-lg font-bold text-zinc-900">VedaAI</span>
            <span className="hidden text-xs text-zinc-500 sm:block">Assessment Creator</span>
          </div>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/"
            className="font-medium text-brand-600 hover:text-brand-700"
          >
            Create
          </Link>
        </nav>
      </div>
    </header>
  );
}
