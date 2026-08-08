"use client";

import { useParams, useRouter } from 'next/navigation';
import { getActiveExamDefinition } from '@/lib/exams';
import { ProgressView } from '@/app/views/progress';
import { NotFoundView } from '@/app/views/status';
import { practiceSessionUrl, studyHubUrl } from '@/lib/client/routes';

export default function ProgressPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const definition = getActiveExamDefinition(code);

  if (!definition) return <NotFoundView message={`Unknown exam "${code}".`} />;

  return (
    <ProgressView
      definition={definition}
      onBack={() => router.push(studyHubUrl(code))}
      onPractice={filters => router.push(practiceSessionUrl(code, filters))}
    />
  );
}
