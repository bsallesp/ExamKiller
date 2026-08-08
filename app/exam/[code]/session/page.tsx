"use client";

import { Suspense, useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getActiveExamDefinition } from '@/lib/exams';
import { useExamSession } from '@/lib/client/exam-session';
import { ExamView } from '@/app/views/exam';
import { LoadingView, NotFoundView, ErrorView } from '@/app/views/status';
import {
  parseExamSessionParams, examSessionUrl, examReviewUrl, examResultsUrl, examInstructionsUrl,
} from '@/lib/client/routes';

function SessionRoute() {
  const { code } = useParams<{ code: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const definition = getActiveExamDefinition(code);
  const { examId: urlExamId, q } = parseExamSessionParams(search);
  const {
    examId, questions, answers, flagged, currentIdx, timeLeft, error, loading, submitting,
    ensureStarted, select, setAnswersFor, toggleFlag, setCurrentIdx, submit,
  } = useExamSession(code, { examId: urlExamId, q });
  const [navOpen, setNavOpen] = useState(false);
  const autoSubmitted = useRef(false);

  useEffect(() => {
    if (definition) ensureStarted();
  }, [definition, ensureStarted]);

  useEffect(() => {
    if (examId && examId !== urlExamId) {
      router.replace(examSessionUrl(code, examId, currentIdx));
    }
  }, [examId, currentIdx, urlExamId, router, code]);

  useEffect(() => {
    if (timeLeft <= 0 && examId && !submitting && !autoSubmitted.current) {
      autoSubmitted.current = true;
      submit()
        .then(r => router.push(examResultsUrl(code, r.examId)))
        .catch(() => {});
    }
  }, [timeLeft, examId, submitting, submit, router, code]);

  if (!definition) return <NotFoundView message={`Unknown exam "${code}".`} />;
  if (loading || questions.length === 0) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={ensureStarted} />;

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
      title={definition.certification}
      onSelect={select}
      onSetAnswers={setAnswersFor}
      onFlag={toggleFlag}
      onNavigate={setCurrentIdx}
      onEndExam={() => examId && router.push(examReviewUrl(code, examId))}
      onNewExam={() => router.push(examInstructionsUrl(code))}
      onToggleNav={() => setNavOpen(v => !v)}
    />
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={<LoadingView />}>
      <SessionRoute />
    </Suspense>
  );
}
