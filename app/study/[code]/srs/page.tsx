"use client";

import { useParams, useRouter } from 'next/navigation';
import { getActiveExamDefinition } from '@/lib/exams';
import { recordAttempt } from '@/lib/client/api';
import { SrsView } from '@/app/views/srs';
import { NotFoundView } from '@/app/views/status';
import { studyHubUrl } from '@/lib/client/routes';

export default function SrsPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const definition = getActiveExamDefinition(code);

  if (!definition) return <NotFoundView message={`Unknown exam "${code}".`} />;

  return (
    <SrsView
      definition={definition}
      onBack={() => router.push(studyHubUrl(code))}
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
    />
  );
}
