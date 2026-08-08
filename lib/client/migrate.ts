import { getClientId } from './client-id';
import type { AttemptLog } from '@/lib/progress';
import type { CardState } from '@/lib/srs';
import type { StreakState } from '@/lib/streak';

const MIGRATED_KEY = 'az104-migrated-v2';
const EXAM_CODES = ['ai-901', 'az-104'];

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

/** One-shot migration of the legacy localStorage progress into the server database. */
export async function migrateLegacyStateOnce(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(MIGRATED_KEY)) return;

  const exams: Record<string, unknown> = {};
  let found = false;
  for (const code of EXAM_CODES) {
    const cards = readJson<Record<string, CardState>>(`srs-${code}`);
    const logs = readJson<AttemptLog[]>(`progress-${code}`);
    const streak = readJson<StreakState>(`streak-${code}`);
    if (cards || logs || streak) {
      found = true;
      exams[code] = {
        cards: cards ?? {},
        logs: logs ?? [],
        streak: streak ?? { current: 0, best: 0, lastActiveDay: '' },
      };
    }
  }
  if (!found) {
    window.localStorage.setItem(MIGRATED_KEY, '1');
    return;
  }

  try {
    const res = await fetch('/api/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: getClientId(), exams }),
    });
    if (res.ok) {
      for (const code of EXAM_CODES) {
        window.localStorage.removeItem(`srs-${code}`);
        window.localStorage.removeItem(`progress-${code}`);
        window.localStorage.removeItem(`streak-${code}`);
      }
    }
  } finally {
    window.localStorage.setItem(MIGRATED_KEY, '1');
  }
}
