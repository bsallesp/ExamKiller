import { useCallback, useEffect, useRef, useState } from 'react';
import type { PublicQuestion, ExamResults, ExamFormResponse } from '@/lib/types';
import { getExamDefinition } from '@/lib/exams';
import {
  loadAnswers, saveAnswers,
  loadFlagged, saveFlagged,
  loadTimerStart, saveTimerStart,
  loadExamQuestions, saveExamQuestions,
  saveExamResults, clearExamData,
} from '@/lib/storage';
import { toggleOption } from '@/app/views/shared';

export interface ExamSession {
  examId: string | null;
  questions: PublicQuestion[];
  answers: Record<string, string[]>;
  flagged: string[];
  currentIdx: number;
  timeLeft: number;
  error: string | null;
  loading: boolean;
  submitting: boolean;
  ensureStarted: () => Promise<string | null>;
  begin: () => void;
  select: (qId: string, optId: string, multi: boolean) => void;
  setAnswersFor: (qId: string, ids: string[]) => void;
  toggleFlag: (qId: string) => void;
  setCurrentIdx: (index: number) => void;
  submit: () => Promise<ExamResults>;
}

/**
 * Shared exam session state for the file-based routes:
 * questions are created via GET /api/exam and persisted per examId in
 * localStorage, so session/review/results survive page transitions and
 * hard reloads.
 */
export function useExamSession(
  code: string,
  initial: { examId?: string | null; q?: number } = {},
): ExamSession {
  const definition = getExamDefinition(code);
  const durationSeconds = definition?.durationSeconds ?? 60 * 60;

  const [examId, setExamId] = useState<string | null>(initial.examId ?? null);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [flagged, setFlagged] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(initial.q ?? 0);
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!examId) return;
    const stored = loadExamQuestions(examId);
    if (!stored) return;
    setQuestions(stored);
    setAnswers(loadAnswers(examId));
    setFlagged(loadFlagged(examId));
    const ts = loadTimerStart(examId);
    setTimerStart(ts);
    if (!ts) setTimeLeft(durationSeconds);
  }, [examId, durationSeconds]);

  useEffect(() => {
    if (!timerStart) {
      setTimeLeft(durationSeconds);
      return;
    }
    const tick = () => {
      const left = Math.max(0, durationSeconds - Math.floor((Date.now() - timerStart) / 1000));
      setTimeLeft(left);
      if (left <= 0 && timerRef.current) clearInterval(timerRef.current);
    };
    tick();
    timerRef.current = setInterval(tick, 500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerStart, durationSeconds]);

  const ensureStarted = useCallback(async (): Promise<string | null> => {
    if (questions.length > 0) return examId;
    if (examId && loadExamQuestions(examId)) return examId;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/exam?code=${encodeURIComponent(code)}`);
      const data: ExamFormResponse & { error?: string } = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? 'Failed to create exam');
      saveExamQuestions(data.examId, data.questions);
      setExamId(data.examId);
      setQuestions(data.questions);
      setAnswers({});
      setFlagged([]);
      setTimerStart(null);
      return data.examId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create exam');
      return null;
    } finally {
      setLoading(false);
    }
  }, [code, examId, questions.length]);

  const begin = useCallback(() => {
    if (!examId) return;
    const start = Date.now();
    saveTimerStart(examId, start);
    setTimerStart(start);
  }, [examId]);

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

  const submit = useCallback(async (): Promise<ExamResults> => {
    if (!examId) throw new Error('No exam in progress');
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId, answers }),
      });
      const data: ExamResults & { error?: string } = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? 'Failed to submit exam');
      saveExamResults(data.examId, data);
      clearExamData(examId);
      if (timerRef.current) clearInterval(timerRef.current);
      setTimerStart(null);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit exam');
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [examId, answers]);

  return {
    examId, questions, answers, flagged, currentIdx, timeLeft,
    error, loading, submitting,
    ensureStarted, begin, select, setAnswersFor, toggleFlag, setCurrentIdx, submit,
  };
}
