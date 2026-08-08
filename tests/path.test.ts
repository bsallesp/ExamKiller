import { describe, expect, it } from 'vitest';
import { studyPath } from '../lib/exams/ai-901/path';
import { getExamPackage } from '../lib/exams';
import { isStepDone, evaluatePath } from '../lib/path';
import type { PathContext } from '../lib/path';
import type { SkillStats } from '../lib/progress';
import type { SrsState } from '../lib/srs';

const S1 = 'Describe principles of responsible AI';
const S2 = 'Identify AI model components and configurations';

function stats(skill: string, attempts: number, correct: number, stability: number): SkillStats {
  return {
    skill,
    domain: 'Identify AI concepts and capabilities',
    attempts,
    correct,
    percent: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
    lastSeenAt: 0,
    stability,
    state: stability >= 21 && correct / Math.max(1, attempts) >= 0.8 ? 'mastered' : stability >= 7 ? 'reviewing' : stability >= 1 ? 'learning' : 'new',
  };
}

function ctx(overrides: Partial<PathContext> = {}): PathContext {
  return {
    skillStats: {},
    srs: {} as SrsState,
    now: Date.now(),
    examScores: {},
    ...overrides,
  };
}

describe('ai-901 study path content', () => {
  it('is registered in the exam package', () => {
    expect(getExamPackage('ai-901')?.studyPath).toBeDefined();
  });

  it('covers all seven blueprint skills across its steps', () => {
    const skills = new Set(studyPath.phases.flatMap(p => p.steps.flatMap(s => s.skills ?? [])));
    expect(skills.size).toBe(7);
    expect(skills).toContain('Describe principles of responsible AI');
    expect(skills).toContain('Implement AI solutions for information extraction by using Foundry');
  });

  it('has a unique id per step', () => {
    const ids = studyPath.phases.flatMap(p => p.steps.map(s => s.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ends with a mock exam phase and a maintenance phase', () => {
    const kinds = studyPath.phases.map(p => p.steps.map(s => s.kind));
    expect(kinds[kinds.length - 2]).toContain('exam');
    expect(kinds[kinds.length - 1]).toContain('srs');
  });
});

describe('isStepDone', () => {
  it('learn step requires the skill to reach the target state', () => {
    const learn = studyPath.phases[0].steps[0];
    expect(learn.kind).toBe('learn');
    expect(isStepDone(learn, ctx({ skillStats: { [S1]: stats(S1, 1, 1, 1) } }))).toBe(true);
    expect(isStepDone(learn, ctx())).toBe(false);
  });

  it('practice step requires enough attempts at the pass percent', () => {
    const practice = studyPath.phases[0].steps[1];
    expect(practice.kind).toBe('practice');
    expect(isStepDone(practice, ctx({ skillStats: { [S1]: stats(S1, 5, 5, 1) } }))).toBe(true);
    expect(isStepDone(practice, ctx({ skillStats: { [S1]: stats(S1, 5, 3, 1) } }))).toBe(false);
    expect(isStepDone(practice, ctx({ skillStats: { [S1]: stats(S1, 2, 2, 1) } }))).toBe(false);
  });

  it('exam step requires the pass score', () => {
    const exam = studyPath.phases[5].steps[0];
    expect(exam.kind).toBe('exam');
    expect(isStepDone(exam, ctx({ examScores: { 'ai-901': 75 } }))).toBe(true);
    expect(isStepDone(exam, ctx({ examScores: { 'ai-901': 60 } }))).toBe(false);
  });

  it('srs step is done when no cards are due', () => {
    const srs = studyPath.phases[6].steps[0];
    expect(srs.kind).toBe('srs');
    const now = Date.now();
    const dueCard = {
      conceptFamilyId: 'ai901-q1', stability: 1, difficulty: 5,
      dueAt: now - 1000, reps: 1, lapses: 0, lastReviewedAt: 0,
    };
    expect(isStepDone(srs, ctx({ now, srs: { 'ai901-q1': dueCard } }))).toBe(false);
    expect(isStepDone(srs, ctx({ now, srs: {} as SrsState }))).toBe(true);
  });
});

describe('evaluatePath', () => {
  it('starts nearly empty and identifies the first step as current', () => {
    const status = evaluatePath(studyPath, ctx());
    const totalSteps = studyPath.phases.reduce((n, p) => n + p.steps.length, 0);
    expect(status.overallPercent).toBe(Math.round((1 / totalSteps) * 100));
    expect(status.currentStepId).toBe(studyPath.phases[0].steps[0].id);
  });

  it('progresses when skills are practiced to the pass percent', () => {
    const status = evaluatePath(studyPath, ctx({
      skillStats: {
        [S1]: stats(S1, 5, 5, 1),
        [S2]: stats(S2, 5, 5, 1),
      },
    }));
    expect(status.overallPercent).toBeGreaterThan(0);
    expect(status.overallPercent).toBeLessThan(100);
    expect(status.phases[0].doneSteps).toBeGreaterThan(0);
  });

  it('reaches 100% when every step is satisfied', () => {
    const skillStats: Record<string, SkillStats> = {};
    for (const phase of studyPath.phases) {
      for (const step of phase.steps) {
        for (const skill of step.skills ?? []) {
          skillStats[skill] = stats(skill, 5, 5, 21);
        }
      }
    }
    const status = evaluatePath(studyPath, ctx({
      skillStats,
      examScores: { 'ai-901': 90 },
      srs: {} as SrsState,
    }));
    expect(status.overallPercent).toBe(100);
    expect(status.currentStepId).toBeNull();
  });
});
