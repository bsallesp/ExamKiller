import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { attempts, srsCards, streaks } from '@/lib/db/schema';
import type { AttemptRow, SrsCardRow, StreakRow } from '@/lib/db/schema';
import { gradeFromResult, gradeCard } from '@/lib/srs';
import type { CardState, Grade } from '@/lib/srs';
import { bumpStreakState, EMPTY_STREAK } from '@/lib/streak';
import type { StreakState } from '@/lib/streak';
import type { AttemptLog } from '@/lib/progress';
import type { Confidence } from '@/lib/types';

function toCard(row: SrsCardRow): CardState {
  return {
    conceptFamilyId: row.conceptFamilyId,
    stability: row.stability,
    difficulty: row.difficulty,
    dueAt: row.dueAt,
    reps: row.reps,
    lapses: row.lapses,
    lastReviewedAt: row.lastReviewedAt,
  };
}

function toLog(row: AttemptRow): AttemptLog {
  return {
    conceptFamilyId: row.conceptFamilyId,
    skill: row.skill,
    domain: row.domain,
    difficulty: row.difficulty,
    correct: row.correct,
    confidence: row.confidence as Confidence,
    errorTag: row.errorTag ?? undefined,
    stability: row.stability,
    timestamp: row.createdAt,
  };
}

function toStreak(row: StreakRow | undefined): StreakState {
  return row ? { current: row.current, best: row.best, lastActiveDay: row.lastActiveDay } : { ...EMPTY_STREAK };
}

export interface ExamState {
  logs: AttemptLog[];
  cards: Record<string, CardState>;
  streak: StreakState;
}

export interface AttemptPayload {
  conceptFamilyId: string;
  skill: string;
  domain: string;
  difficulty: string;
  correct: boolean;
  confidence: Confidence;
  errorTag?: string;
}

export function getExamState(clientId: string, examCode: string): ExamState {
  const logRows = db.select().from(attempts)
    .where(and(eq(attempts.clientId, clientId), eq(attempts.examCode, examCode)))
    .orderBy(attempts.createdAt)
    .all();
  const cardRows = db.select().from(srsCards)
    .where(and(eq(srsCards.clientId, clientId), eq(srsCards.examCode, examCode)))
    .all();
  const streakRow = db.select().from(streaks)
    .where(and(eq(streaks.clientId, clientId), eq(streaks.examCode, examCode)))
    .get();

  const cards: Record<string, CardState> = {};
  for (const row of cardRows) cards[row.conceptFamilyId] = toCard(row);

  return { logs: logRows.map(toLog), cards, streak: toStreak(streakRow) };
}

export function getClientState(clientId: string, examCodes: string[]): Record<string, ExamState> {
  const result: Record<string, ExamState> = {};
  for (const code of examCodes) result[code] = getExamState(clientId, code);
  return result;
}

export function applyGrade(
  clientId: string,
  examCode: string,
  payload: AttemptPayload,
  grade: Grade,
  now: number,
): { card: CardState; streak: StreakState } {
  const existing = db.select().from(srsCards)
    .where(and(
      eq(srsCards.clientId, clientId),
      eq(srsCards.examCode, examCode),
      eq(srsCards.conceptFamilyId, payload.conceptFamilyId),
    ))
    .get();
  const card = gradeCard(existing ? toCard(existing) : undefined, payload.conceptFamilyId, grade, now);

  db.insert(srsCards)
    .values({
      clientId,
      examCode,
      conceptFamilyId: card.conceptFamilyId,
      stability: card.stability,
      difficulty: card.difficulty,
      dueAt: card.dueAt,
      reps: card.reps,
      lapses: card.lapses,
      lastReviewedAt: card.lastReviewedAt,
    })
    .onConflictDoUpdate({
      target: [srsCards.clientId, srsCards.examCode, srsCards.conceptFamilyId],
      set: {
        stability: card.stability,
        difficulty: card.difficulty,
        dueAt: card.dueAt,
        reps: card.reps,
        lapses: card.lapses,
        lastReviewedAt: card.lastReviewedAt,
      },
    })
    .run();

  db.insert(attempts)
    .values({
      clientId,
      examCode,
      conceptFamilyId: payload.conceptFamilyId,
      skill: payload.skill,
      domain: payload.domain,
      difficulty: payload.difficulty,
      correct: payload.correct,
      confidence: payload.confidence,
      errorTag: payload.errorTag ?? null,
      stability: card.stability,
      createdAt: now,
    })
    .run();

  const previous = toStreak(db.select().from(streaks)
    .where(and(eq(streaks.clientId, clientId), eq(streaks.examCode, examCode)))
    .get());
  const streak = bumpStreakState(previous, now);
  db.insert(streaks)
    .values({ clientId, examCode, ...streak })
    .onConflictDoUpdate({
      target: [streaks.clientId, streaks.examCode],
      set: { current: streak.current, best: streak.best, lastActiveDay: streak.lastActiveDay },
    })
    .run();

  return { card, streak };
}

export function applyMissed(clientId: string, examCode: string, conceptFamilyIds: string[], now: number): number {
  let updated = 0;
  for (const id of conceptFamilyIds) {
    const existing = db.select().from(srsCards)
      .where(and(
        eq(srsCards.clientId, clientId),
        eq(srsCards.examCode, examCode),
        eq(srsCards.conceptFamilyId, id),
      ))
      .get();
    const card = gradeCard(existing ? toCard(existing) : undefined, id, 'again', now);
    db.insert(srsCards)
      .values({
        clientId,
        examCode,
        conceptFamilyId: id,
        stability: card.stability,
        difficulty: card.difficulty,
        dueAt: card.dueAt,
        reps: card.reps,
        lapses: card.lapses,
        lastReviewedAt: card.lastReviewedAt,
      })
      .onConflictDoUpdate({
        target: [srsCards.clientId, srsCards.examCode, srsCards.conceptFamilyId],
        set: {
          stability: card.stability,
          difficulty: card.difficulty,
          dueAt: card.dueAt,
          reps: card.reps,
          lapses: card.lapses,
          lastReviewedAt: card.lastReviewedAt,
        },
      })
      .run();
    updated++;
  }
  return updated;
}

export function recordAttempt(clientId: string, examCode: string, payload: AttemptPayload, now: number) {
  return applyGrade(clientId, examCode, payload, gradeFromResult(payload.correct, payload.confidence), now);
}
