"use client";

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getActiveExamDefinition } from '@/lib/exams';
import { loadExamResults } from '@/lib/storage';
import { recordMissed } from '@/lib/client/api';
import { ResultsView } from '@/app/views/results';
import { LoadingView, NotFoundView } from '@/app/views/status';
import { parseExamSessionParams, examInstructionsUrl, homeUrl } from '@/lib/client/routes';

function ResultsRoute() {
  const { code } = useParams<{ code: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const definition = getActiveExamDefinition(code);
  const { examId } = parseExamSessionParams(search);
  const [mounted, setMounted] = useState(false);
  const results = mounted && examId ? loadExamResults(examId) : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!definition) return <NotFoundView message={`Unknown exam "${code}".`} />;
  if (!mounted) return <LoadingView />;

  if (!results) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">No results found</h1>
          <p className="mt-2 text-sm text-slate-600">
            This exam has no stored results. Start a new simulation to get scored.
          </p>
          <button
            onClick={() => router.push(examInstructionsUrl(code))}
            className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Start new exam
          </button>
          <button
            onClick={() => router.push(homeUrl())}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Back to journey
          </button>
        </div>
      </main>
    );
  }

  return (
    <ResultsView
      results={results}
      title={definition.certification}
      onNewExam={() => router.push(examInstructionsUrl(code))}
      onAddMissed={missed => {
        recordMissed(code, missed.map(q => q.conceptFamilyId)).catch(() => {});
      }}
      onBackToJourney={() => router.push(homeUrl())}
    />
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<LoadingView />}>
      <ResultsRoute />
    </Suspense>
  );
}
