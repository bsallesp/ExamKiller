"use client";

import { listJourneyDefinitions, listExtraDefinitions, getExamPackage } from '@/lib/exams';
import { getDueCards } from '@/lib/srs';
import { computeSkillStats } from '@/lib/progress';
import { domainDot } from './shared';
import { useAllState } from './use-state';

interface ExamStats {
  mastered: number;
  due: number;
  streak: number;
  answers: number;
}

function examStatsOf(state: { logs: import('@/lib/progress').AttemptLog[]; cards: Record<string, import('@/lib/srs').CardState>; streak: import('@/lib/streak').StreakState } | undefined, now: number): ExamStats {
  if (!state) return { mastered: 0, due: 0, streak: 0, answers: 0 };
  const stats = computeSkillStats(state.logs);
  const mastered = Object.values(stats).filter(s => s.state === 'mastered').length;
  const due = getDueCards(state.cards, now).length;
  return { mastered, due, streak: state.streak.current, answers: state.logs.length };
}

export function JourneyView({
  error, loading, onLearn, onPath, onSimulate,
}: {
  error?: string;
  loading: boolean;
  onLearn: (code: string) => void;
  onPath: (code: string) => void;
  onSimulate: (code: string) => void;
}) {
  const now = Date.now();
  const journey = listJourneyDefinitions();
  const extra = listExtraDefinitions();
  const all = useAllState();
  const syncError = all.error;

  const downloadExport = () => {
    if (!all.state) return;
    const blob = new Blob([JSON.stringify(all.state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'azure-cc-progress.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Microsoft Certification Platform</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">Certification Journey</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-slate-600 leading-relaxed">
            One optimized path to your Microsoft certifications. Learn each skill with immediate feedback,
            spaced review, and calibration — then simulate when ready.
          </p>
        </header>

        {(error || syncError) && (
          <div className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error ?? syncError}</div>
        )}

        {all.loading && (
          <div className="mt-6 text-center text-xs text-slate-400">Loading your progress…</div>
        )}

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {journey.map((def, index) => {
            const isActive = def.status === 'active';
            const stats = isActive ? examStatsOf(all.state?.state[def.code], now) : null;
            return (
              <div
                key={def.code}
                className={`rounded-2xl border p-5 shadow-sm flex flex-col ${
                  isActive
                    ? 'border-slate-300 bg-white'
                    : 'border-dashed border-slate-300 bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold ${
                    isActive ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400'
                  }`}>{index + 1}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {isActive ? 'Active' : 'Coming soon'}
                  </span>
                </div>

                <h2 className="mt-3 text-xl font-bold text-slate-900">{def.certification}</h2>
                <p className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-slate-400">Exam {def.code}</p>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed flex-1">{def.description}</p>

                {isActive && stats && (
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-2">
                      <p className="text-lg font-bold text-emerald-600">{stats.mastered}</p>
                      <p className="text-[10px] text-slate-400">skills mastered</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-2">
                      <p className={`text-lg font-bold ${stats.due > 0 ? 'text-amber-600' : 'text-slate-700'}`}>{stats.due}</p>
                      <p className="text-[10px] text-slate-400">due today</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-2">
                      <p className="text-lg font-bold text-slate-700">🔥 {stats.streak}</p>
                      <p className="text-[10px] text-slate-400">day streak</p>
                    </div>
                  </div>
                )}

                {isActive ? (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {getExamPackage(def.code)?.studyPath && (
                      <button
                        onClick={() => onPath(def.code)}
                        className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
                      >
                        Path
                      </button>
                    )}
                    <button
                      onClick={() => onLearn(def.code)}
                      className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${getExamPackage(def.code)?.studyPath ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-700'}`}
                    >
                      Learn
                    </button>
                    <button
                      onClick={() => onSimulate(def.code)}
                      disabled={loading}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {loading ? 'Loading…' : 'Simulate'}
                    </button>
                  </div>
                ) : (
                  <p className="mt-4 rounded-xl bg-slate-100 p-2.5 text-center text-xs text-slate-400">
                    Blueprint pending — will unlock when content is ready
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {extra.length > 0 && (
          <>
            <div className="mt-10 flex items-center gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Additional exams</h2>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {extra.map(def => {
                const stats = examStatsOf(all.state?.state[def.code], now);
                return (
                  <div key={def.code} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${domainDot(def.domains[0]?.name ?? '')}`} />
                      <h3 className="text-lg font-bold text-slate-900">{def.certification}</h3>
                    </div>
                    <p className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-slate-400 mt-0.5">Exam {def.code}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-2">
                        <p className="text-lg font-bold text-emerald-600">{stats.mastered}</p>
                        <p className="text-[10px] text-slate-400">mastered</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-2">
                        <p className="text-lg font-bold text-slate-700">{stats.answers}</p>
                        <p className="text-[10px] text-slate-400">answers</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-2">
                        <p className="text-lg font-bold text-slate-700">🔥 {stats.streak}</p>
                        <p className="text-[10px] text-slate-400">streak</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onLearn(def.code)}
                        className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
                      >
                        Learn
                      </button>
                      <button
                        onClick={() => onSimulate(def.code)}
                        disabled={loading}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {loading ? 'Loading…' : 'Simulate'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">
          Tip: repeated exposure to the same questions can inflate exam scores — learn first, then simulate.
        </p>

        <div className="mt-6 text-center">
          <button
            onClick={downloadExport}
            disabled={!all.state}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-40"
          >
            Export progress (JSON)
          </button>
        </div>
      </div>
    </main>
  );
}
