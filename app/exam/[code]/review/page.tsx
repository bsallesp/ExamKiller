"use client";

import { Suspense, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getActiveExamDefinition } from '@/lib/exams';
import { useExamSession } from '@/lib/client/exam-session';
import { ReviewView } from '@/app/views/review';
import { LoadingView, NotFoundView } from '@/app/views/status';
import {
  parseExamSessionParams, examSessionUrl, examReviewUrl, examResultsUrl, examInstructionsUrl,
} from '@/lib/client/routes';

function ReviewRoute() {
  const { code } = useParams<{ code: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const definition = getActiveExamDefinition(code);
  const { examId } = parseExamSessionParams(search);
  const {
    examId: sessionExamId, questions, answers, flagged, timeLeft, submitting,
    ensureStarted, submit,
  } = useExamSession(code, { examId });
  const autoSubmitted = useRef(false);

  useEffect(() => {
    if (!definition) return;
    if (!examId) {
      router.replace(examInstructionsUrl(code));
      return;
    }
    if (questions.length === 0) ensureStarted();
  }, [definition, examId, questions.length, ensureStarted, router, code]);

  useEffect(() => {
    if (sessionExamId && sessionExamId !== examId) {
      router.replace(examReviewUrl(code, sessionExamId));
    }
  }, [sessionExamId, examId, router, code]);

  useEffect(() => {
    if (timeLeft <= 0 && sessionExamId && !submitting && !autoSubmitted.current) {
      autoSubmitted.current = true;
      submit()
        .then(r => router.push(examResultsUrl(code, r.examId)))
        .catch(() => {});
    }
  }, [timeLeft, sessionExamId, submitting, submit, router, code]);

  if (!definition) return <NotFoundView message={`Unknown exam "${code}".`} />;
  if (questions.length === 0) return <LoadingView />;

  return (
    <ReviewView
      questions={questions}
      answers={answers}
      flagged={flagged}
      timeLeft={timeLeft}
      submitting={submitting}
      onReturn={i => sessionExamId && router.push(examSessionUrl(code, sessionExamId, i))}
      onSubmit={() => {
        submit()
          .then(r => router.push(examResultsUrl(code, r.examId)))
          .catch(() => {});
      }}
    />
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<LoadingView />}>
      <ReviewRoute />
    </Suspense>
  );
}
