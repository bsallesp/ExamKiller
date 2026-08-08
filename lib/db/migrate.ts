import type BetterSqlite3 from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

const MIGRATIONS = [
  {
    id: '001_init',
    sql: `
CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL,
  exam_code TEXT NOT NULL,
  concept_family_id TEXT NOT NULL,
  skill TEXT NOT NULL,
  domain TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  correct INTEGER NOT NULL,
  confidence TEXT NOT NULL,
  error_tag TEXT,
  stability INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_attempts_client ON attempts(client_id, exam_code, created_at);

CREATE TABLE IF NOT EXISTS srs_cards (
  client_id TEXT NOT NULL,
  exam_code TEXT NOT NULL,
  concept_family_id TEXT NOT NULL,
  stability INTEGER NOT NULL,
  difficulty REAL NOT NULL,
  due_at INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  lapses INTEGER NOT NULL,
  last_reviewed_at INTEGER NOT NULL,
  PRIMARY KEY (client_id, exam_code, concept_family_id)
);
CREATE INDEX IF NOT EXISTS idx_cards_client_due ON srs_cards(client_id, exam_code, due_at);

CREATE TABLE IF NOT EXISTS streaks (
  client_id TEXT NOT NULL,
  exam_code TEXT NOT NULL,
  current INTEGER NOT NULL,
  best INTEGER NOT NULL,
  last_active_day TEXT NOT NULL,
  PRIMARY KEY (client_id, exam_code)
);

CREATE TABLE IF NOT EXISTS _migrations (
  id TEXT PRIMARY KEY,
  applied_at INTEGER NOT NULL
);
`,
  },
];

export function runMigrations(sqlite: BetterSqlite3.Database) {
  sqlite.exec('CREATE TABLE IF NOT EXISTS _migrations (id TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)');
  const applied = new Set(
    (sqlite.prepare('SELECT id FROM _migrations').all() as { id: string }[]).map(r => r.id),
  );
  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue;
    sqlite.exec(migration.sql);
    sqlite.prepare('INSERT INTO _migrations (id, applied_at) VALUES (?, ?)').run(migration.id, Date.now());
  }
}

export function ensureDbDir(path: string) {
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true });
  }
}
