"use client";

import { useState } from 'react';
import type { ExamDefinition } from '@/lib/exams';
import type { StudyQuestion } from '@/lib/types';
import { getDueCards, nextReviewLabel } from '@/lib/srs';
import { PracticeSessionView } from './practice-session';
import { interleave } from './shared';
import { useExamState } from './use-state';

export function SrsView({
  definition, onBack, onGraded,
}: {
  definition: ExamDefinition;
  onBack: () => void;
  onGraded: (q: StudyQuestion, correct: boolean, confidence: import('@/lib/types').Confidence) => void;
}) {
  const [session, setSession] = useState<StudyQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { state, loading } = useExamState(definition.code);

  const now = Date.now();
  const due = getDueCards(state?.cards ?? {}, now);
  const allCards = Object.values(state?.cards ?? {}).sort((a, b) => a.dueAt - b.dueAt);

  const begin = () => {
    setError(null);
    const ids = due.map(c => c.conceptFamilyId);
    fetch(`/api/study?code=${definition.code}&ids=${ids.join(',')}`)
      .then(r => r.json())
      .then((data: { questions?: StudyQuestion[]; error?: string }) => {
        if (data.error) throw new Error(data.error);
        setSession(interleave(data.questions ?? [], q => q.skill));
      })
      .catch(err => setError(err.message));
  };

  if (session && session.length > 0) {
    return (
      <PracticeSessionView
        questions={session}
        sessionTitle="Spaced Review"
        onGraded={onGraded}
        onExit={() => setSession(null)}
        onRetry={begin}
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-5">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{definition.certification} · Spaced Review</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Review Queue</h1>
          </div>
          <button onClick={onBack} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Back
          </button>
        </header>

        {error && <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

        {loading && <p className="text-center text-xs text-slate-400">Loading your review queue…</p>}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-5xl font-bold text-slate-900">{due.length}</p>
          <p className="mt-2 text-sm text-slate-500">cards due today</p>
          {due.length === 0 ? (
            <p className="mt-3 text-xs text-slate-400">All caught up. New cards enter the queue when you practice or miss questions in an exam.</p>
          ) : (
            <button onClick={begin} className="mt-5 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700">
              Start Review Session
            </button>
          )}
        </div>

        {allCards.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Upcoming reviews</p>
            <div className="space-y-2">
              {allCards.map(card => (
                <div key={card.conceptFamilyId} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-mono text-xs text-slate-500">{card.conceptFamilyId}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${card.dueAt <= now ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                    {nextReviewLabel(card, now)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {allCards.length === 0 && (
          <p className="rounded-2xl border border-slate-200 bg-white p-5 text-center text-sm text-slate-500 shadow-sm">
            No cards yet. Practice questions or miss exam questions to start building your review queue.
          </p>
        )}
      </div>
    </main>
  );
}
