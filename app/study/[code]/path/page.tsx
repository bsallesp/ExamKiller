"use client";

import { useParams, useRouter } from 'next/navigation';
import { getActiveExamDefinition, getExamPackage } from '@/lib/exams';
import type { StudyPathStep } from '@/lib/exams/ai-901/path';
import { PathView } from '@/app/views/path';
import { NotFoundView } from '@/app/views/status';
import { homeUrl, learnUrl, practiceSessionUrl, srsUrl, examInstructionsUrl } from '@/lib/client/routes';

export default function PathPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const definition = getActiveExamDefinition(code);
  const pkg = definition ? getExamPackage(code) : undefined;

  if (!definition || !pkg) return <NotFoundView message={`Unknown exam "${code}".`} />;

  const onStepAction = (step: StudyPathStep) => {
    switch (step.kind) {
      case 'learn':
        router.push(learnUrl(code));
        return;
      case 'practice':
        router.push(
          practiceSessionUrl(code, {
            domains: [],
            difficulties: [],
            skills: step.skills ?? [],
            limit: step.questionLimit ?? 10,
            conceptFamilyIds: [],
          }),
        );
        return;
      case 'exam':
        router.push(examInstructionsUrl(code));
        return;
      case 'srs':
        router.push(srsUrl(code));
        return;
    }
  };

  return <PathView definition={definition} pkg={pkg} onBack={() => router.push(homeUrl())} onStepAction={onStepAction} />;
}
