import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { runMigrations, ensureDbDir } from './migrate';

export const DB_PATH = process.env.AZURE_CC_DB ?? './data/examkiller.db';

export type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as { __examkillerDb?: Db };

function createDb(): Db {
  ensureDbDir(DB_PATH);
  const sqlite = new Database(DB_PATH);
  sqlite.pragma('journal_mode = TRUNCATE');
  sqlite.pragma('synchronous = NORMAL');
  sqlite.pragma('foreign_keys = ON');
  runMigrations(sqlite);
  return drizzle(sqlite, { schema });
}

export const db: Db = globalForDb.__examkillerDb ?? createDb();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__examkillerDb = db;
}
