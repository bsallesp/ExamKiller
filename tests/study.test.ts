import { describe, expect, it } from 'vitest';
import { createStudySession } from '../lib/exam';
import { questionBank as az104Bank } from '../lib/exams/az-104/questions';
import { skillSummaries as az104Skills, skillDomains as az104SkillDomains } from '../lib/exams/az-104/skills';
import { questionBank as ai901Bank } from '../lib/exams/ai-901/questions';
import { skillSummaries as ai901Skills, skillDomains as ai901SkillDomains } from '../lib/exams/ai-901/skills';
import { getExamPackage, listJourneyDefinitions } from '../lib/exams';
import { gradeFromResult, gradeCard, recordReview, getDueCards } from '../lib/srs';
import { analyzeOptionLengthBias } from '../lib/item-quality';
import { MAX_OPTION_LENGTH_SPREAD } from '../lib/exam';
import { computeSkillStats, skillStateOf, computeCalibration, computeErrorPatterns, nextAction } from '../lib/progress';
import type { AttemptLog } from '../lib/progress';
import type { StudyQuestion } from '../lib/types';

const DAY = 24 * 60 * 60 * 1000;

describe('exam registry', () => {
  it('journey order is AI-901, AI-200, AI-103, AZ-305', () => {
    expect(listJourneyDefinitions().map(d => d.code)).toEqual(['ai-901', 'ai-200', 'ai-103', 'az-305']);
  });

  it('AZ-104 remains available as an additional exam', () => {
    expect(getExamPackage('az-104')).toBeDefined();
  });

  it('planned exams have no question bank yet', () => {
    expect(getExamPackage('ai-200')).toBeUndefined();
    expect(getExamPackage('az-305')).toBeUndefined();
  });
});

describe('study content integrity', () => {
  it('every AI-901 question has an explanation', () => {
    for (const q of ai901Bank) {
      expect(q.explanation, q.stem).toBeTruthy();
    }
  });

  it('AI-901 single/multiple questions have one distractor note per distractor', () => {
    for (const q of ai901Bank) {
      if (q.type === 'single' || q.type === 'multiple') {
        expect(q.distractorNotes, q.stem).toHaveLength(q.distractors.length);
      }
    }
  });

  it('every skill in both banks has a summary and a domain mapping', () => {
    for (const [bank, skills, domains] of [
      [az104Bank, az104Skills, az104SkillDomains],
      [ai901Bank, ai901Skills, ai901SkillDomains],
    ] as const) {
      const used = new Set(bank.map(q => q.skill));
      for (const skill of used) {
        expect(skills[skill], `missing summary for ${skill}`).toBeDefined();
        expect(domains[skill], `missing domain mapping for ${skill}`).toBeDefined();
      }
    }
  });

  it('every AI-901 question carries an error tag', () => {
    for (const q of ai901Bank) {
      expect(q.errorTag, q.stem).toBeTruthy();
    }
  });

  it('no question leaks the correct answer by option length (test-wiseness)', () => {
    for (const [bank, code] of [[az104Bank, 'az-104'], [ai901Bank, 'ai-901']] as const) {
      for (const q of bank) {
        const bias = analyzeOptionLengthBias(q);
        if (!bias) continue;
        const spread = Math.max(bias.ratio, bias.distractorAvg === 0 ? 0 : 1 / bias.ratio);
        expect(spread, `${code}: ${q.stem}`).toBeLessThanOrEqual(MAX_OPTION_LENGTH_SPREAD);
      }
    }
  });
});

describe('createStudySession', () => {
  it('returns all 100 questions when no filters are given (AI-901)', () => {
    const session = createStudySession('ai-901');
    expect(session).toHaveLength(100);
  });

  it('keeps banks isolated between exams', () => {
    const az104 = createStudySession('az-104');
    const ai901 = createStudySession('ai-901');
    expect(az104.every(q => q.conceptFamilyId.startsWith('az104-'))).toBe(true);
    expect(ai901.every(q => q.conceptFamilyId.startsWith('ai901-'))).toBe(true);
    const azIds = new Set(az104.map(q => q.conceptFamilyId));
    expect(ai901.some(q => azIds.has(q.conceptFamilyId))).toBe(false);
  });

  it('filters AI-901 by domain', () => {
    const session = createStudySession('ai-901', { domains: ['Identify AI concepts and capabilities'] });
    expect(session.length).toBe(42);
    for (const q of session) expect(q.domain).toBe('Identify AI concepts and capabilities');
  });

  it('filters by skill', () => {
    const session = createStudySession('ai-901', { skills: ['Describe principles of responsible AI'] });
    expect(session.length).toBeGreaterThan(0);
    for (const q of session) expect(q.skill).toBe('Describe principles of responsible AI');
  });

  it('honors the limit', () => {
    const session = createStudySession('ai-901', { limit: 5 });
    expect(session).toHaveLength(5);
  });

  it('selects specific concept families by id', () => {
    const session = createStudySession('ai-901', { conceptFamilyIds: ['ai901-q1', 'ai901-q20'] });
    expect(session.map(q => q.conceptFamilyId).sort()).toEqual(['ai901-q1', 'ai901-q20']);
  });

  it('exposes grading data, explanations and error tags in every question', () => {
    for (const q of createStudySession('ai-901') as StudyQuestion[]) {
      expect(q.explanation).toBeTruthy();
      expect(q.sourceUrl).toBeTruthy();
      expect(q.errorTag).toBeTruthy();
      for (const opt of q.options) expect(typeof opt.isCorrect).toBe('boolean');
    }
  });
});

describe('srs engine (state-based)', () => {
  const now = Date.now();

  it('maps result + confidence to a grade', () => {
    expect(gradeFromResult(false, 'high')).toBe('again');
    expect(gradeFromResult(true, 'low')).toBe('good');
    expect(gradeFromResult(true, 'medium')).toBe('good');
    expect(gradeFromResult(true, 'high')).toBe('easy');
  });

  it('first good answer schedules tomorrow, first easy schedules in two days', () => {
    const good = gradeCard(undefined, 'ai901-q1', 'good', now);
    expect(good.stability).toBe(1);
    expect(good.dueAt).toBe(now + DAY);
    const easy = gradeCard(undefined, 'ai901-q2', 'easy', now);
    expect(easy.stability).toBe(2);
    expect(easy.dueAt).toBe(now + 2 * DAY);
  });

  it('again is due immediately and lowers stability', () => {
    let card = gradeCard(undefined, 'ai901-q1', 'good', now);
    card = gradeCard(card, 'ai901-q1', 'again', now);
    expect(card.dueAt).toBe(now);
    expect(card.lapses).toBe(1);
    expect(card.stability).toBeLessThan(2);
  });

  it('stability grows multiplicatively and difficulty shrinks on good/easy', () => {
    let card = gradeCard(undefined, 'ai901-q1', 'good', now);
    const d0 = card.difficulty;
    card = gradeCard(card, 'ai901-q1', 'easy', now);
    expect(card.stability).toBeGreaterThan(2);
    expect(card.difficulty).toBeLessThan(d0);
    expect(card.reps).toBe(2);
  });

  it('only returns cards whose due date has passed', () => {
    const state = {
      'ai901-q1': gradeCard(undefined, 'ai901-q1', 'again', now),
      'ai901-q2': gradeCard(undefined, 'ai901-q2', 'good', now),
    };
    state['ai901-q2'].dueAt = now + 10 * DAY;
    const due = getDueCards(state, now);
    expect(due.map(c => c.conceptFamilyId)).toContain('ai901-q1');
    expect(due.map(c => c.conceptFamilyId)).not.toContain('ai901-q2');
  });

  it('recordReview persists without losing other cards', () => {
    const state = { 'ai901-q1': gradeCard(undefined, 'ai901-q1', 'good', now) };
    const next = recordReview(state, 'ai901-q2', 'again', now);
    expect(Object.keys(next).sort()).toEqual(['ai901-q1', 'ai901-q2']);
  });
});

describe('progress engine', () => {
  const now = Date.now();
  const base: AttemptLog = {
    conceptFamilyId: 'ai901-q1', skill: 'S1', domain: 'D1', difficulty: 'easy',
    correct: true, confidence: 'high', errorTag: 'concept', stability: 1, timestamp: now - 10 * DAY,
  };
  const logs: AttemptLog[] = [
    { ...base },
    { ...base, conceptFamilyId: 'ai901-q2', correct: false, errorTag: 'service selection' },
    { ...base, conceptFamilyId: 'ai901-q3' },
    { ...base, skill: 'S2', conceptFamilyId: 'ai901-q4', correct: false, timestamp: now },
  ];

  it('computes percent, attempts and last seen per skill', () => {
    const stats = computeSkillStats(logs);
    expect(stats.S1.attempts).toBe(3);
    expect(stats.S1.correct).toBe(2);
    expect(stats.S1.percent).toBe(67);
    expect(stats.S2.attempts).toBe(1);
    expect(stats.S2.lastSeenAt).toBe(now);
  });

  it('derives skill state from stability and accuracy', () => {
    expect(skillStateOf(0, 0)).toBe('new');
    expect(skillStateOf(1, 0.5)).toBe('learning');
    expect(skillStateOf(7, 0.9)).toBe('reviewing');
    expect(skillStateOf(21, 0.9)).toBe('mastered');
    expect(skillStateOf(30, 0.4)).toBe('reviewing');
  });

  it('computes calibration per confidence level', () => {
    const cal = computeCalibration(logs);
    expect(cal.high.total).toBe(4);
    expect(cal.high.correct).toBe(2);
    expect(cal.high.percent).toBe(50);
  });

  it('finds the most common error patterns', () => {
    const patterns = computeErrorPatterns([...logs, { ...base, correct: false, errorTag: 'service selection' }]);
    expect(patterns[0].errorTag).toBe('service selection');
    expect(patterns[0].misses).toBe(2);
  });

  it('suggests the weakest unmastered skill as the next action', () => {
    const stats = computeSkillStats(logs);
    expect(nextAction(stats, now)).toBe('S2');
  });

  it('returns null when every skill is mastered', () => {
    const mastered: AttemptLog[] = Array.from({ length: 6 }, (_, i) => ({
      ...base,
      skill: i < 3 ? 'S1' : 'S2',
      stability: 30,
      timestamp: now,
    }));
    expect(nextAction(computeSkillStats(mastered), now)).toBeNull();
  });
});
