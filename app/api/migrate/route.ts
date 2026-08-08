import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { attempts, srsCards, streaks } from '@/lib/db/schema';
import { getExamDefinition } from '@/lib/exams';

export const dynamic = 'force-dynamic';

const CLIENT_ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;
const CONFIDENCE = new Set(['low', 'medium', 'high']);

interface LegacyCard {
  stability?: number;
  difficulty?: number;
  dueAt?: number;
  reps?: number;
  lapses?: number;
  lastReviewedAt?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, exams } = body as { clientId?: unknown; exams?: unknown };

    if (typeof clientId !== 'string' || !CLIENT_ID_RE.test(clientId)) {
      return NextResponse.json({ error: 'Invalid clientId' }, { status: 400 });
    }
    if (!exams || typeof exams !== 'object' || Array.isArray(exams)) {
      return NextResponse.json({ error: 'Invalid exams payload' }, { status: 400 });
    }

    let insertedCards = 0;
    let insertedLogs = 0;
    let insertedStreaks = 0;

    for (const [code, payload] of Object.entries(exams as Record<string, unknown>)) {
      if (!getExamDefinition(code)) continue;
      const p = payload as { logs?: unknown[]; cards?: Record<string, LegacyCard>; streak?: unknown };
      const now = Date.now();

      for (const [familyId, card] of Object.entries(p.cards ?? {})) {
        const safe = card ?? {};
        db.insert(srsCards)
          .values({
            clientId,
            examCode: code,
            conceptFamilyId: familyId,
            stability: Number.isFinite(safe.stability) ? Math.max(0, safe.stability as number) : 1,
            difficulty: Number.isFinite(safe.difficulty) ? (safe.difficulty as number) : 5,
            dueAt: Number.isFinite(safe.dueAt) ? (safe.dueAt as number) : now,
            reps: Number.isFinite(safe.reps) ? (safe.reps as number) : 0,
            lapses: Number.isFinite(safe.lapses) ? (safe.lapses as number) : 0,
            lastReviewedAt: Number.isFinite(safe.lastReviewedAt) ? (safe.lastReviewedAt as number) : 0,
          })
          .onConflictDoUpdate({
            target: [srsCards.clientId, srsCards.examCode, srsCards.conceptFamilyId],
            set: { stability: srsCards.stability, dueAt: srsCards.dueAt },
          })
          .run();
        insertedCards++;
      }

      for (const log of p.logs ?? []) {
        const l = log as Record<string, unknown>;
        if (typeof l.conceptFamilyId !== 'string' || typeof l.correct !== 'boolean') continue;
        const confidence = typeof l.confidence === 'string' && CONFIDENCE.has(l.confidence)
          ? l.confidence
          : 'medium';
        db.insert(attempts)
          .values({
            clientId,
            examCode: code,
            conceptFamilyId: l.conceptFamilyId as string,
            skill: typeof l.skill === 'string' ? l.skill : 'unknown',
            domain: typeof l.domain === 'string' ? l.domain : 'unknown',
            difficulty: typeof l.difficulty === 'string' ? l.difficulty : 'medium',
            correct: l.correct as boolean,
            confidence,
            errorTag: typeof l.errorTag === 'string' ? l.errorTag : null,
            stability: typeof l.stability === 'number' ? l.stability : 0,
            createdAt: typeof l.timestamp === 'number' ? l.timestamp : now,
          })
          .run();
        insertedLogs++;
      }

      const s = p.streak as Record<string, unknown> | undefined;
      if (s && typeof s.current === 'number') {
        db.insert(streaks)
          .values({
            clientId,
            examCode: code,
            current: Math.max(0, s.current as number),
            best: typeof s.best === 'number' ? Math.max(0, s.best as number) : (s.current as number),
            lastActiveDay: typeof s.lastActiveDay === 'string' ? s.lastActiveDay : '',
          })
          .onConflictDoUpdate({
            target: [streaks.clientId, streaks.examCode],
            set: { current: streaks.current, best: streaks.best },
          })
          .run();
        insertedStreaks++;
      }
    }

    return NextResponse.json({ cards: insertedCards, logs: insertedLogs, streaks: insertedStreaks });
  } catch {
    return NextResponse.json({ error: 'Failed to migrate legacy state' }, { status: 500 });
  }
}
