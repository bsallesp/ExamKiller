"use client";

import { useState } from 'react';
import type { Difficulty } from '@/lib/types';
import type { ExamDefinition } from '@/lib/exams';
import type { StudyFilters } from './shared';

export function PracticeSetupView({
  definition, onBack, onStart,
}: {
  definition: ExamDefinition;
  onBack: () => void;
  onStart: (filters: StudyFilters) => void;
}) {
  const [domains, setDomains] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [limit, setLimit] = useState(10);

  const toggle = <T extends string>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter(x => x !== value) : [...list, value];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-5">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{definition.certification} · Practice</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Practice Session</h1>
          </div>
          <button onClick={onBack} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Back
          </button>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Domains</p>
          <div className="flex flex-wrap gap-2">
            {definition.domains.map(d => {
              const active = domains.includes(d.name);
              return (
                <button
                  key={d.name}
                  onClick={() => setDomains(prev => toggle(prev, d.name))}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    active ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                  }`}
                >
                  {d.name}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-400">Leave empty to include all domains.</p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Difficulty</p>
          <div className="flex flex-wrap gap-2">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
              const active = difficulties.includes(d);
              return (
                <button
                  key={d}
                  onClick={() => setDifficulties(prev => toggle(prev, d))}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium capitalize transition ${
                    active ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-400">Leave empty to include all difficulties.</p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Session size</p>
          <div className="flex flex-wrap gap-2">
            {[5, 10, 20, definition.questionCount].filter((v, i, a) => a.indexOf(v) === i).map(n => (
              <button
                key={n}
                onClick={() => setLimit(n)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  limit === n ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </section>

        <button
          onClick={() => onStart({ domains, difficulties, skills: [], limit, conceptFamilyIds: [] })}
          className="w-full rounded-2xl bg-slate-900 px-6 py-4 text-lg font-semibold text-white hover:bg-slate-700 active:scale-[0.99]"
        >
          Start Practice
        </button>
      </div>
    </main>
  );
}
