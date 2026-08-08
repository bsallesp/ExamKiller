import type { Confidence } from './types';

export interface CardState {
  conceptFamilyId: string;
  stability: number;
  difficulty: number;
  dueAt: number;
  reps: number;
  lapses: number;
  lastReviewedAt: number;
}

export type Grade = 'again' | 'good' | 'easy';

export type SrsState = Record<string, CardState>;

export const DAY_MS = 24 * 60 * 60 * 1000;

const MIN_STABILITY = 1;

export function gradeFromResult(correct: boolean, confidence: Confidence): Grade {
  if (!correct) return 'again';
  return confidence === 'high' ? 'easy' : 'good';
}

function clampDifficulty(d: number): number {
  return Math.min(10, Math.max(1, Math.round(d * 10) / 10));
}

export function gradeCard(card: CardState | undefined, conceptFamilyId: string, grade: Grade, now: number): CardState {
  const current = card ?? {
    conceptFamilyId,
    stability: 0,
    difficulty: 5,
    dueAt: now,
    reps: 0,
    lapses: 0,
    lastReviewedAt: 0,
  };

  if (grade === 'again') {
    return {
      ...current,
      stability: Math.max(MIN_STABILITY, Math.round(current.stability * 0.4)),
      difficulty: clampDifficulty(current.difficulty + 1.5),
      dueAt: now,
      reps: current.reps + 1,
      lapses: current.lapses + 1,
      lastReviewedAt: now,
    };
  }

  const easy = grade === 'easy';
  const factor = easy ? 2.8 : 2.2;
  const first = easy ? 2 : 1;
  const stability = Math.max(MIN_STABILITY, Math.round(current.stability === 0 ? first : current.stability * factor));
  return {
    ...current,
    stability,
    difficulty: clampDifficulty(current.difficulty - (easy ? 0.8 : 0.4)),
    dueAt: now + stability * DAY_MS,
    reps: current.reps + 1,
    lastReviewedAt: now,
  };
}

export function recordReview(state: SrsState, conceptFamilyId: string, grade: Grade, now: number): SrsState {
  return { ...state, [conceptFamilyId]: gradeCard(state[conceptFamilyId], conceptFamilyId, grade, now) };
}

export function getDueCards(state: SrsState, now: number): CardState[] {
  return Object.values(state)
    .filter(c => c.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt);
}

export function getUpcomingCards(state: SrsState, now: number, limit = 10): CardState[] {
  return Object.values(state)
    .filter(c => c.dueAt > now)
    .sort((a, b) => a.dueAt - b.dueAt)
    .slice(0, limit);
}

export function nextReviewLabel(card: CardState, now: number): string {
  if (card.dueAt <= now) return 'due now';
  const days = Math.max(1, Math.ceil((card.dueAt - now) / DAY_MS));
  return days === 1 ? 'tomorrow' : `in ${days} days`;
}

export function stabilityLabel(stability: number): string {
  if (stability >= 21) return 'Mastered';
  if (stability >= 7) return 'Reviewing';
  if (stability >= 1) return 'Learning';
  return 'New';
}
