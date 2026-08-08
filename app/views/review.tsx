"use client";

import { useState } from 'react';
import type { PublicQuestion } from '@/lib/types';
import { formatTime, TYPE_BADGE, domainBg } from './shared';

export function ReviewView({
  questions, answers, flagged, timeLeft, submitting, onReturn, onSubmit,
}: {
  questions: PublicQuestion[];
  answers: Record<string, string[]>;
  flagged: string[];
  timeLeft: number;
  submitting: boolean;
  onReturn: (index: number) => void;
  onSubmit: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const total = questions.length;
  const unanswered = questions.filter(q => (answers[q.id]?.length ?? 0) === 0);
  const flaggedList = questions.filter(q => flagged.includes(q.id));
  const answeredCount = total - unanswered.length;
  const timerColor = timeLeft <= 300 ? 'text-rose-600' : timeLeft <= 900 ? 'text-amber-600' : 'text-slate-700';

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-5">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Readiness Simulator</p>
            <h1 className="mt-1 text-xl sm:text-2xl font-bold text-slate-900">Review</h1>
          </div>
          <span className={`text-xl font-mono font-bold tracking-tight ${timerColor}`}>{formatTime(timeLeft)}</span>
        </header>

        <div className="grid gap-3 grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className="text-xs text-slate-500">Answered</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{answeredCount}<span className="text-sm font-medium text-slate-400">/{total}</span></p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className="text-xs text-slate-500">Not answered</p>
            <p className={`mt-1 text-2xl font-bold ${unanswered.length > 0 ? 'text-rose-600' : 'text-slate-700'}`}>{unanswered.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className="text-xs text-slate-500">Flagged</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{flaggedList.length}</p>
          </div>
        </div>

        {unanswered.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Questions not answered ({unanswered.length})</p>
            <div className="grid gap-2">
              {unanswered.map(q => (
                <ReviewItem key={q.id} q={q} index={questions.indexOf(q)} chip="Not answered" chipCls="bg-rose-50 text-rose-700" onReturn={onReturn} />
              ))}
            </div>
          </section>
        )}

        {flaggedList.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Flagged for review ({flaggedList.length})</p>
            <div className="grid gap-2">
              {flaggedList.map(q => (
                <ReviewItem key={q.id} q={q} index={questions.indexOf(q)} chip="Flagged" chipCls="bg-amber-50 text-amber-700" onReturn={onReturn} />
              ))}
            </div>
          </section>
        )}

        {unanswered.length === 0 && flaggedList.length === 0 && (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            All {total} questions have been answered.
          </p>
        )}

        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2 pb-8">
          <button onClick={() => setConfirm(false)} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Return to Exam
          </button>
          <div className="flex flex-col gap-2">
            {confirm ? (
              <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-700">
                  Submit the exam now? {unanswered.length > 0 && <span className="font-semibold text-rose-600">{unanswered.length} question{unanswered.length === 1 ? '' : 's'} not answered.</span>}
                </p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => setConfirm(false)} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button onClick={onSubmit} disabled={submitting} className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50">
                    {submitting ? 'Submitting…' : 'Yes, Submit'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirm(true)} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700">
                Submit Exam
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function ReviewItem({
  q, index, chip, chipCls, onReturn,
}: {
  q: PublicQuestion;
  index: number;
  chip: string;
  chipCls: string;
  onReturn: (index: number) => void;
}) {
  const badge = TYPE_BADGE[q.type] ?? TYPE_BADGE.single;
  return (
    <button
      onClick={() => onReturn(index)}
      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left hover:border-slate-300 hover:bg-white transition"
    >
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-slate-800 text-[10px] font-bold text-white">{index + 1}</span>
      <span className="flex-1 min-w-0">
        <span className="block truncate text-sm text-slate-700">{q.stem}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${badge.cls}`}>{badge.label}</span>
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${domainBg(q.domain)}`}>{q.domain}</span>
        </span>
      </span>
      <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${chipCls}`}>{chip}</span>
    </button>
  );
}
