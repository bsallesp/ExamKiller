"use client";

import { useParams, useRouter } from 'next/navigation';
import { getActiveExamDefinition, getExamPackage } from '@/lib/exams';
import { LearnView } from '@/app/views/learn';
import { NotFoundView } from '@/app/views/status';
import { practiceSessionUrl, studyHubUrl } from '@/lib/client/routes';

export default function LearnPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const definition = getActiveExamDefinition(code);
  const pkg = definition ? getExamPackage(code) : undefined;

  if (!definition || !pkg) return <NotFoundView message={`Unknown exam "${code}".`} />;

  return (
    <LearnView
      definition={definition}
      pkg={pkg}
      onBack={() => router.push(studyHubUrl(code))}
      onPractice={filters => router.push(practiceSessionUrl(code, filters))}
    />
  );
}
