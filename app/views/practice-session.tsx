"use client";

import { useState } from 'react';
import type { StudyQuestion, StudyOption, Confidence } from '@/lib/types';
import { isStudyAnswerCorrect, DIFF_LABEL, domainBg } from './shared';

const CONFIDENCE_META: Record<Confidence, { label: string; hint: string; cls: string }> = {
  low: { label: 'Low', hint: 'Guessing or unsure', cls: 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100' },
  medium: { label: 'Medium', hint: 'Some doubt', cls: 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100' },
  high: { label: 'High', hint: 'Confident', cls: 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
};

export function PracticeSessionView({
  questions, onGraded, onExit, onRetry, sessionTitle = 'Practice',
}: {
  questions: StudyQuestion[];
  onGraded: (q: StudyQuestion, correct: boolean, confidence: Confidence) => void;
  onExit: () => void;
  onRetry: () => void;
  sessionTitle?: string;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [confidence, setConfidence] = useState<Record<string, Confidence>>({});
  const [done, setDone] = useState(false);

  const q = questions[currentIdx];
  if (!q) return null;

  const isChecked = !!checked[q.id];
  const correct = isStudyAnswerCorrect(q, answers[q.id] ?? []);
  const myConfidence = confidence[q.id];
  const answeredCount = Object.values(answers).filter(a => a.length > 0).length;
  const correctCount = questions.filter(x => checked[x.id] && isStudyAnswerCorrect(x, answers[x.id] ?? [])).length;

  const multi = q.type === 'multiple';
  const total = questions.length;
  const doneCount = Object.values(checked).filter(Boolean).length;

  const setIds = (ids: string[]) => setAnswers(prev => ({ ...prev, [q.id]: ids }));

  const toggleStudy = (optId: string) => {
    if (isChecked) return;
    const current = answers[q.id] ?? [];
    if (multi) {
      setIds(current.includes(optId) ? current.filter(x => x !== optId) : [...current, optId]);
    } else {
      setIds(current.includes(optId) ? [] : [optId]);
    }
  };

  const check = (confidenceLevel: Confidence) => {
    if (isChecked) return;
    setConfidence(prev => ({ ...prev, [q.id]: confidenceLevel }));
    setChecked(prev => ({ ...prev, [q.id]: true }));
    onGraded(q, isStudyAnswerCorrect(q, answers[q.id] ?? []), confidenceLevel);
  };

  const finish = () => {
    for (const question of questions) {
      const answered = (answers[question.id]?.length ?? 0) > 0;
      if (!checked[question.id] && answered) {
        setChecked(prev => ({ ...prev, [question.id]: true }));
        onGraded(question, isStudyAnswerCorrect(question, answers[question.id] ?? []), 'low');
      }
    }
    setDone(true);
  };

  const calibrationNote = isChecked
    ? myConfidence === 'high' && !correct
      ? { text: 'Overconfident — you said High but this was wrong. Review the explanation carefully.', cls: 'border-rose-300 bg-rose-50 text-rose-700' }
      : myConfidence === 'low' && correct
        ? { text: 'Underconfident — you said Low but got it right. You know more than you think.', cls: 'border-emerald-300 bg-emerald-50 text-emerald-700' }
        : null
    : null;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Study Mode · {sessionTitle}</p>
            <h1 className="mt-1 text-xl font-bold text-slate-900">
              Question {currentIdx + 1} <span className="text-sm font-medium text-slate-400">of {total}</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{answeredCount}/{total} answered · {doneCount}/{total} checked</span>
            <button onClick={onExit} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Exit
            </button>
          </div>
        </header>

        {done ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-5xl font-bold">
              {correctCount === 0 ? '—' : `${Math.round((correctCount / total) * 100)}%`}
            </p>
            <p className="mt-2 text-sm text-slate-500">{correctCount} of {total} correct</p>
            <p className="mt-1 text-xs text-slate-400">
              Results are recorded in your progress, calibration, and spaced review queues.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={onRetry} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700">
                Practice Again
              </button>
              <button onClick={onExit} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Back to Study Mode
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs">
                <span className={`rounded-full px-2 py-0.5 font-medium ${domainBg(q.domain)}`}>{q.domain}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-500">{DIFF_LABEL[q.difficulty] ?? q.difficulty}</span>
                {q.type === 'multiple' && <span className="rounded-full bg-purple-50 px-2 py-0.5 font-medium text-purple-700">Multi-select</span>}
                {q.type === 'hot_area' && <span className="rounded-full bg-purple-50 px-2 py-0.5 font-medium text-purple-700">Hot Area</span>}
                {q.type === 'matching' && <span className="rounded-full bg-purple-50 px-2 py-0.5 font-medium text-purple-700">Matching</span>}
                {q.type === 'ordering' && <span className="rounded-full bg-purple-50 px-2 py-0.5 font-medium text-purple-700">Build List</span>}
              </div>

              {q.caseStudyPrompt && (
                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {q.caseStudyPrompt}
                </div>
              )}

              <h2 className="mt-4 text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">{q.stem}</h2>
              <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-600">
                {q.instruction}
              </div>

              {q.type === 'hot_area' && q.hotArea && (
                <StudyHotAreaInput grid={q.hotArea} selectedIds={answers[q.id] ?? []} locked={isChecked} onToggle={cellId => {
                  const current = answers[q.id] ?? [];
                  setIds(current.includes(cellId) ? current.filter(x => x !== cellId) : [...current, cellId]);
                }} />
              )}

              {q.type === 'matching' && q.targets && (
                <StudyMatchingInput options={q.options} targets={q.targets} selectedIds={answers[q.id] ?? []} locked={isChecked} onSelect={(optId, target) => {
                  const others = (answers[q.id] ?? []).filter(e => !e.startsWith(`${optId}::`));
                  setIds(target ? [...others, `${optId}::${target}`] : others);
                }} />
              )}

              {q.type === 'ordering' && (
                <StudyOrderingInput options={q.options} order={answers[q.id] ?? []} locked={isChecked} onOrder={setIds} />
              )}

              {q.type !== 'hot_area' && q.type !== 'matching' && q.type !== 'ordering' && (
                <div className="mt-4 sm:mt-5 grid gap-2 sm:gap-3">
                  {q.options.map(opt => {
                    const selected = (answers[q.id] ?? []).includes(opt.id);
                    const showState = isChecked;
                    const stateCls = showState
                      ? opt.isCorrect
                        ? 'border-emerald-400 bg-emerald-50'
                        : selected
                          ? 'border-rose-400 bg-rose-50'
                          : 'border-slate-200 bg-slate-50'
                      : selected
                        ? 'border-slate-700 bg-slate-800 text-white shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white';
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleStudy(opt.id)}
                        disabled={isChecked}
                        className={`w-full rounded-xl border px-3 py-3 sm:px-4 sm:py-3.5 text-left text-sm transition-all ${stateCls}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`flex h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                            showState ? (opt.isCorrect ? 'bg-emerald-600 text-white' : selected ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-500') : selected ? 'bg-white text-slate-800' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {opt.label}
                          </span>
                          <span className="flex-1">{opt.text}</span>
                          {showState && opt.isCorrect && <span className="text-xs font-semibold text-emerald-700">Correct ✓</span>}
                          {showState && !opt.isCorrect && selected && <span className="text-xs font-semibold text-rose-600">Your answer ✗</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {isChecked && (
                <div className="mt-5 space-y-3 border-t border-slate-200 pt-4">
                  <div className={`rounded-xl p-4 text-sm ${correct ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
                    <p className={`font-bold ${correct ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {correct ? 'Correct!' : 'Not quite.'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">You said: {myConfidence ? CONFIDENCE_META[myConfidence].label : '—'} confidence</p>
                  </div>

                  {calibrationNote && (
                    <div className={`rounded-xl border p-3 text-sm ${calibrationNote.cls}`}>
                      {calibrationNote.text}
                    </div>
                  )}

                  {q.type === 'single' || q.type === 'multiple' ? (
                    <div className="grid gap-1.5">
                      {q.options.map(opt => {
                        const selected = (answers[q.id] ?? []).includes(opt.id);
                        const note = selected && !opt.isCorrect ? opt.distractorNote : undefined;
                        if (!opt.isCorrect && !selected && !note) return null;
                        return (
                          <div key={opt.id} className={`rounded-xl border px-3 py-2 text-xs sm:text-sm ${opt.isCorrect ? 'border-emerald-300 bg-emerald-50/50' : selected ? 'border-rose-300 bg-rose-50/60' : 'border-slate-200 bg-slate-50'}`}>
                            <p className={`font-medium ${opt.isCorrect ? 'text-emerald-800' : selected ? 'text-rose-700' : 'text-slate-500'}`}>
                              {opt.label}. {opt.text}
                              {opt.isCorrect && !selected && <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Correct answer</span>}
                              {!opt.isCorrect && selected && <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-rose-600">You selected this</span>}
                            </p>
                            {note && <p className="mt-1 text-xs text-slate-600">{note}</p>}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs sm:text-sm text-slate-600">
                      {renderStudyGrading(q)}
                    </div>
                  )}

                  <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-sm text-slate-700">
                    <p className="font-semibold text-blue-800">Why this is correct</p>
                    <p className="mt-1 leading-relaxed">{q.explanation}</p>
                  </div>

                  {q.sourceUrl && (
                    <a href={q.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-xs font-semibold text-blue-600 underline">
                      Read the official documentation ↗
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between gap-2">
              <button
                onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                disabled={currentIdx === 0}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-30"
              >
                Previous
              </button>

              {!isChecked ? (
                <div className="flex flex-col items-center gap-1.5">
                  {(answers[q.id]?.length ?? 0) === 0 ? (
                    <span className="text-xs text-slate-400">Answer the question to check it</span>
                  ) : (
                    <>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">How confident are you?</span>
                      <div className="flex gap-2">
                        {(['low', 'medium', 'high'] as Confidence[]).map(c => (
                          <button
                            key={c}
                            onClick={() => check(c)}
                            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${CONFIDENCE_META[c].cls}`}
                            title={CONFIDENCE_META[c].hint}
                          >
                            {CONFIDENCE_META[c].label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <span className="text-sm font-semibold text-slate-400">
                  {correct ? '✓ Correct' : '✗ Incorrect'}
                </span>
              )}

              {currentIdx === total - 1 ? (
                <button
                  onClick={finish}
                  disabled={doneCount < total}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-30"
                >
                  Finish
                </button>
              ) : (
                <button
                  onClick={() => setCurrentIdx(Math.min(total - 1, currentIdx + 1))}
                  disabled={currentIdx === total - 1}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-30"
                >
                  Next
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function StudyHotAreaInput({
  grid, selectedIds, locked, onToggle,
}: {
  grid: NonNullable<StudyQuestion['hotArea']>;
  selectedIds: string[];
  locked: boolean;
  onToggle: (cellId: string) => void;
}) {
  return (
    <div className="mt-4 sm:mt-5 overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-xs sm:text-sm">
        <thead>
          <tr>
            <th className="w-1/2 border border-slate-200 bg-slate-50 p-2 text-left font-semibold text-slate-600">
              {grid.columns.some(c => /^(yes|no)$/i.test(c)) ? 'Statement' : 'Item'}
            </th>
            {grid.columns.map(col => (
              <th key={col} className="border border-slate-200 bg-slate-50 p-2 text-center font-semibold text-slate-600">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.rows.map((row, ri) => (
            <tr key={ri}>
              <td className="border border-slate-200 bg-white p-2 text-slate-700">{row.label}</td>
              {row.cells.map(cell => {
                const selected = selectedIds.includes(cell.id);
                const cls = locked
                  ? cell.isCorrect
                    ? 'border-emerald-400 bg-emerald-50 font-semibold text-emerald-700'
                    : selected
                      ? 'border-rose-400 bg-rose-50 font-semibold text-rose-600'
                      : 'border-slate-200 bg-slate-50 text-slate-400'
                  : selected
                    ? 'border-slate-700 bg-slate-800 text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white';
                return (
                  <td key={cell.id} className="border border-slate-200 bg-white p-1.5 text-center">
                    <button
                      onClick={() => !locked && onToggle(cell.id)}
                      disabled={locked}
                      className={`w-full rounded-lg border px-2 py-1.5 sm:py-2 font-medium transition ${cls}`}
                    >
                      {cell.text}
                      {locked && cell.isCorrect ? ' ✓' : ''}
                      {locked && !cell.isCorrect && selected ? ' ✗' : ''}
                    </button>
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

function StudyMatchingInput({
  options, targets, selectedIds, locked, onSelect,
}: {
  options: StudyOption[];
  targets: string[];
  selectedIds: string[];
  locked: boolean;
  onSelect: (optId: string, target: string) => void;
}) {
  const current = (optId: string) => selectedIds.find(e => e.startsWith(`${optId}::`))?.split('::')[1] ?? '';

  return (
    <div className="mt-4 sm:mt-5 grid gap-2 sm:gap-3">
      {options.map(opt => {
        const picked = current(opt.id);
        const ok = locked && picked === opt.correctTarget;
        return (
          <div key={opt.id} className={`flex flex-col gap-2 rounded-xl border p-2.5 sm:p-3 sm:flex-row sm:items-center ${
            locked ? (ok ? 'border-emerald-300 bg-emerald-50/60' : 'border-rose-300 bg-rose-50/60') : 'border-slate-200 bg-slate-50'
          }`}>
            <span className="flex-1 text-sm text-slate-700">
              <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-md bg-slate-200 text-[10px] font-bold text-slate-600">{opt.label}</span>
              {opt.text}
            </span>
            {locked ? (
              <span className={`text-xs font-semibold ${ok ? 'text-emerald-700' : 'text-rose-600'}`}>
                {ok ? '✓' : '✗'} {opt.correctTarget}
              </span>
            ) : (
              <select
                value={picked}
                onChange={e => onSelect(opt.id, e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 sm:w-64"
              >
                <option value="">Select…</option>
                {targets.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StudyOrderingInput({
  options, order, locked, onOrder,
}: {
  options: StudyOption[];
  order: string[];
  locked: boolean;
  onOrder: (ids: string[]) => void;
}) {
  if (locked) return null;

  const pool = options.filter(o => !order.includes(o.id));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onOrder(next);
  };

  return (
    <div className="mt-4 sm:mt-5 grid gap-4 sm:grid-cols-2">
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Available steps</p>
        <div className="grid gap-1.5">
          {pool.map(opt => (
            <button
              key={opt.id}
              onClick={() => onOrder([...order, opt.id])}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-600 hover:border-slate-300 hover:bg-white transition"
            >
              <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-md bg-slate-200 text-[10px] font-bold text-slate-600">{opt.label}</span>
              {opt.text}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Your order</p>
        {order.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-3 text-center text-xs text-slate-400">
            Select steps from the available list and arrange them in the correct order.
          </p>
        ) : (
          <div className="grid gap-1.5">
            {order.map((id, i) => {
              const opt = options.find(o => o.id === id);
              if (!opt) return null;
              return (
                <div key={id} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-white">{i + 1}</span>
                  <span className="flex-1 text-sm text-slate-700">{opt.text}</span>
                  <button onClick={() => move(i, i - 1)} disabled={i === 0} className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-30">↑</button>
                  <button onClick={() => move(i, i + 1)} disabled={i === order.length - 1} className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-30">↓</button>
                  <button onClick={() => onOrder(order.filter(x => x !== id))} className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100">Remove</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function renderStudyGrading(q: StudyQuestion) {
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
                {row.cells.map(cell => (
                  <td key={cell.id} className={`border p-1.5 text-center ${cell.isCorrect ? 'border-emerald-400 bg-emerald-50 font-semibold text-emerald-700' : 'text-slate-400'}`}>
                    {cell.text}{cell.isCorrect ? ' ✓' : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (q.type === 'matching') {
    return (
      <div className="grid gap-2">
        {q.options.map(opt => (
          <div key={opt.id} className="flex items-center justify-between gap-2 flex-wrap rounded-xl border border-emerald-300 bg-emerald-50/50 px-3 py-2 text-xs sm:text-sm">
            <span className="text-slate-700">{opt.text}</span>
            <span className="font-semibold text-emerald-700">✓ {opt.correctTarget}</span>
          </div>
        ))}
      </div>
    );
  }

  const expected = q.options
    .filter(o => (o.orderIndex ?? -1) >= 0)
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  return (
    <div className="grid gap-1.5">
      {expected.map((opt, i) => (
        <div key={opt.id} className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50/50 px-3 py-2 text-xs sm:text-sm">
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-[10px] font-bold text-white">{i + 1}</span>
          <span className="text-slate-700">{opt.text}</span>
        </div>
      ))}
    </div>
  );
}
