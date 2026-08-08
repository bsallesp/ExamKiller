import { beforeEach, describe, expect, it } from 'vitest';
import { studyPath } from '../lib/exams/ai-901/path';
import { getExamPackage } from '../lib/exams';
import { evaluatePath } from '../lib/path';
import { computeSkillStats } from '../lib/progress';
import { recordAttempt, getExamState } from '../lib/repos/state-repo';
import { db } from '../lib/db/client';
import { attempts, srsCards, streaks } from '../lib/db/schema';
import { questionBank as ai901Bank } from '../lib/exams/ai-901/questions';
import type { AttemptPayload } from '../lib/repos/state-repo';

const SKILLS = new Set(studyPath.phases.flatMap(p => p.steps.flatMap(s => s.skills ?? [])));

beforeEach(() => {
  db.delete(attempts).run();
  db.delete(srsCards).run();
  db.delete(streaks).run();
});

describe('study path — content integrity against the real bank', () => {
  it('every path step targets a skill that exists in the bank', () => {
    const bankSkills = new Set(ai901Bank.map(q => q.skill));
    for (const skill of SKILLS) {
      expect(bankSkills.has(skill), `missing bank questions for ${skill}`).toBe(true);
    }
  });

  it('every practice step can be satisfied by the available questions per skill', () => {
    const countBySkill: Record<string, number> = {};
    for (const q of ai901Bank) countBySkill[q.skill] = (countBySkill[q.skill] ?? 0) + 1;
    for (const phase of studyPath.phases) {
      for (const step of phase.steps) {
        if (step.kind !== 'practice' || !step.skills) continue;
        for (const skill of step.skills) {
          expect(countBySkill[skill], `not enough questions for ${skill}`).toBeGreaterThanOrEqual(step.minAttempts ?? 1);
        }
      }
    }
  });

  it('covers every question of the bank through the seven path skills', () => {
    const pathQuestions = ai901Bank.filter(q => SKILLS.has(q.skill));
    expect(pathQuestions).toHaveLength(ai901Bank.length);
  });
});

describe('study path — integration with real progress pipeline', () => {
  const CLIENT = 'path-user';
  const NOW = Date.UTC(2026, 8, 1, 12, 0, 0);

  function attemptFor(q: (typeof ai901Bank)[number], correct: boolean): AttemptPayload {
    return {
      conceptFamilyId: `ai901-q${ai901Bank.indexOf(q) + 1}`,
      skill: q.skill,
      domain: q.domain,
      difficulty: q.difficulty,
      correct,
      confidence: 'high',
      errorTag: q.errorTag,
    };
  }

  function pathStatus(): ReturnType<typeof evaluatePath> {
    const state = getExamState(CLIENT, 'ai-901');
    return evaluatePath(studyPath, {
      skillStats: computeSkillStats(state.logs),
      srs: state.cards,
      now: NOW,
      examScores: {},
    });
  }

  it('a fresh user starts at the first step', () => {
    const status = pathStatus();
    expect(status.overallPercent).toBeGreaterThan(0);
    expect(status.currentStepId).toBe(studyPath.phases[0].steps[0].id);
  });

  it('reading every skill once unlocks the learn steps', () => {
    for (const skill of SKILLS) {
      const q = ai901Bank.find(x => x.skill === skill)!;
      recordAttempt(CLIENT, 'ai-901', attemptFor(q, true), NOW);
    }
    const status = pathStatus();
    for (const phase of status.phases) {
      for (const step of phase.steps) {
        if (step.step.kind === 'learn') expect(step.done, step.step.id).toBe(true);
      }
    }
    expect(status.currentStepId).toBe(studyPath.phases[0].steps[1].id);
  });

  it('practicing every skill to 5 attempts at 80% plus the mock exam completes the path', () => {
    for (const skill of SKILLS) {
      const questions = ai901Bank.filter(x => x.skill === skill);
      for (let i = 0; i < 5; i++) {
        const q = questions[i % questions.length];
        recordAttempt(CLIENT, 'ai-901', attemptFor(q, true), NOW);
      }
    }
    const state = getExamState(CLIENT, 'ai-901');
    const status = evaluatePath(studyPath, {
      skillStats: computeSkillStats(state.logs),
      srs: state.cards,
      now: NOW,
      examScores: { 'ai-901': 90 },
    });
    expect(status.overallPercent).toBe(100);
    expect(status.currentStepId).toBeNull();
  });

  it('an exam score below the pass percent keeps the mock exam step pending', () => {
    for (const skill of SKILLS) {
      const questions = ai901Bank.filter(x => x.skill === skill);
      for (let i = 0; i < 5; i++) {
        const q = questions[i % questions.length];
        recordAttempt(CLIENT, 'ai-901', attemptFor(q, true), NOW);
      }
    }
    const state = getExamState(CLIENT, 'ai-901');
    const status = evaluatePath(studyPath, {
      skillStats: computeSkillStats(state.logs),
      srs: state.cards,
      now: NOW,
      examScores: { 'ai-901': 65 },
    });
    const examPhase = status.phases.find(p => p.phaseId === 'mock-exam')!;
    expect(examPhase.steps[0].done).toBe(false);
    expect(status.overallPercent).toBeLessThan(100);
    expect(getExamPackage('ai-901')?.studyPath).toBeDefined();
  });
});
