import type { StudyPath, StudyPathStep } from './exams/ai-901/path';
import type { SkillStats, SkillState } from './progress';
import { getDueCards, type SrsState } from './srs';

const STATE_RANK: Record<SkillState, number> = { new: 0, learning: 1, reviewing: 2, mastered: 3 };

export interface PathContext {
  skillStats: Record<string, SkillStats>;
  srs: SrsState;
  now: number;
  /** Best mock-exam score per exam code, as a percentage (0-100). */
  examScores?: Record<string, number>;
}

export interface PathStepStatus {
  step: StudyPathStep;
  done: boolean;
}

export interface PathPhaseStatus {
  phaseId: string;
  done: boolean;
  doneSteps: number;
  totalSteps: number;
  steps: PathStepStatus[];
}

export interface PathStatus {
  phases: PathPhaseStatus[];
  overallPercent: number;
  currentStepId: string | null;
}

export function isStepDone(step: StudyPathStep, ctx: PathContext): boolean {
  if (step.kind === 'learn' && step.skills && step.targetState) {
    const rank = STATE_RANK[step.targetState];
    return step.skills.every(skill => {
      const stats = ctx.skillStats[skill];
      return !!stats && STATE_RANK[stats.state] >= rank;
    });
  }

  if (step.kind === 'practice' && step.skills) {
    const minAttempts = step.minAttempts ?? 1;
    const passPercent = step.passPercent ?? 80;
    return step.skills.every(skill => {
      const stats = ctx.skillStats[skill];
      return !!stats && stats.attempts >= minAttempts && stats.percent >= passPercent;
    });
  }

  if (step.kind === 'exam' && step.examCode) {
    return (ctx.examScores?.[step.examCode] ?? 0) >= (step.passPercent ?? 70);
  }

  if (step.kind === 'srs') {
    return getDueCards(ctx.srs, ctx.now).length === 0;
  }

  return false;
}

export function evaluatePath(path: StudyPath, ctx: PathContext): PathStatus {
  let doneTotal = 0;
  let grandTotal = 0;
  let currentStepId: string | null = null;

  const phases: PathPhaseStatus[] = path.phases.map(phase => {
    const steps: PathStepStatus[] = phase.steps.map(step => {
      const done = isStepDone(step, ctx);
      if (!done && currentStepId === null) currentStepId = step.id;
      if (done) doneTotal++;
      grandTotal++;
      return { step, done };
    });
    const doneSteps = steps.filter(s => s.done).length;
    return {
      phaseId: phase.id,
      done: doneSteps === steps.length,
      doneSteps,
      totalSteps: steps.length,
      steps,
    };
  });

  return {
    phases,
    overallPercent: grandTotal === 0 ? 0 : Math.round((doneTotal / grandTotal) * 100),
    currentStepId,
  };
}
