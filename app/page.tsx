"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PublicQuestion, ExamResults, ExamFormResponse } from '@/lib/types';
import {
  loadAnswers, saveAnswers,
  loadFlagged, saveFlagged,
  loadTimerStart, saveTimerStart, clearExamData,
} from '@/lib/storage';

const EXAM_SECONDS = 100 * 60;

// ── helpers ──────────────────────────────────────────────────────

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function toggleOption(current: string[], id: string, multi: boolean): string[] {
  if (multi) return current.includes(id) ? current.filter(x => x !== id) : [...current, id];
  return [id];
}

// ── domain colors ───────────────────────────────────────────────

const DOMAIN_COLORS: Record<string, string> = {
  'Identity and Governance': 'bg-indigo-500',
  Storage: 'bg-emerald-500',
  Compute: 'bg-amber-500',
  Networking: 'bg-cyan-500',
  'Monitoring and Recovery': 'bg-rose-500',
};

const DOMAIN_BG: Record<string, string> = {
  'Identity and Governance': 'bg-indigo-50 text-indigo-700',
  Storage: 'bg-emerald-50 text-emerald-700',
  Compute: 'bg-amber-50 text-amber-700',
  Networking: 'bg-cyan-50 text-cyan-700',
  'Monitoring and Recovery': 'bg-rose-50 text-rose-700',
};

const DIFF_LABEL: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const READINESS_META: Record<string, { label: string; border: string; bg: string; text: string }> = {
  ready: { label: 'Ready', border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  'almost ready': { label: 'Almost Ready', border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700' },
  'not ready': { label: 'Not Ready', border: 'border-rose-200', bg: 'bg-rose-50', text: 'text-rose-700' },
};

// ── page ────────────────────────────────────────────────────────

type View = 'home' | 'exam' | 'results';

export default function Home() {
  const [view, setView] = useState<View>('home');
  const [examId, setExamId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [flagged, setFlagged] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(EXAM_SECONDS);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ExamResults | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── load exam ──

  const startNewExam = useCallback(() => {
    setLoading(true);
    setError(null);
    setResults(null);
    fetch('/api/exam')
      .then(r => r.json())
      .then((data: ExamFormResponse & { error?: string }) => {
        if (data.error) throw new Error(data.error);
        const start = Date.now();
        setExamId(data.examId);
        setQuestions(data.questions);
        setAnswers({});
        setFlagged([]);
        setCurrentIdx(0);
        setTimerStart(start);
        saveTimerStart(data.examId, start);
        setView('exam');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // ── timer ──

  useEffect(() => {
    if (!timerStart) { setTimeLeft(EXAM_SECONDS); return; }
    const tick = () => {
      const left = Math.max(0, EXAM_SECONDS - Math.floor((Date.now() - timerStart) / 1000));
      setTimeLeft(left);
      if (left <= 0) clearInterval(timerRef.current!);
    };
    tick();
    timerRef.current = setInterval(tick, 500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerStart]);

  // ── submit ──

  const submitExam = useCallback(() => {
    if (!examId) return;
    setSubmitting(true);
    setError(null);
    fetch('/api/exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examId, answers }),
    })
      .then(r => r.json())
      .then((data: ExamResults & { error?: string }) => {
        if (data.error) throw new Error(data.error);
        setResults(data);
        clearExamData(examId);
        if (timerRef.current) clearInterval(timerRef.current);
        setView('results');
      })
      .catch(err => setError(err.message))
      .finally(() => setSubmitting(false));
  }, [examId, answers]);

  // ── auto-submit on timeout ──

  useEffect(() => {
    if (view === 'exam' && timeLeft <= 0 && !submitting) submitExam();
  }, [timeLeft, view, submitting, submitExam]);

  // ── answer handlers ──

  const select = useCallback((qId: string, optId: string, multi: boolean) => {
    setAnswers(prev => {
      const next = { ...prev, [qId]: toggleOption(prev[qId] ?? [], optId, multi) };
      if (examId) saveAnswers(examId, next);
      return next;
    });
  }, [examId]);

  const toggleFlag = useCallback((qId: string) => {
    setFlagged(prev => {
      const next = prev.includes(qId) ? prev.filter(x => x !== qId) : [...prev, qId];
      if (examId) saveFlagged(examId, next);
      return next;
    });
  }, [examId]);

  // ── restore persisted session ──

  useEffect(() => {
    if (view === 'exam' && examId) {
      const saved = loadAnswers(examId);
      if (Object.keys(saved).length > 0) setAnswers(saved);
      const f = loadFlagged(examId);
      if (f.length > 0) setFlagged(f);
      const ts = loadTimerStart(examId);
      if (ts) setTimerStart(ts);
    }
  }, [view, examId]);

  // ── render ──

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
          <p className="mt-4 text-slate-500">Generating your exam…</p>
        </div>
      </main>
    );
  }

  if (view === 'results' && results) return <ResultsView results={results} onNewExam={startNewExam} />;
  if (view === 'exam' && questions.length > 0) {
    return (
      <ExamView
        questions={questions}
        answers={answers}
        flagged={flagged}
        currentIdx={currentIdx}
        timeLeft={timeLeft}
        error={error}
        submitting={submitting}
        navOpen={navOpen}
        onSelect={select}
        onFlag={toggleFlag}
        onNavigate={setCurrentIdx}
        onSubmit={submitExam}
        onNewExam={startNewExam}
        onToggleNav={() => setNavOpen(v => !v)}
      />
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <HomeView error={error ?? undefined} onStart={startNewExam} />
    </main>
  );
}

// ── HomeView ─────────────────────────────────────────────────────────

function HomeView({ error, onStart }: { error?: string; onStart: () => void }) {
  return (
    <div className="w-full max-w-lg text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">AZ-104</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">Practice Exam</h1>
      <p className="mt-4 text-slate-600 leading-relaxed">
        55 questions · 100 minutes · Timed session with auto-save.
        Covers all five AZ-104 domains with the official blueprint distribution.
        Your answers are saved in your browser — you can resume if you refresh.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 text-left text-sm text-slate-600">
        {Object.entries(DOMAIN_COLORS).map(([name, color]) => (
          <div key={name} className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm border border-slate-200">
            <span className={`h-3 w-3 rounded-full ${color}`} />
            {name}
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      )}

      <button
        onClick={onStart}
        className="mt-8 w-full rounded-2xl bg-slate-900 px-6 py-4 text-lg font-semibold text-white transition hover:bg-slate-700 active:scale-[0.98]"
      >
        Start Exam
      </button>
    </div>
  );
}

// ── ExamView ─────────────────────────────────────────────────────────

function ExamView({
  questions, answers, flagged, currentIdx, timeLeft,
  error, submitting, navOpen,
  onSelect, onFlag, onNavigate, onSubmit, onNewExam, onToggleNav,
}: {
  questions: PublicQuestion[];
  answers: Record<string, string[]>;
  flagged: string[];
  currentIdx: number;
  timeLeft: number;
  error: string | null;
  submitting: boolean;
  navOpen: boolean;
  onSelect: (qId: string, optId: string, multi: boolean) => void;
  onFlag: (qId: string) => void;
  onNavigate: (i: number) => void;
  onSubmit: () => void;
  onNewExam: () => void;
  onToggleNav: () => void;
}) {
  const q = questions[currentIdx];
  if (!q) return null;

  const timerColor = timeLeft <= 300 ? 'text-rose-600' : timeLeft <= 900 ? 'text-amber-600' : 'text-slate-700';
  const answeredCount = Object.values(answers).filter(a => a.length > 0).length;

  return (
    <main className="flex h-screen flex-col bg-slate-100">
      {/* top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between px-3 py-2.5 sm:px-6">
          <button onClick={onToggleNav} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 lg:hidden">
            Q {currentIdx + 1}/55
          </button>
          <span className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 lg:inline">AZ-104 Simulator</span>

          <div className="flex items-center gap-3">
            <span className={`text-lg sm:text-xl font-mono font-bold tracking-tight ${timerColor}`}>{formatTime(timeLeft)}</span>
            {timeLeft <= 0 && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">TIME</span>}
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-slate-400 sm:inline">{answeredCount}/55</span>
            <button
              onClick={onSubmit}
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
        {/* desktop sidebar */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-shrink-0 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white">
          <NavGrid
            questions={questions}
            answers={answers}
            flagged={flagged}
            currentIdx={currentIdx}
            onNavigate={onNavigate}
          />
        </aside>

        {/* main content */}
        <div className="flex flex-1 flex-col overflow-auto">
          <div className="mx-auto w-full max-w-3xl p-4 sm:p-6 lg:p-8">
            {/* breadcrumb */}
            <div className="mb-4 flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs">
              <span className="font-semibold text-slate-400">Question {currentIdx + 1} of 55</span>
              <span className={`rounded-full px-2 py-0.5 font-medium ${DOMAIN_BG[q.domain] || 'bg-slate-100 text-slate-600'}`}>{q.domain}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-500">{DIFF_LABEL[q.difficulty] ?? q.difficulty}</span>
              {q.type === 'multiple' && <span className="rounded-full bg-purple-50 px-2 py-0.5 font-medium text-purple-700">Multi-select</span>}
              {q.type === 'case_study' && <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700">Case Study</span>}
            </div>

            {/* case study prompt */}
            {q.caseStudyPrompt && currentIdx === questions.findIndex(x => x.caseStudyId === q.caseStudyId) && (
              <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/50 p-4 sm:p-6 text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {q.caseStudyPrompt}
              </div>
            )}

            {/* question card */}
            <QuestionCard
              question={q}
              selectedIds={answers[q.id] ?? []}
              isFlagged={flagged.includes(q.id)}
              onSelect={onSelect}
              onFlag={onFlag}
            />

            {/* nav buttons */}
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

      {/* mobile drawer */}
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

// ── QuestionCard ────────────────────────────────────────────────────

function QuestionCard({
  question, selectedIds, isFlagged, onSelect, onFlag,
}: {
  question: PublicQuestion;
  selectedIds: string[];
  isFlagged: boolean;
  onSelect: (qId: string, optId: string, multi: boolean) => void;
  onFlag: (qId: string) => void;
}) {
  const multi = question.type === 'multiple';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
      <h2 className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">{question.stem}</h2>
      <p className="mt-2 text-xs sm:text-sm text-slate-500">{question.skill}</p>
      <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-600">
        {question.instruction}
      </div>

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
    </div>
  );
}

// ── NavGrid ─────────────────────────────────────────────────────────

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

// ── ResultsView ─────────────────────────────────────────────────────

function ResultsView({ results, onNewExam }: { results: ExamResults; onNewExam: () => void }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const meta = READINESS_META[results.readiness];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-4xl space-y-5 sm:space-y-6">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">AZ-104 Readiness Simulator</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">Exam Results</h1>
        </header>

        {/* score cards */}
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

        {/* domain & difficulty breakdown */}
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
                    <div className={`h-full rounded-full transition-all ${DOMAIN_COLORS[domain] || 'bg-slate-400'}`} style={{ width: `${s.percent}%` }} />
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

        {/* weak domains */}
        {results.weakDomains.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
            <p className="text-sm font-semibold text-amber-800">Focus areas</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-amber-700 space-y-1">
              {results.weakDomains.map(d => <li key={d}>{d}</li>)}
            </ul>
          </div>
        )}

        {/* question review */}
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
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${DOMAIN_BG[q.domain] || 'bg-slate-100'}`}>{q.domain}</span>
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{DIFF_LABEL[q.difficulty]}</span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-slate-800 line-clamp-2">{q.stem}</p>
                    </div>
                    <span className="text-slate-400 flex-shrink-0 mt-1">{show ? '▴' : '▾'}</span>
                  </button>

                  {show && (
                    <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center pb-8">
          <button onClick={onNewExam} className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700">
            Start New Exam
          </button>
        </div>
      </div>
    </main>
  );
}
