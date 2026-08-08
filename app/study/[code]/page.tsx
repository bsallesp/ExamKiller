"use client";

import { useParams, useRouter } from 'next/navigation';
import { getActiveExamDefinition } from '@/lib/exams';
import { StudyHubView } from '@/app/views/study-hub';
import { NotFoundView } from '@/app/views/status';
import { practiceSetupUrl, learnUrl, srsUrl, progressUrl, homeUrl } from '@/lib/client/routes';

export default function StudyPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const definition = getActiveExamDefinition(code);

  if (!definition) return <NotFoundView message={`Unknown exam "${code}".`} />;

  return (
    <StudyHubView
      definition={definition}
      onBack={() => router.push(homeUrl())}
      onPractice={() => router.push(practiceSetupUrl(code))}
      onLearn={() => router.push(learnUrl(code))}
      onSrs={() => router.push(srsUrl(code))}
      onProgress={() => router.push(progressUrl(code))}
    />
  );
}
