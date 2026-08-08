"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PublicQuestion, ExamResults, ExamFormResponse, GradedQuestion, StudyQuestion, Confidence } from '@/lib/types';
import {
  loadAnswers, saveAnswers,
  loadFlagged, saveFlagged,
  loadTimerStart, saveTimerStart, clearExamData,
} from '@/lib/storage';
import { recordAttempt, recordMissed } from '@/lib/client/api';
import { migrateLegacyStateOnce } from '@/lib/client/migrate';
import { getExamDefinition, getExamPackage } from '@/lib/exams';
import type { StudyFilters } from '@/app/views/shared';
import { toggleOption } from '@/app/views/shared';
import { JourneyView } from '@/app/views/journey';
import { InstructionsView } from '@/app/views/instructions';
import { ReviewView } from '@/app/views/review';
import { ExamView } from '@/app/views/exam';
import { ResultsView } from '@/app/views/results';
import { StudyHubView } from '@/app/views/study-hub';
import { PracticeSetupView } from '@/app/views/practice-setup';
import { PracticeSessionView } from '@/app/views/practice-session';
import { LearnView } from '@/app/views/learn';
import { SrsView } from '@/app/views/srs';
import { ProgressView } from '@/app/views/progress';

type View = 'home' | 'instructions' | 'exam' | 'review' | 'results'
  | 'study' | 'practice' | 'practice-setup' | 'learn' | 'srs' | 'progress';

export default function Home() {
  const [view, setView] = useState<View>('home');
  const [examCode, setExamCode] = useState('ai-901');
  const [examSeconds, setExamSeconds] = useState(60 * 60);

  const [examId, setExamId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [flagged, setFlagged] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ExamResults | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [studyQuestions, setStudyQuestions] = useState<StudyQuestion[]>([]);
  const [studyFilters, setStudyFilters] = useState<StudyFilters | null>(null);

  // ── legacy localStorage → database migration (one-shot) ──

  useEffect(() => {
    migrateLegacyStateOnce().catch(() => {});
  }, []);

  // ── navigation helpers ──

  const openExamHub = useCallback((code: string) => {
    setExamCode(code);
    setExamSeconds(getExamDefinition(code)?.durationSeconds ?? 60 * 60);
    setView('study');
  }, []);

  // ── study session ──

  const startStudySession = useCallback((filters: StudyFilters) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set('code', examCode);
    if (filters.domains.length > 0) params.set('domains', filters.domains.join(','));
    if (filters.difficulties.length > 0) params.set('difficulties', filters.difficulties.join(','));
    if (filters.skills.length > 0) params.set('skills', filters.skills.join(','));
    if (filters.conceptFamilyIds.length > 0) params.set('ids', filters.conceptFamilyIds.join(','));
    params.set('limit', String(filters.limit));
    fetch(`/api/study?${params.toString()}`)
      .then(r => r.json())
      .then((data: { questions?: StudyQuestion[]; error?: string }) => {
        if (data.error) throw new Error(data.error);
        setStudyQuestions(data.questions ?? []);
        setStudyFilters(filters);
        setView('practice');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [examCode]);

  const handleStudyGraded = useCallback((q: StudyQuestion, correct: boolean, confidence: Confidence) => {
    recordAttempt(examCode, {
      conceptFamilyId: q.conceptFamilyId,
      skill: q.skill,
      domain: q.domain,
      difficulty: q.difficulty,
      correct,
      confidence,
      errorTag: q.errorTag,
    }).catch(err => setError(err instanceof Error ? err.message : 'Failed to save progress'));
  }, [examCode]);

  const addMissedToReview = useCallback((missed: GradedQuestion[]) => {
    recordMissed(examCode, missed.map(q => q.conceptFamilyId)).catch(
      err => setError(err instanceof Error ? err.message : 'Failed to save missed questions'),
    );
  }, [examCode]);

  // ── exam flow ──

  const startNewExam = useCallback((code?: string) => {
    const target = code ?? examCode;
    setExamCode(target);
    setLoading(true);
    setError(null);
    setResults(null);
    const definition = getExamDefinition(target);
    if (!definition) return;
    setExamSeconds(definition.durationSeconds);
    setTimeLeft(definition.durationSeconds);
    fetch(`/api/exam?code=${target}`)
      .then(r => r.json())
      .then((data: ExamFormResponse & { error?: string }) => {
        if (data.error) throw new Error(data.error);
        setExamId(data.examId);
        setQuestions(data.questions);
        setAnswers({});
        setFlagged([]);
        setCurrentIdx(0);
        setView('instructions');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [examCode]);

  const beginExam = useCallback(() => {
    if (!examId) return;
    const start = Date.now();
    setTimerStart(start);
    saveTimerStart(examId, start);
    setView('exam');
  }, [examId]);

  const endExam = useCallback(() => {
    setView('review');
  }, []);

  // ── timer ──

  useEffect(() => {
    if (!timerStart) { setTimeLeft(examSeconds); return; }
    const tick = () => {
      const left = Math.max(0, examSeconds - Math.floor((Date.now() - timerStart) / 1000));
      setTimeLeft(left);
      if (left <= 0) clearInterval(timerRef.current!);
    };
    tick();
    timerRef.current = setInterval(tick, 500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerStart, examSeconds]);

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

  useEffect(() => {
    if ((view === 'exam' || view === 'review') && timeLeft <= 0 && !submitting) submitExam();
  }, [timeLeft, view, submitting, submitExam]);

  // ── exam answer handlers ──

  const select = useCallback((qId: string, optId: string, multi: boolean) => {
    setAnswers(prev => {
      const next = { ...prev, [qId]: toggleOption(prev[qId] ?? [], optId, multi) };
      if (examId) saveAnswers(examId, next);
      return next;
    });
  }, [examId]);

  const setAnswersFor = useCallback((qId: string, ids: string[]) => {
    setAnswers(prev => {
      const next = { ...prev, [qId]: ids };
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
          <p className="mt-4 text-slate-500">Loading…</p>
        </div>
      </main>
    );
  }

  if (view === 'results' && results) {
    return (
      <ResultsView
        results={results}
        title={getExamDefinition(examCode)?.certification ?? examCode.toUpperCase()}
        onNewExam={startNewExam}
        onAddMissed={addMissedToReview}
        onBackToJourney={() => setView('home')}
      />
    );
  }

  if (view === 'review' && questions.length > 0) {
    return (
      <ReviewView
        questions={questions}
        answers={answers}
        flagged={flagged}
        timeLeft={timeLeft}
        submitting={submitting}
        onReturn={i => { setCurrentIdx(i); setView('exam'); }}
        onSubmit={submitExam}
      />
    );
  }

  if (view === 'instructions' && questions.length > 0) {
    return (
      <InstructionsView
        questionCount={questions.length}
        durationSeconds={examSeconds}
        onBegin={beginExam}
        onCancel={() => { setExamId(null); setQuestions([]); setView('home'); }}
      />
    );
  }

  if (view === 'exam' && questions.length > 0) {
    const definition = getExamDefinition(examCode);
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
        title={definition?.certification ?? examCode.toUpperCase()}
        onSelect={select}
        onSetAnswers={setAnswersFor}
        onFlag={toggleFlag}
        onNavigate={setCurrentIdx}
        onEndExam={endExam}
        onNewExam={startNewExam}
        onToggleNav={() => setNavOpen(v => !v)}
      />
    );
  }

  if (view === 'practice' && studyQuestions.length > 0) {
    return (
      <PracticeSessionView
        questions={studyQuestions}
        onGraded={handleStudyGraded}
        onExit={() => { setStudyQuestions([]); setView('study'); }}
        onRetry={() => studyFilters && startStudySession(studyFilters)}
      />
    );
  }

  const definition = getExamDefinition(examCode);
  const pkg = getExamPackage(examCode);

  if (view === 'learn' && definition && pkg) {
    return <LearnView definition={definition} pkg={pkg} onBack={() => setView('study')} onPractice={startStudySession} />;
  }

  if (view === 'srs' && definition) {
    return <SrsView definition={definition} onBack={() => setView('study')} onGraded={handleStudyGraded} />;
  }

  if (view === 'progress' && definition) {
    return <ProgressView definition={definition} onBack={() => setView('study')} onPractice={startStudySession} />;
  }

  if (view === 'study' && definition) {
    return (
      <StudyHubView
        definition={definition}
        onBack={() => setView('home')}
        onPractice={() => setView('practice-setup')}
        onLearn={() => setView('learn')}
        onSrs={() => setView('srs')}
        onProgress={() => setView('progress')}
      />
    );
  }

  if (view === 'practice-setup' && definition) {
    return <PracticeSetupView definition={definition} onBack={() => setView('study')} onStart={startStudySession} />;
  }

  return (
    <JourneyView
      error={error ?? undefined}
      loading={loading}
      onLearn={code => openExamHub(code)}
      onSimulate={code => startNewExam(code)}
    />
  );
}
