import { sqliteTable, text, integer, real, primaryKey, index } from 'drizzle-orm/sqlite-core';

export const attempts = sqliteTable(
  'attempts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    clientId: text('client_id').notNull(),
    examCode: text('exam_code').notNull(),
    conceptFamilyId: text('concept_family_id').notNull(),
    skill: text('skill').notNull(),
    domain: text('domain').notNull(),
    difficulty: text('difficulty').notNull(),
    correct: integer('correct', { mode: 'boolean' }).notNull(),
    confidence: text('confidence').notNull(),
    errorTag: text('error_tag'),
    stability: integer('stability').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  t => [index('idx_attempts_client').on(t.clientId, t.examCode, t.createdAt)],
);

export const srsCards = sqliteTable(
  'srs_cards',
  {
    clientId: text('client_id').notNull(),
    examCode: text('exam_code').notNull(),
    conceptFamilyId: text('concept_family_id').notNull(),
    stability: integer('stability').notNull(),
    difficulty: real('difficulty').notNull(),
    dueAt: integer('due_at').notNull(),
    reps: integer('reps').notNull(),
    lapses: integer('lapses').notNull(),
    lastReviewedAt: integer('last_reviewed_at').notNull(),
  },
  t => [
    primaryKey({ columns: [t.clientId, t.examCode, t.conceptFamilyId] }),
    index('idx_cards_client_due').on(t.clientId, t.examCode, t.dueAt),
  ],
);

export const streaks = sqliteTable(
  'streaks',
  {
    clientId: text('client_id').notNull(),
    examCode: text('exam_code').notNull(),
    current: integer('current').notNull(),
    best: integer('best').notNull(),
    lastActiveDay: text('last_active_day').notNull(),
  },
  t => [primaryKey({ columns: [t.clientId, t.examCode] })],
);

export type AttemptRow = typeof attempts.$inferSelect;
export type SrsCardRow = typeof srsCards.$inferSelect;
export type StreakRow = typeof streaks.$inferSelect;
