import type { Confidence } from './types';

export interface AttemptLog {
  conceptFamilyId: string;
  skill: string;
  domain: string;
  difficulty: string;
  correct: boolean;
  confidence: Confidence;
  errorTag?: string;
  stability: number;
  timestamp: number;
}

export type SkillState = 'new' | 'learning' | 'reviewing' | 'mastered';

export interface SkillStats {
  skill: string;
  domain: string;
  attempts: number;
  correct: number;
  percent: number;
  lastSeenAt: number;
  stability: number;
  state: SkillState;
}

export interface CalibrationEntry {
  total: number;
  correct: number;
  percent: number;
}

export interface ErrorPattern {
  errorTag: string;
  misses: number;
}

export function computeSkillStats(logs: AttemptLog[]): Record<string, SkillStats> {
  const acc: Record<string, SkillStats> = {};
  for (const log of logs) {
    const entry = acc[log.skill] ?? {
      skill: log.skill,
      domain: log.domain,
      attempts: 0,
      correct: 0,
      percent: 0,
      lastSeenAt: 0,
      stability: 0,
      state: 'new' as SkillState,
    };
    entry.attempts++;
    if (log.correct) entry.correct++;
    if (log.timestamp > entry.lastSeenAt) entry.lastSeenAt = log.timestamp;
    if (log.stability > entry.stability) entry.stability = log.stability;
    acc[log.skill] = entry;
  }
  for (const entry of Object.values(acc)) {
    entry.percent = entry.attempts > 0 ? Math.round((entry.correct / entry.attempts) * 100) : 0;
    entry.state = skillStateOf(entry.stability, entry.correct / Math.max(1, entry.attempts));
  }
  return acc;
}

export function skillStateOf(stability: number, accuracy: number): SkillState {
  if (stability >= 21 && accuracy >= 0.8) return 'mastered';
  if (stability >= 7) return 'reviewing';
  if (stability >= 1) return 'learning';
  return 'new';
}

export function computeCalibration(logs: AttemptLog[]): Record<Confidence, CalibrationEntry> {
  const acc: Record<Confidence, CalibrationEntry> = {
    low: { total: 0, correct: 0, percent: 0 },
    medium: { total: 0, correct: 0, percent: 0 },
    high: { total: 0, correct: 0, percent: 0 },
  };
  for (const log of logs) {
    const entry = acc[log.confidence] ?? acc.medium;
    entry.total++;
    if (log.correct) entry.correct++;
  }
  for (const entry of Object.values(acc)) {
    entry.percent = entry.total > 0 ? Math.round((entry.correct / entry.total) * 100) : 0;
  }
  return acc;
}

export function computeErrorPatterns(logs: AttemptLog[]): ErrorPattern[] {
  const acc: Record<string, number> = {};
  for (const log of logs) {
    if (log.correct || !log.errorTag) continue;
    acc[log.errorTag] = (acc[log.errorTag] ?? 0) + 1;
  }
  return Object.entries(acc)
    .map(([errorTag, misses]) => ({ errorTag, misses }))
    .sort((a, b) => b.misses - a.misses)
    .slice(0, 5);
}

export function overconfidenceErrors(logs: AttemptLog[]): number {
  return logs.filter(l => l.confidence === 'high' && !l.correct).length;
}

export function nextAction(stats: Record<string, SkillStats>, now: number): string | null {
  const entries = Object.values(stats).filter(s => s.state !== 'mastered');
  if (entries.length === 0) return null;
  return entries.sort((a, b) => {
    const aAge = Math.max(0, now - a.lastSeenAt);
    const bAge = Math.max(0, now - b.lastSeenAt);
    const aScore = a.percent * 0.6 + Math.min(aAge, 7 * 24 * 60 * 60 * 1000) / (7 * 24 * 60 * 60 * 1000) * 40;
    const bScore = b.percent * 0.6 + Math.min(bAge, 7 * 24 * 60 * 60 * 1000) / (7 * 24 * 60 * 60 * 1000) * 40;
    return aScore - bScore;
  })[0].skill;
}
