"use client";

import { useState } from 'react';
import type { ExamResults, GradedQuestion } from '@/lib/types';
import { READINESS_META, DIFF_LABEL, domainBg, domainDot } from './shared';

function renderReviewContent(q: GradedQuestion) {
  if (q.type === 'hot_area' && q.hotArea) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-xs">
          <thead>
            <tr>
              <th className="w-1/2 border border-slate-200 bg-slate-50 p-1.5 text-left font-semibold text-slate-500">
                {q.hotArea.columns.some(c => /^(yes|no)$/i.test(c)) ? 'Statement' : 'Item'}
              </th>
              {q.hotArea.columns.map(col => (
                <th key={col} className="border border-slate-200 bg-slate-50 p-1.5 text-center font-semibold text-slate-500">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {q.hotArea.rows.map((row, ri) => (
              <tr key={ri}>
                <td className="border border-slate-200 p-1.5 text-slate-600">{row.label}</td>
                {row.cells.map(cell => {
                  const picked = q.selectedIds.includes(cell.id);
                  const isCorrectPick = cell.isCorrect && picked;
                  const isWrongPick = !cell.isCorrect && picked;
                  const isMissed = cell.isCorrect && !picked;
                  const cls = isCorrectPick
                    ? 'border-emerald-400 bg-emerald-50 font-semibold text-emerald-700'
                    : isWrongPick
                      ? 'border-rose-400 bg-rose-50 font-semibold text-rose-600'
                      : isMissed
                        ? 'border-emerald-300 bg-emerald-50/40 font-semibold text-emerald-600'
                        : 'text-slate-400';
                  return (
                    <td key={cell.id} className={`border p-1.5 text-center ${cls}`}>
                      {cell.text}
                      {isCorrectPick ? ' ✓' : isWrongPick ? ' ✗' : isMissed ? ' ✓' : ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (q.type === 'matching' && q.targets) {
    return (
      <div className="grid gap-2">
        {q.options.map(opt => {
          const picked = q.selectedIds.find(e => e.startsWith(`${opt.id}::`))?.split('::')[1] ?? '';
          const ok = picked === opt.correctTarget;
          return (
            <div key={opt.id} className={`flex items-center justify-between gap-2 flex-wrap rounded-xl border px-3 py-2 text-xs sm:text-sm ${
              ok ? 'border-emerald-300 bg-emerald-50/50' : 'border-rose-300 bg-rose-50/50'
            }`}>
              <span className="text-slate-700">{opt.text}</span>
              <span className={`font-semibold ${ok ? 'text-emerald-700' : 'text-rose-600'}`}>
                {ok ? '✓' : '✗'} {picked ? `You selected ${picked}` : 'Not answered'} — correct: {opt.correctTarget}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  if (q.type === 'ordering') {
    const expected = q.options
      .filter(o => (o.orderIndex ?? -1) >= 0)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    return (
      <div className="grid gap-1.5">
        {q.selectedIds.length === 0 && <p className="text-xs text-slate-400">Not answered.</p>}
        {q.selectedIds.map((id, i) => {
          const opt = q.options.find(o => o.id === id);
          if (!opt) return null;
          const ok = expected[i]?.id === id;
          return (
            <div key={id} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs sm:text-sm ${
              ok ? 'border-emerald-300 bg-emerald-50/50' : 'border-rose-300 bg-rose-50/50'
            }`}>
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-slate-200 text-[10px] font-bold text-slate-600">{i + 1}</span>
              <span className="flex-1 text-slate-700">{opt.text}</span>
              <span className={`font-semibold ${ok ? 'text-emerald-700' : 'text-rose-600'}`}>{ok ? '✓ Correct position' : '✗'}</span>
            </div>
          );
        })}
        {q.selectedIds.length > 0 && q.selectedIds.length < expected.length && (
          <p className="text-xs text-rose-600">Missing {expected.length - q.selectedIds.length} required step{q.selectedIds.length === expected.length - 1 ? '' : 's'}.</p>
        )}
      </div>
    );
  }

  return (
    <>
      {q.options.map(opt => {
        const sel = q.selectedIds.includes(opt.id);
        const label = opt.isCorrect && sel ? 'Correct ✓' : opt.isCorrect && !sel ? 'Correct answer' : !opt.isCorrect && sel ? 'Your answer ✗' : '';
        return (
          <div key={opt.id} className={`rounded-xl border px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm ${
            opt.isCorrect && sel ? 'border-emerald-400 bg-emerald-50' :
            opt.isCorrect && !sel ? 'border-emerald-300 bg-emerald-50/50' :
            !opt.isCorrect && sel ? 'border-rose-400 bg-rose-50' :
            'border-slate-100 bg-slate-50'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-1.5">
              <div className="flex items-center gap-2">
                <span className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg text-[10px] sm:text-xs font-bold ${
                  sel && opt.isCorrect ? 'bg-emerald-600 text-white' : sel && !opt.isCorrect ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>{opt.label}</span>
                <span className="text-slate-700">{opt.text}</span>
              </div>
              {label && <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${opt.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{label}</span>}
            </div>
          </div>
        );
      })}
    </>
  );
}

export function ResultsView({
  results, title, onNewExam, onAddMissed, onBackToJourney,
}: {
  results: ExamResults;
  title: string;
  onNewExam: () => void;
  onAddMissed?: (missed: GradedQuestion[]) => void;
  onBackToJourney?: () => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [addedToReview, setAddedToReview] = useState(false);
  const meta = READINESS_META[results.readiness];
  const missed = results.questions.filter(q => !q.isCorrect);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-4xl space-y-5 sm:space-y-6">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{title}</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">Exam Results</h1>
        </header>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 text-center shadow-sm">
            <p className="text-xs sm:text-sm text-slate-500">Score</p>
            <p className={`mt-1 text-3xl sm:text-4xl font-bold ${
              results.score >= 85 ? 'text-emerald-600' : results.score >= 78 ? 'text-amber-600' : 'text-rose-600'
            }`}>{results.score}%</p>
            <p className="mt-0.5 text-xs text-slate-400">{results.correct}/{results.total} correct</p>
          </div>

          <div className={`rounded-2xl border p-4 sm:p-6 text-center shadow-sm ${meta.border} ${meta.bg}`}>
            <p className="text-xs sm:text-sm opacity-70">Readiness</p>
            <p className={`mt-1 text-xl sm:text-2xl font-bold ${meta.text}`}>{meta.label}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 text-center shadow-sm">
            <p className="text-xs sm:text-sm text-slate-500">Hard Questions</p>
            <p className={`mt-1 text-2xl sm:text-3xl font-bold ${(results.difficultyScores.hard?.percent ?? 0) >= 80 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {results.difficultyScores.hard?.percent ?? '--'}%
            </p>
            <p className="mt-0.5 text-xs text-slate-400">{results.difficultyScores.hard?.correct ?? 0}/{results.difficultyScores.hard?.total ?? 0}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 mb-3">By Domain</p>
            <div className="space-y-3">
              {Object.entries(results.domainScores).map(([domain, s]) => (
                <div key={domain}>
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                    <span className="font-medium text-slate-700">{domain}</span>
                    <span className={`font-semibold ${s.percent >= 75 ? 'text-emerald-600' : s.percent >= 65 ? 'text-amber-600' : 'text-rose-600'}`}>{s.percent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${domainDot(domain)}`} style={{ width: `${s.percent}%` }} />
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-400">{s.correct}/{s.total}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 mb-3">By Difficulty</p>
            <div className="space-y-3">
              {Object.entries(results.difficultyScores).map(([diff, s]) => (
                <div key={diff}>
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                    <span className="font-medium text-slate-700 capitalize">{diff}</span>
                    <span className="font-semibold text-slate-700">{s.percent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${
                      diff === 'easy' ? 'bg-green-500' : diff === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} style={{ width: `${s.percent}%` }} />
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-400">{s.correct}/{s.total}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {results.weakDomains.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
            <p className="text-sm font-semibold text-amber-800">Focus areas</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-amber-700 space-y-1">
              {results.weakDomains.map(d => <li key={d}>{d}</li>)}
            </ul>
          </div>
        )}

        {missed.length > 0 && onAddMissed && (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-indigo-800">Missed {missed.length} question{missed.length === 1 ? '' : 's'}</p>
              <p className="text-xs text-indigo-600">Add them to your spaced review queue so they come back at the right time.</p>
            </div>
            <button
              onClick={() => { onAddMissed(missed); setAddedToReview(true); }}
              disabled={addedToReview}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {addedToReview ? 'Added to review queue ✓' : 'Add to review queue'}
            </button>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 mb-4">Question Review</p>
          <div className="grid gap-3">
            {results.questions.map((q, i) => {
              const show = expanded[q.id] ?? false;
              return (
                <div key={q.id} className={`rounded-xl border p-3 sm:p-4 ${q.isCorrect ? 'border-emerald-200 bg-emerald-50/30' : 'border-rose-200 bg-rose-50/30'}`}>
                  <button onClick={() => setExpanded(p => ({ ...p, [q.id]: !p[q.id] }))} className="flex w-full items-start justify-between gap-2 text-left">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${q.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {q.isCorrect ? 'CORRECT' : 'INCORRECT'}
                        </span>
                        <span className="text-[10px] text-slate-400">#{i + 1}</span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${domainBg(q.domain)}`}>{q.domain}</span>
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{DIFF_LABEL[q.difficulty]}</span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-slate-800 line-clamp-2">{q.stem}</p>
                    </div>
                    <span className="text-slate-400 flex-shrink-0 mt-1">{show ? '▴' : '▾'}</span>
                  </button>

                  {show && (
                    <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                      {renderReviewContent(q)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pb-8">
          {onBackToJourney && (
            <button onClick={onBackToJourney} className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Back to Journey
            </button>
          )}
          <button onClick={onNewExam} className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700">
            Start New Exam
          </button>
        </div>
      </div>
    </main>
  );
}
