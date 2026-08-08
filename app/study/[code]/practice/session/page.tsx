"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getActiveExamDefinition } from '@/lib/exams';
import type { StudyQuestion } from '@/lib/types';
import { recordAttempt } from '@/lib/client/api';
import { parseStudyFilters, serializeStudyFilters } from '@/lib/client/study-query';
import { studyHubUrl } from '@/lib/client/routes';
import { PracticeSessionView } from '@/app/views/practice-session';
import { LoadingView, NotFoundView, ErrorView } from '@/app/views/status';

function PracticeSessionRoute() {
  const { code } = useParams<{ code: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const definition = getActiveExamDefinition(code);
  const filters = useMemo(() => parseStudyFilters(search), [search]);
  const [questions, setQuestions] = useState<StudyQuestion[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = serializeStudyFilters(filters);
    params.set('code', code);
    fetch(`/api/study?${params.toString()}`)
      .then(r => r.json())
      .then((data: { questions?: StudyQuestion[]; error?: string }) => {
        if (data.error) throw new Error(data.error);
        setQuestions(data.questions ?? []);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load session'))
      .finally(() => setLoading(false));
  }, [code, filters]);

  useEffect(() => {
    load();
  }, [load]);

  if (!definition) return <NotFoundView message={`Unknown exam "${code}".`} />;
  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={load} />;
  if (!questions) return <LoadingView />;
  if (questions.length === 0) {
    return (
      <ErrorView
        message="No questions match the selected filters."
        onRetry={load}
      />
    );
  }

  return (
    <PracticeSessionView
      questions={questions}
      onGraded={(q, correct, confidence) => {
        recordAttempt(code, {
          conceptFamilyId: q.conceptFamilyId,
          skill: q.skill,
          domain: q.domain,
          difficulty: q.difficulty,
          correct,
          confidence,
          errorTag: q.errorTag,
        }).catch(() => {});
      }}
      onExit={() => router.push(studyHubUrl(code))}
      onRetry={load}
    />
  );
}

export default function PracticeSessionPage() {
  return (
    <Suspense fallback={<LoadingView />}>
      <PracticeSessionRoute />
    </Suspense>
  );
}
