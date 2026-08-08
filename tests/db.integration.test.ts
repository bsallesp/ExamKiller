import { beforeEach, describe, expect, it } from 'vitest';
import {
  getExamState, getClientState, recordAttempt, applyMissed,
} from '../lib/repos/state-repo';
import { db } from '../lib/db/client';
import { attempts, srsCards, streaks } from '../lib/db/schema';
import type { AttemptPayload } from '../lib/repos/state-repo';

const DAY = 24 * 60 * 60 * 1000;

beforeEach(() => {
  db.delete(attempts).run();
  db.delete(srsCards).run();
  db.delete(streaks).run();
});

function attempt(correct: boolean, confidence: 'low' | 'medium' | 'high' = 'medium'): AttemptPayload {
  return {
    conceptFamilyId: 'ai901-q1',
    skill: 'Describe principles of responsible AI',
    domain: 'Identify AI concepts and capabilities',
    difficulty: 'easy',
    correct,
    confidence,
    errorTag: 'principles',
  };
}

describe('state repository (sqlite)', () => {
  it('starts empty for a new client', () => {
    const state = getExamState('client-a', 'ai-901');
    expect(state.logs).toEqual([]);
    expect(state.cards).toEqual({});
    expect(state.streak).toEqual({ current: 0, best: 0, lastActiveDay: '' });
  });

  it('records an attempt: log, card schedule and streak', () => {
    const now = Date.UTC(2026, 7, 8, 12, 0, 0);
    const { card, streak } = recordAttempt('client-a', 'ai-901', attempt(true, 'medium'), now);
    expect(card.stability).toBe(1);
    expect(card.dueAt).toBe(now + DAY);
    expect(streak.current).toBe(1);
    expect(streak.lastActiveDay).toBe('2026-08-08');

    const state = getExamState('client-a', 'ai-901');
    expect(state.logs).toHaveLength(1);
    expect(state.logs[0].correct).toBe(true);
    expect(state.logs[0].confidence).toBe('medium');
    expect(state.logs[0].errorTag).toBe('principles');
    expect(state.cards['ai901-q1']).toBeDefined();
  });

  it('maps confidence to grades: high confidence wins a longer interval', () => {
    const now = Date.UTC(2026, 7, 8, 12, 0, 0);
    const good = recordAttempt('client-a', 'ai-901', attempt(true, 'low'), now);
    const easy = recordAttempt('client-b', 'ai-901', attempt(true, 'high'), now);
    expect(easy.card.stability).toBeGreaterThan(good.card.stability);
  });

  it('a wrong answer is due immediately and counts a lapse', () => {
    const now = Date.now();
    recordAttempt('client-a', 'ai-901', attempt(true, 'high'), now);
    const { card } = recordAttempt('client-a', 'ai-901', attempt(false, 'high'), now);
    expect(card.dueAt).toBe(now);
    expect(card.lapses).toBe(1);
    expect(card.stability).toBeLessThan(2);
  });

  it('stability grows across consecutive correct answers', () => {
    const now = Date.now();
    let card;
    for (let i = 0; i < 3; i++) {
      ({ card } = recordAttempt('client-a', 'ai-901', attempt(true, 'high'), now));
    }
    expect(card!.stability).toBeGreaterThan(3);
    expect(card!.reps).toBe(3);
  });

  it('isolates clients and exam codes', () => {
    const now = Date.now();
    recordAttempt('client-a', 'ai-901', attempt(true), now);
    recordAttempt('client-a', 'az-104', { ...attempt(true), conceptFamilyId: 'az104-q1' }, now);
    expect(getExamState('client-a', 'ai-901').logs).toHaveLength(1);
    expect(getExamState('client-a', 'az-104').logs).toHaveLength(1);
    expect(getExamState('client-b', 'ai-901').logs).toHaveLength(0);
    expect(getClientState('client-a', ['ai-901', 'az-104'])['ai-901'].logs).toHaveLength(1);
  });

  it('applyMissed marks cards as again and due immediately', () => {
    const now = Date.now();
    recordAttempt('client-a', 'ai-901', attempt(true, 'high'), now);
    const updated = applyMissed('client-a', 'ai-901', ['ai901-q1', 'ai901-q2'], now);
    expect(updated).toBe(2);
    const state = getExamState('client-a', 'ai-901');
    expect(state.cards['ai901-q1'].dueAt).toBe(now);
    expect(state.cards['ai901-q1'].lapses).toBe(1);
    expect(state.cards['ai901-q2'].reps).toBe(1);
  });

  it('persists streak growth across days and resets after a gap', () => {
    const day1 = Date.UTC(2026, 7, 8, 12, 0, 0);
    const day2 = day1 + DAY;
    const day4 = day1 + 3 * DAY;
    recordAttempt('client-a', 'ai-901', attempt(true), day1);
    const s2 = recordAttempt('client-a', 'ai-901', attempt(true), day2).streak;
    const s4 = recordAttempt('client-a', 'ai-901', attempt(true), day4).streak;
    expect(s2.current).toBe(2);
    expect(s4.current).toBe(1);
    expect(s4.best).toBe(2);
  });
});
