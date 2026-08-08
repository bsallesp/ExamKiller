import type { StudyQuestion, Difficulty } from '@/lib/types';

export interface StudyFilters {
  domains: string[];
  difficulties: Difficulty[];
  skills: string[];
  limit: number;
  conceptFamilyIds: string[];
}

export function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function toggleOption(current: string[], id: string, multi: boolean): string[] {
  if (multi) return current.includes(id) ? current.filter(x => x !== id) : [...current, id];
  return [id];
}

export function isStudyAnswerCorrect(q: StudyQuestion, selectedIds: string[]): boolean {
  if (q.type === 'hot_area' && q.hotArea) {
    const correctIds = q.hotArea.rows.flatMap(r => r.cells.filter(c => c.isCorrect).map(c => c.id));
    return selectedIds.length === correctIds.length && correctIds.every(id => selectedIds.includes(id));
  }
  if (q.type === 'matching') {
    if (selectedIds.length !== q.options.length) return false;
    const expected = new Map(q.options.map(o => [o.id, o.correctTarget]));
    return selectedIds.every(entry => {
      const sep = entry.indexOf('::');
      if (sep === -1) return false;
      return expected.get(entry.slice(0, sep)) === entry.slice(sep + 2);
    });
  }
  if (q.type === 'ordering') {
    const expected = q.options
      .filter(o => (o.orderIndex ?? -1) >= 0)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      .map(o => o.id);
    return selectedIds.length === expected.length && selectedIds.every((id, i) => id === expected[i]);
  }
  const correctIds = q.options.filter(o => o.isCorrect).map(o => o.id);
  return selectedIds.length === correctIds.length && selectedIds.every(id => correctIds.includes(id));
}

export const DIFF_LABEL: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export const READINESS_META: Record<string, { label: string; border: string; bg: string; text: string }> = {
  ready: { label: 'Ready', border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  'almost ready': { label: 'Almost Ready', border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700' },
  'not ready': { label: 'Not Ready', border: 'border-rose-200', bg: 'bg-rose-50', text: 'text-rose-700' },
};

export const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  single: { label: 'MC', cls: 'bg-slate-100 text-slate-500' },
  multiple: { label: 'MS', cls: 'bg-purple-50 text-purple-700' },
  hot_area: { label: 'HA', cls: 'bg-purple-50 text-purple-700' },
  matching: { label: 'MT', cls: 'bg-purple-50 text-purple-700' },
  ordering: { label: 'BL', cls: 'bg-purple-50 text-purple-700' },
  case_study: { label: 'CS', cls: 'bg-blue-50 text-blue-700' },
};

const KNOWN_DOMAIN_COLORS: Record<string, string> = {
  'Identity and Governance': 'indigo',
  Storage: 'emerald',
  Compute: 'amber',
  Networking: 'cyan',
  'Monitoring and Recovery': 'rose',
};

const PALETTE = ['violet', 'teal', 'orange', 'sky', 'fuchsia', 'lime', 'pink', 'slate'];

export function domainColor(domain: string): string {
  const known = KNOWN_DOMAIN_COLORS[domain];
  if (known) return known;
  let hash = 0;
  for (let i = 0; i < domain.length; i++) hash = (hash * 31 + domain.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function domainBg(domain: string): string {
  const c = domainColor(domain);
  const textMap: Record<string, string> = {
    indigo: 'text-indigo-700', emerald: 'text-emerald-700', amber: 'text-amber-700',
    cyan: 'text-cyan-700', rose: 'text-rose-700', violet: 'text-violet-700',
    teal: 'text-teal-700', orange: 'text-orange-700', sky: 'text-sky-700',
    fuchsia: 'text-fuchsia-700', lime: 'text-lime-700', pink: 'text-pink-700', slate: 'text-slate-700',
  };
  return `bg-${c}-50 ${textMap[c] ?? 'text-slate-700'}`;
}

export function domainDot(domain: string): string {
  return `bg-${domainColor(domain)}-500`;
}

export function daysAgo(ts: number, now: number): string {
  if (!ts) return 'never';
  const days = Math.floor((now - ts) / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'today';
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

export function interleave<T>(items: T[], key: (t: T) => string): T[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(item);
  }
  const buckets = [...groups.values()];
  const result: T[] = [];
  let max = 0;
  for (const b of buckets) max = Math.max(max, b.length);
  for (let i = 0; i < max; i++) {
    for (const b of buckets) {
      if (i < b.length) result.push(b[i]);
    }
  }
  return result;
}
