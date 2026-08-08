"use client";

import type { PublicQuestion, PublicOption, HotAreaGrid } from '@/lib/types';
import { formatTime, DIFF_LABEL, domainBg } from './shared';

function QuestionCard({
  question, selectedIds, onSelect, onSetAnswers,
}: {
  question: PublicQuestion;
  selectedIds: string[];
  onSelect: (qId: string, optId: string, multi: boolean) => void;
  onSetAnswers: (qId: string, ids: string[]) => void;
}) {
  const multi = question.type === 'multiple';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
      <h2 className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">{question.stem}</h2>
      <p className="mt-2 text-xs sm:text-sm text-slate-500">{question.skill}</p>
      <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-600">
        {question.instruction}
      </div>

      {question.type === 'hot_area' && question.hotArea && (
        <HotAreaInput
          grid={question.hotArea}
          selectedIds={selectedIds}
          onToggle={cellId => {
            const next = selectedIds.includes(cellId)
              ? selectedIds.filter(x => x !== cellId)
              : [...selectedIds, cellId];
            onSetAnswers(question.id, next);
          }}
        />
      )}

      {question.type === 'matching' && question.targets && (
        <MatchingInput
          options={question.options}
          targets={question.targets}
          selectedIds={selectedIds}
          onSelect={(optId, target) => {
            const others = selectedIds.filter(e => !e.startsWith(`${optId}::`));
            const next = target ? [...others, `${optId}::${target}`] : others;
            onSetAnswers(question.id, next);
          }}
        />
      )}

      {question.type === 'ordering' && (
        <OrderingInput
          options={question.options}
          order={selectedIds}
          onOrder={next => onSetAnswers(question.id, next)}
        />
      )}

      {question.type !== 'hot_area' && question.type !== 'matching' && question.type !== 'ordering' && (
        <div className="mt-4 sm:mt-5 grid gap-2 sm:gap-3">
          {question.options.map(opt => {
            const selected = selectedIds.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => onSelect(question.id, opt.id, multi)}
                className={`w-full rounded-xl border px-3 py-3 sm:px-4 sm:py-3.5 text-left text-sm transition-all ${
                  selected
                    ? 'border-slate-700 bg-slate-800 text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`flex h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    selected ? 'bg-white text-slate-800' : 'bg-slate-200 text-slate-600'
                  }`}>{opt.label}</span>
                  <span>{opt.text}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HotAreaInput({
  grid, selectedIds, onToggle,
}: {
  grid: HotAreaGrid;
  selectedIds: string[];
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
                return (
                  <td key={cell.id} className="border border-slate-200 bg-white p-1.5 text-center">
                    <button
                      onClick={() => onToggle(cell.id)}
                      aria-pressed={selected}
                      className={`w-full rounded-lg border px-2 py-1.5 sm:py-2 font-medium transition ${
                        selected
                          ? 'border-slate-700 bg-slate-800 text-white shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      {cell.text}
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

function MatchingInput({
  options, targets, selectedIds, onSelect,
}: {
  options: PublicOption[];
  targets: string[];
  selectedIds: string[];
  onSelect: (optId: string, target: string) => void;
}) {
  const current = (optId: string) =>
    selectedIds.find(e => e.startsWith(`${optId}::`))?.split('::')[1] ?? '';

  return (
    <div className="mt-4 sm:mt-5 grid gap-2 sm:gap-3">
      {options.map(opt => (
        <div key={opt.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3 sm:flex-row sm:items-center">
          <span className="flex-1 text-sm text-slate-700">
            <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-md bg-slate-200 text-[10px] font-bold text-slate-600">{opt.label}</span>
            {opt.text}
          </span>
          <select
            value={current(opt.id)}
            onChange={e => onSelect(opt.id, e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 sm:w-64"
          >
            <option value="">Select…</option>
            {targets.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

function OrderingInput({
  options, order, onOrder,
}: {
  options: PublicOption[];
  order: string[];
  onOrder: (ids: string[]) => void;
}) {
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

function NavGrid({
  questions, answers, flagged, currentIdx, onNavigate,
}: {
  questions: PublicQuestion[];
  answers: Record<string, string[]>;
  flagged: string[];
  currentIdx: number;
  onNavigate: (i: number) => void;
}) {
  return (
    <div className="flex flex-col overflow-auto p-3 sm:p-4 scrollbar-thin">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Questions</p>
      <div className="grid grid-cols-5 gap-1.5">
        {questions.map((q, i) => {
          const answered = (answers[q.id]?.length ?? 0) > 0;
          const isFlagged = flagged.includes(q.id);
          return (
            <button
              key={q.id}
              onClick={() => onNavigate(i)}
              className={`flex h-9 w-full items-center justify-center rounded-lg text-[11px] font-semibold transition ${
                i === currentIdx ? 'ring-2 ring-slate-700 ring-offset-1' : ''
              } ${
                isFlagged
                  ? 'bg-amber-100 text-amber-800'
                  : answered
                    ? 'bg-slate-300 text-slate-700'
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
              }`}
            >
              {isFlagged ? '!' : i + 1}
            </button>
          );
        })}
      </div>
      <div className="mt-4 space-y-1.5 text-[10px] text-slate-400">
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-slate-300" /> Answered</div>
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-slate-100" /> Unanswered</div>
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-amber-100" /> Flagged</div>
      </div>
    </div>
  );
}

export function ExamView({
  questions, answers, flagged, currentIdx, timeLeft,
  error, submitting, navOpen, title,
  onSelect, onSetAnswers, onFlag, onNavigate, onEndExam, onNewExam, onToggleNav,
}: {
  questions: PublicQuestion[];
  answers: Record<string, string[]>;
  flagged: string[];
  currentIdx: number;
  timeLeft: number;
  error: string | null;
  submitting: boolean;
  navOpen: boolean;
  title: string;
  onSelect: (qId: string, optId: string, multi: boolean) => void;
  onSetAnswers: (qId: string, ids: string[]) => void;
  onFlag: (qId: string) => void;
  onNavigate: (i: number) => void;
  onEndExam: () => void;
  onNewExam: () => void;
  onToggleNav: () => void;
}) {
  const q = questions[currentIdx];
  if (!q) return null;

  const total = questions.length;
  const timerColor = timeLeft <= 300 ? 'text-rose-600' : timeLeft <= 900 ? 'text-amber-600' : 'text-slate-700';
  const answeredCount = Object.values(answers).filter(a => a.length > 0).length;

  return (
    <main className="flex h-screen flex-col bg-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between px-3 py-2.5 sm:px-6">
          <button onClick={onToggleNav} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 lg:hidden">
            Q {currentIdx + 1}/{total}
          </button>
          <span className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 lg:inline">{title} Simulator</span>

          <div className="flex items-center gap-3">
            <span className={`text-lg sm:text-xl font-mono font-bold tracking-tight ${timerColor}`}>{formatTime(timeLeft)}</span>
            {timeLeft <= 0 && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">TIME</span>}
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-slate-400 sm:inline">{answeredCount}/{total}</span>
            <button
              onClick={onEndExam}
              disabled={submitting}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {submitting ? '...' : 'End Exam'}
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="mx-3 mt-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 sm:mx-6">
          {error} <button onClick={onNewExam} className="ml-2 font-semibold underline">New exam</button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden lg:flex lg:w-64 lg:flex-shrink-0 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white">
          <NavGrid questions={questions} answers={answers} flagged={flagged} currentIdx={currentIdx} onNavigate={onNavigate} />
        </aside>

        <div className="flex flex-1 flex-col overflow-auto">
          <div className="mx-auto w-full max-w-3xl p-4 sm:p-6 lg:p-8">
            <div className="mb-4 flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs">
              <span className="font-semibold text-slate-400">Question {currentIdx + 1} of {total}</span>
              <span className={`rounded-full px-2 py-0.5 font-medium ${domainBg(q.domain)}`}>{q.domain}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-500">{DIFF_LABEL[q.difficulty] ?? q.difficulty}</span>
              {q.type === 'multiple' && <span className="rounded-full bg-purple-50 px-2 py-0.5 font-medium text-purple-700">Multi-select</span>}
              {q.type === 'hot_area' && <span className="rounded-full bg-purple-50 px-2 py-0.5 font-medium text-purple-700">Hot Area</span>}
              {q.type === 'matching' && <span className="rounded-full bg-purple-50 px-2 py-0.5 font-medium text-purple-700">Matching</span>}
              {q.type === 'ordering' && <span className="rounded-full bg-purple-50 px-2 py-0.5 font-medium text-purple-700">Build List</span>}
              {q.type === 'case_study' && <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700">Case Study</span>}
            </div>

            {q.caseStudyPrompt && currentIdx === questions.findIndex(x => x.caseStudyId === q.caseStudyId) && (
              <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/50 p-4 sm:p-6 text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {q.caseStudyPrompt}
              </div>
            )}

            <QuestionCard
              question={q}
              selectedIds={answers[q.id] ?? []}
              onSelect={onSelect}
              onSetAnswers={onSetAnswers}
            />

            <div className="mt-6 sm:mt-8 flex items-center justify-between gap-2">
              <button
                onClick={() => onNavigate(Math.max(0, currentIdx - 1))}
                disabled={currentIdx === 0}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-30"
              >
                Previous
              </button>

              <button
                onClick={() => onFlag(q.id)}
                className={`rounded-xl border px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium transition ${
                  flagged.includes(q.id)
                    ? 'border-amber-300 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                {flagged.includes(q.id) ? 'Flagged' : 'Flag for review'}
              </button>

              <button
                onClick={() => onNavigate(Math.min(questions.length - 1, currentIdx + 1))}
                disabled={currentIdx === questions.length - 1}
                className="rounded-xl bg-slate-900 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onToggleNav} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <span className="text-sm font-semibold text-slate-700">Questions</span>
              <button onClick={onToggleNav} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            <NavGrid questions={questions} answers={answers} flagged={flagged} currentIdx={currentIdx} onNavigate={(i) => { onNavigate(i); onToggleNav(); }} />
          </div>
        </div>
      )}
    </main>
  );
}
