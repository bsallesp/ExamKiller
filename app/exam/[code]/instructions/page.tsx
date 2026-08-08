"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getActiveExamDefinition } from '@/lib/exams';
import { useExamSession } from '@/lib/client/exam-session';
import { InstructionsView } from '@/app/views/instructions';
import { LoadingView, NotFoundView, ErrorView } from '@/app/views/status';
import { examSessionUrl, homeUrl } from '@/lib/client/routes';

export default function InstructionsPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const definition = getActiveExamDefinition(code);
  const {
    examId, questions, loading, error,
    ensureStarted, begin,
  } = useExamSession(code);

  useEffect(() => {
    if (definition) ensureStarted();
  }, [definition, ensureStarted]);

  if (!definition) return <NotFoundView message={`Unknown exam "${code}".`} />;
  if (loading || questions.length === 0) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={ensureStarted} />;

  return (
    <InstructionsView
      questionCount={questions.length}
      durationSeconds={definition.durationSeconds}
      onBegin={() => {
        begin();
        if (examId) router.push(examSessionUrl(code, examId));
      }}
      onCancel={() => router.push(homeUrl())}
    />
  );
}
