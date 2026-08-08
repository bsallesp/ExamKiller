import { getClientId } from './client-id';
import type { AttemptLog } from '@/lib/progress';
import type { CardState } from '@/lib/srs';
import type { StreakState } from '@/lib/streak';
import type { Confidence } from '@/lib/types';

export interface ExamStateDto {
  logs: AttemptLog[];
  cards: Record<string, CardState>;
  streak: StreakState;
}

export interface AllStateDto {
  clientId: string;
  state: Record<string, ExamStateDto>;
}

export async function fetchState(code?: string): Promise<ExamStateDto | AllStateDto> {
  const clientId = getClientId();
  const params = new URLSearchParams({ clientId });
  if (code) params.set('code', code);
  const res = await fetch(`/api/state?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to load state');
  if (code) return (data as AllStateDto).state[code] as ExamStateDto;
  return data as AllStateDto;
}

export interface AttemptPostBody {
  clientId: string;
  examCode: string;
  attempt: {
    conceptFamilyId: string;
    skill: string;
    domain: string;
    difficulty: string;
    correct: boolean;
    confidence: Confidence;
    errorTag?: string;
  };
}

export async function recordAttempt(
  examCode: string,
  attempt: AttemptPostBody['attempt'],
): Promise<{ card: CardState; streak: StreakState }> {
  const body: AttemptPostBody = { clientId: getClientId(), examCode, attempt };
  const res = await fetch('/api/state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to record attempt');
  return data;
}

export async function recordMissed(examCode: string, conceptFamilyIds: string[]): Promise<number> {
  const res = await fetch('/api/missed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: getClientId(), examCode, conceptFamilyIds }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to record missed questions');
  return data.updated as number;
}
