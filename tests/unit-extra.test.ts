import { describe, expect, it } from 'vitest';
import { gradeCard, getDueCards, getUpcomingCards, stabilityLabel } from '../lib/srs';
import { interleave, domainColor } from '../app/views/shared';
import { getExamDefinition, getExamPackage, listJourneyDefinitions } from '../lib/exams';

const DAY = 24 * 60 * 60 * 1000;

describe('srs engine — edge cases', () => {
  const now = Date.now();

  it('keeps difficulty clamped between 1 and 10', () => {
    let card = gradeCard(undefined, 'ai901-q1', 'again', now);
    for (let i = 0; i < 20; i++) card = gradeCard(card, 'ai901-q1', 'again', now);
    expect(card.difficulty).toBeGreaterThanOrEqual(1);
    expect(card.difficulty).toBeLessThanOrEqual(10);
    for (let i = 0; i < 40; i++) card = gradeCard(card, 'ai901-q1', 'easy', now);
    expect(card.difficulty).toBeGreaterThanOrEqual(1);
    expect(card.difficulty).toBeLessThanOrEqual(10);
  });

  it('never schedules again further than the minimum stability', () => {
    let card = gradeCard(undefined, 'ai901-q1', 'good', now);
    for (let i = 0; i < 10; i++) {
      card = gradeCard(card, 'ai901-q1', 'again', now);
      expect(card.dueAt).toBe(now);
      expect(card.stability).toBeGreaterThanOrEqual(1);
    }
  });

  it('a fresh again card is due immediately with one lapse', () => {
    const card = gradeCard(undefined, 'ai901-q1', 'again', now);
    expect(card.dueAt).toBe(now);
    expect(card.lapses).toBe(1);
    expect(card.reps).toBe(1);
  });

  it('stability grows monotonically on consecutive good answers', () => {
    let prev = 0;
    let card = gradeCard(undefined, 'ai901-q1', 'good', now);
    for (let i = 0; i < 8; i++) {
      expect(card.stability).toBeGreaterThan(prev);
      prev = card.stability;
      card = gradeCard(card, 'ai901-q1', 'good', now);
    }
  });

  it('getUpcomingCards returns the nearest due dates first, respecting the limit', () => {
    const state = {
      'ai901-q1': gradeCard(undefined, 'ai901-q1', 'good', now),
      'ai901-q2': { ...gradeCard(undefined, 'ai901-q2', 'good', now), dueAt: now + 3 * DAY },
      'ai901-q3': { ...gradeCard(undefined, 'ai901-q3', 'good', now), dueAt: now + 12 * DAY },
      'ai901-q4': { ...gradeCard(undefined, 'ai901-q4', 'good', now), dueAt: now + 30 * DAY },
    };
    const upcoming = getUpcomingCards(state, now, 2);
    expect(upcoming.map(c => c.conceptFamilyId)).toEqual(['ai901-q1', 'ai901-q2']);
    const due = getDueCards(state, now);
    expect(due).toHaveLength(0);
  });

  it('stabilityLabel maps intervals to skill states', () => {
    expect(stabilityLabel(0)).toBe('New');
    expect(stabilityLabel(1)).toBe('Learning');
    expect(stabilityLabel(7)).toBe('Reviewing');
    expect(stabilityLabel(21)).toBe('Mastered');
  });
});

describe('interleave', () => {
  it('alternates skills so no block repeats consecutively when possible', () => {
    const items = [
      { skill: 'A', i: 1 }, { skill: 'A', i: 2 }, { skill: 'A', i: 3 },
      { skill: 'B', i: 4 }, { skill: 'B', i: 5 },
      { skill: 'C', i: 6 },
    ];
    const result = interleave(items, x => x.skill);
    expect(result.map(x => x.skill)).toEqual(['A', 'B', 'C', 'A', 'B', 'A']);
    expect(result).toHaveLength(items.length);
  });

  it('preserves all items and handles a single skill', () => {
    const items = [{ skill: 'A', i: 1 }, { skill: 'A', i: 2 }];
    expect(interleave(items, x => x.skill).map(x => x.i)).toEqual([1, 2]);
  });

  it('returns empty for empty input', () => {
    expect(interleave([], x => x)).toHaveLength(0);
  });
});

describe('domain colors', () => {
  it('returns a valid tailwind-safe color for any domain', () => {
    for (const d of ['Identity and Governance', 'Storage', 'Compute', 'Networking', 'Monitoring and Recovery', 'Identify AI concepts and capabilities', 'Implement AI solutions by using Microsoft Foundry', 'Anything else']) {
      expect(domainColor(d)).toMatch(/^[a-z]+$/);
    }
  });
});

describe('exam registry consistency', () => {
  it('every journey definition resolves', () => {
    for (const code of listJourneyDefinitions().map(d => d.code)) {
      expect(getExamDefinition(code)).toBeDefined();
    }
  });

  it('active exams have a package; planned exams do not', () => {
    expect(getExamPackage('ai-901')).toBeDefined();
    expect(getExamPackage('az-104')).toBeDefined();
    expect(getExamPackage('ai-200')).toBeUndefined();
    expect(getExamPackage('ai-103')).toBeUndefined();
    expect(getExamPackage('az-305')).toBeUndefined();
  });

  it('family prefixes are unique across exams', () => {
    const codes = ['ai-901', 'az-104', 'ai-200', 'ai-103', 'az-305'];
    const prefixes = codes.map(c => getExamDefinition(c)?.familyPrefix);
    expect(new Set(prefixes).size).toBe(prefixes.length);
  });
});
