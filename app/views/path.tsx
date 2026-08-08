"use client";

import type { ExamDefinition, ExamPackage } from '@/lib/exams';
import type { StudyPathStep } from '@/lib/exams/ai-901/path';
import { evaluatePath } from '@/lib/path';
import { computeSkillStats } from '@/lib/progress';
import { useExamState } from './use-state';

const STEP_ACTION: Record<StudyPathStep['kind'], string> = {
  learn: 'Read',
  practice: 'Practice',
  exam: 'Take exam',
  srs: 'Review',
};

const KIND_STYLE: Record<StudyPathStep['kind'], string> = {
  learn: 'border-indigo-200 bg-indigo-50/40',
  practice: 'border-emerald-200 bg-emerald-50/40',
  exam: 'border-rose-200 bg-rose-50/40',
  srs: 'border-amber-200 bg-amber-50/40',
};

export function PathView({
  definition,
  pkg,
  onBack,
  onStepAction,
}: {
  definition: ExamDefinition;
  pkg: ExamPackage;
  onBack: () => void;
  onStepAction: (step: StudyPathStep) => void;
}) {
  const { state, loading } = useExamState(definition.code);

  if (!pkg.studyPath) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm text-slate-500">No study path defined for {definition.code.toUpperCase()}.</p>
        </div>
      </main>
    );
  }

  const now = Date.now();
  const path = pkg.studyPath;
  const status = evaluatePath(path, {
    skillStats: computeSkillStats(state?.logs ?? []),
    srs: state?.cards ?? {},
    now,
    examScores: {},
  });

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{definition.certification} · Path</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{path.title}</h1>
          </div>
          <button onClick={onBack} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Back
          </button>
        </header>

        <p className="mt-3 text-sm text-slate-600 leading-relaxed">{path.description}</p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {loading && <p className="text-center text-xs text-slate-400">Loading your progress…</p>}
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Overall progress</p>
            <p className="text-2xl font-bold text-slate-900">{status.overallPercent}%</p>
          </div>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${status.overallPercent}%` }} />
          </div>
          {status.currentStepId && !loading && (
            <p className="mt-3 text-xs text-slate-500">
              Next: <span className="font-semibold text-indigo-700">{stepTitle(path, status.currentStepId)}</span>
            </p>
          )}
        </div>

        <div className="mt-6 space-y-6">
          {path.phases.map(phase => {
            const phaseStatus = status.phases.find(p => p.phaseId === phase.id);
            const doneSteps = phaseStatus?.doneSteps ?? 0;
            return (
              <section key={phase.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-bold text-slate-900">{phase.title}</h2>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${phaseStatus?.done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {doneSteps}/{phaseStatus?.totalSteps ?? 0}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{phase.summary}</p>

                <ol className="mt-4 space-y-3">
                  {phase.steps.map(step => {
                    const stepStatus = phaseStatus?.steps.find(s => s.step.id === step.id);
                    const done = stepStatus?.done ?? false;
                    const current = step.id === status.currentStepId;
                    return (
                      <li key={step.id} className={`rounded-xl border p-4 ${done ? 'border-emerald-200 bg-emerald-50/40' : current ? 'border-indigo-300 bg-indigo-50/60 ring-1 ring-indigo-200' : 'border-slate-200 bg-slate-50/60'}`}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {done ? (
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">✓</span>
                              ) : current ? (
                                <span className="h-5 w-5 shrink-0 rounded-full border-2 border-indigo-500 bg-white" />
                              ) : (
                                <span className="h-5 w-5 shrink-0 rounded-full border-2 border-slate-300 bg-white" />
                              )}
                              <p className={`text-sm font-semibold ${done ? 'text-emerald-800' : current ? 'text-indigo-800' : 'text-slate-800'}`}>{step.title}</p>
                              {current && <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">current</span>}
                            </div>
                            <p className="mt-1.5 text-xs sm:text-sm text-slate-600">{step.description}</p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold text-slate-500 ${KIND_STYLE[step.kind]}`}>
                              {step.kind} · {step.expectedMinutes}m
                            </span>
                            {!done && (
                              <button
                                onClick={() => onStepAction(step)}
                                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                              >
                                {STEP_ACTION[step.kind]}
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function stepTitle(path: ExamPackage['studyPath'], stepId: string): string {
  if (!path) return stepId;
  for (const phase of path.phases) {
    const step = phase.steps.find(s => s.id === stepId);
    if (step) return step.title;
  }
  return stepId;
}
