"use client";

import type { ExamDefinition } from '@/lib/exams';
import type { Confidence } from '@/lib/types';
import { getDueCards } from '@/lib/srs';
import {
  computeSkillStats, nextAction, computeCalibration, computeErrorPatterns, overconfidenceErrors,
} from '@/lib/progress';
import type { StudyFilters } from './shared';
import { daysAgo } from './shared';
import { useExamState } from './use-state';

const STATE_META: Record<string, { label: string; cls: string }> = {
  new: { label: 'New', cls: 'bg-slate-100 text-slate-500' },
  learning: { label: 'Learning', cls: 'bg-amber-100 text-amber-700' },
  reviewing: { label: 'Reviewing', cls: 'bg-indigo-100 text-indigo-700' },
  mastered: { label: 'Mastered', cls: 'bg-emerald-100 text-emerald-700' },
};

const CONFIDENCE_LABEL: Record<Confidence, string> = { low: 'Low', medium: 'Medium', high: 'High' };

export function ProgressView({
  definition, onBack, onPractice,
}: {
  definition: ExamDefinition;
  onBack: () => void;
  onPractice: (filters: StudyFilters) => void;
}) {
  const now = Date.now();
  const { state, loading } = useExamState(definition.code);
  const logs = state?.logs ?? [];
  const stats = computeSkillStats(logs);
  const next = nextAction(stats, now);
  const masteredCount = Object.values(stats).filter(s => s.state === 'mastered').length;
  const dueCount = getDueCards(state?.cards ?? {}, now).length;
  const calibration = computeCalibration(logs);
  const patterns = computeErrorPatterns(logs);
  const overconfident = overconfidenceErrors(logs);

  const entries = Object.values(stats).sort((a, b) => a.percent - b.percent || b.attempts - a.attempts);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-5">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{definition.certification} · Progress</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Mastery &amp; Calibration</h1>
          </div>
          <button onClick={onBack} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Back
          </button>
        </header>

        {loading && <p className="text-center text-xs text-slate-400">Loading your progress…</p>}

        <div className="grid gap-3 grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className="text-xs text-slate-500">Mastered skills</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{masteredCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className="text-xs text-slate-500">Answers logged</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{logs.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className="text-xs text-slate-500">Due today</p>
            <p className={`mt-1 text-2xl font-bold ${dueCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{dueCount}</p>
          </div>
        </div>

        {next && (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-400">Next action</p>
            <p className="mt-1 text-sm font-semibold text-indigo-800">Focus on: {next}</p>
            <button
              onClick={() => onPractice({ domains: [], difficulties: [], skills: [next], limit: 5, conceptFamilyIds: [] })}
              className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              Practice now
            </button>
          </div>
        )}

        {logs.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Confidence calibration</p>
            <p className="mb-3 text-xs text-slate-500">
              A well-calibrated learner is right about as often as they think they are. {overconfident > 0
                ? `${overconfident} answer${overconfident === 1 ? ' was' : 's were'} marked High but wrong — review those topics.`
                : 'No overconfident mistakes yet.'}
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {(['low', 'medium', 'high'] as Confidence[]).map(c => {
                const e = calibration[c];
                return (
                  <div key={c} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{CONFIDENCE_LABEL[c]}</p>
                    <p className={`mt-1 text-2xl font-bold ${e.percent >= 80 ? 'text-emerald-600' : e.percent >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {e.total === 0 ? '—' : `${e.percent}%`}
                    </p>
                    <p className="text-[10px] text-slate-400">{e.correct}/{e.total} correct</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {patterns.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Most common error patterns</p>
            <div className="flex flex-wrap gap-2">
              {patterns.map(p => (
                <span key={p.errorTag} className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                  {p.errorTag} · {p.misses}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">By skill</p>
          {entries.length === 0 && (
            <p className="text-sm text-slate-500">No practice data yet. Start a practice session to build this map.</p>
          )}
          <div className="space-y-3">
            {entries.map(s => {
              const meta = STATE_META[s.state] ?? STATE_META.new;
              return (
                <div key={s.skill}>
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                    <span className="flex items-center gap-2 font-medium text-slate-700">
                      {s.skill}
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${meta.cls}`}>{meta.label}</span>
                    </span>
                    <span className={`font-semibold ${s.percent >= 80 ? 'text-emerald-600' : s.percent >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>{s.percent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${s.percent >= 80 ? 'bg-emerald-500' : s.percent >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${s.percent}%` }} />
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-400">{s.correct}/{s.attempts} correct · last seen {daysAgo(s.lastSeenAt, now)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
