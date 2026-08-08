"use client";

import type { ExamDefinition, ExamPackage } from '@/lib/exams';
import type { StudyFilters } from './shared';
import { domainDot } from './shared';
import { computeSkillStats } from '@/lib/progress';
import { useExamState } from './use-state';

const STATE_META: Record<string, { label: string; cls: string }> = {
  new: { label: 'New', cls: 'bg-slate-100 text-slate-500' },
  learning: { label: 'Learning', cls: 'bg-amber-100 text-amber-700' },
  reviewing: { label: 'Reviewing', cls: 'bg-indigo-100 text-indigo-700' },
  mastered: { label: 'Mastered', cls: 'bg-emerald-100 text-emerald-700' },
};

export function LearnView({
  definition, pkg, onBack, onPractice,
}: {
  definition: ExamDefinition;
  pkg: ExamPackage;
  onBack: () => void;
  onPractice: (filters: StudyFilters) => void;
}) {
  const { state, loading } = useExamState(definition.code);
  const stats = computeSkillStats(state?.logs ?? []);

  const grouped = definition.domains.map(domain => ({
    domain: domain.name,
    skills: Object.values(pkg.skillSummaries).filter(s => pkg.skillDomains[s.skill] === domain.name),
  }));

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{definition.certification} · Learn</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Skills</h1>
          </div>
          <button onClick={onBack} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Back
          </button>
        </header>

        {loading && <p className="mt-4 text-center text-xs text-slate-400">Loading your progress…</p>}

        <div className="mt-6 space-y-6">
          {grouped.map(group => (
            <section key={group.domain} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${domainDot(group.domain)}`} />
                <h2 className="text-base font-bold text-slate-900">{group.domain}</h2>
              </div>
              <div className="mt-4 space-y-4">
                {group.skills.map(s => {
                  const stat = stats[s.skill];
                  const meta = STATE_META[stat?.state ?? 'new'] ?? STATE_META.new;
                  return (
                    <div key={s.skill} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800">{s.skill}</p>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.cls}`}>{meta.label}</span>
                          {stat && stat.attempts > 0 && (
                            <span className="text-[10px] text-slate-400">{stat.percent}% · {stat.attempts} attempt{stat.attempts === 1 ? '' : 's'}</span>
                          )}
                          <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-blue-600 underline">
                            Docs ↗
                          </a>
                          <button
                            onClick={() => onPractice({ domains: [], difficulties: [], skills: [s.skill], limit: 5, conceptFamilyIds: [] })}
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                          >
                            Verify
                          </button>
                        </div>
                      </div>
                      <ul className="mt-2 grid gap-1.5">
                        {s.bullets.map((b, i) => (
                          <li key={i} className="flex gap-2 text-xs sm:text-sm text-slate-600">
                            <span className="mt-0.5 text-slate-400">•</span>
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
