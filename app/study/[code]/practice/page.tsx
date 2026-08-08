"use client";

import { useParams, useRouter } from 'next/navigation';
import { getActiveExamDefinition } from '@/lib/exams';
import { PracticeSetupView } from '@/app/views/practice-setup';
import { NotFoundView } from '@/app/views/status';
import { practiceSessionUrl, studyHubUrl } from '@/lib/client/routes';

export default function PracticeSetupPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const definition = getActiveExamDefinition(code);

  if (!definition) return <NotFoundView message={`Unknown exam "${code}".`} />;

  return (
    <PracticeSetupView
      definition={definition}
      onBack={() => router.push(studyHubUrl(code))}
      onStart={filters => router.push(practiceSessionUrl(code, filters))}
    />
  );
}
