"use client";

import type { ExamDefinition } from '@/lib/exams';
import { getDueCards, getUpcomingCards, nextReviewLabel } from '@/lib/srs';
import { computeSkillStats, nextAction } from '@/lib/progress';
import { streakDaysGap } from '@/lib/streak';
import { useExamState } from './use-state';

export function StudyHubView({
  definition, onBack, onPractice, onLearn, onSrs, onProgress, onPath,
}: {
  definition: ExamDefinition;
  onBack: () => void;
  onPractice: () => void;
  onLearn: () => void;
  onSrs: () => void;
  onProgress: () => void;
  onPath: () => void;
}) {
  const now = Date.now();
  const { state, loading } = useExamState(definition.code);
  const stats = computeSkillStats(state?.logs ?? []);
  const dueCount = getDueCards(state?.cards ?? {}, now).length;
  const upcoming = getUpcomingCards(state?.cards ?? {}, now, 3);
  const streak = state?.streak;
  const gap = streak ? streakDaysGap(streak, now) : 0;
  const masteredCount = Object.values(stats).filter(s => s.state === 'mastered').length;
  const next = nextAction(stats, now);

  const modes = [
    {
      key: 'path', title: 'Study Path', desc: 'A guided, phased plan: read, verify at 80%, then simulate. Your next step is always clear.',
      action: onPath, accent: 'border-violet-200 bg-violet-50/40', badge: 'Guide',
    },
    {
      key: 'learn', title: 'Learn', desc: 'Read the official concepts per skill, then verify with a few questions.',
      action: onLearn, accent: 'border-indigo-200 bg-indigo-50/40', badge: 'Skills',
    },
    {
      key: 'practice', title: 'Practice', desc: 'Filtered sessions with immediate feedback, explanations for every option, and confidence tracking.',
      action: onPractice, accent: 'border-emerald-200 bg-emerald-50/40', badge: `${definition.questionCount} questions`,
    },
    {
      key: 'srs', title: 'Spaced Review', desc: 'Cards come back at growing intervals tuned by your confidence. Missed answers return today.',
      action: onSrs, accent: 'border-amber-200 bg-amber-50/40', badge: dueCount > 0 ? `${dueCount} due today` : 'up to date',
    },
    {
      key: 'progress', title: 'Progress', desc: 'Mastery per skill, confidence calibration, and your most common error patterns.',
      action: onProgress, accent: 'border-cyan-200 bg-cyan-50/40', badge: 'Track',
    },
  ];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{definition.certification} · {definition.code.toUpperCase()}</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Learn. Practice. Review.</h1>
          </div>
          <button onClick={onBack} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Journey
          </button>
        </header>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {loading && <p className="text-center text-xs text-slate-400">Loading your progress…</p>}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">🔥 {gap > 1 ? 0 : (streak?.current ?? 0)}</p>
                <p className="text-[10px] text-slate-400">day streak</p>
              </div>
              <div className="text-center">
                <p className={`text-3xl font-bold ${dueCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{dueCount}</p>
                <p className="text-[10px] text-slate-400">due today</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-600">{masteredCount}</p>
                <p className="text-[10px] text-slate-400">skills mastered</p>
              </div>
            </div>
            <div className="text-right">
              {next ? (
                <>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Next action</p>
                  <button onClick={onPractice} className="mt-1 text-sm font-semibold text-indigo-700 underline">
                    Study: {next}
                  </button>
                </>
              ) : (
                <p className="text-sm text-slate-400">All skills mastered — time to simulate!</p>
              )}
            </div>
          </div>

          {upcoming.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-[10px] text-slate-400">
              <span className="font-semibold uppercase tracking-wide">Up next:</span>
              {upcoming.map(c => (
                <span key={c.conceptFamilyId} className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-slate-500">
                  {c.conceptFamilyId} · {nextReviewLabel(c, now)}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {modes.map(m => (
            <button
              key={m.key}
              onClick={m.action}
              className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md active:scale-[0.99] ${m.accent}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-lg font-bold text-slate-900">{m.title}</span>
                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">{m.badge}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{m.desc}</p>
            </button>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">How the loop works</p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-slate-600">
            <li>Learn a skill, then practice it with immediate feedback and rate your confidence.</li>
            <li>Your confidence tunes the schedule: mistakes return today, confident wins wait longer.</li>
            <li>Review what is due — interleaved across skills to keep retrieval hard.</li>
            <li>Track mastery, calibration, and error patterns; simulate when ready.</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
