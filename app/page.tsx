"use client";

import { useRouter } from 'next/navigation';
import { JourneyView } from '@/app/views/journey';

export default function Home() {
  const router = useRouter();

  return (
    <JourneyView
      loading={false}
      onLearn={code => router.push(`/study/${code}`)}
      onPath={code => router.push(`/study/${code}/path`)}
      onSimulate={code => router.push(`/exam/${code}/instructions`)}
    />
  );
}
