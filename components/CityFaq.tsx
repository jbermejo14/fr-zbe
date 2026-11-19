import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { FaqEntry } from '@/lib/city-page';

interface CityFaqProps {
  entries: readonly FaqEntry[];
}

/** Preguntas frecuentes con `<details>`/`<summary>`: accesibles y sin JavaScript. */
export function CityFaq({ entries }: CityFaqProps) {
  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <details key={entry.question} className="card card-compact group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 font-semibold text-fg">
            {entry.question}
            <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-secondary group-open:rotate-180" />
          </summary>
          <p className="mt-2 text-sm text-secondary">{entry.answer}</p>
        </details>
      ))}
    </div>
  );
}
