import type { StudyFilters } from '@/app/views/shared';
import type { Difficulty } from '@/lib/types';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const DEFAULT_LIMIT = 10;

export function serializeStudyFilters(filters: StudyFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.domains.length > 0) params.set('domains', filters.domains.join(','));
  if (filters.difficulties.length > 0) params.set('difficulties', filters.difficulties.join(','));
  if (filters.skills.length > 0) params.set('skills', filters.skills.join(','));
  if (filters.conceptFamilyIds.length > 0) params.set('ids', filters.conceptFamilyIds.join(','));
  params.set('limit', String(filters.limit));
  return params;
}

export function parseStudyFilters(params: URLSearchParams): StudyFilters {
  const list = (key: string) => (params.get(key) ?? '').split(',').filter(Boolean);
  const difficulties = list('difficulties').filter(
    d => DIFFICULTIES.includes(d as Difficulty),
  ) as Difficulty[];
  const limitRaw = Number(params.get('limit'));
  return {
    domains: list('domains'),
    difficulties,
    skills: list('skills'),
    conceptFamilyIds: list('ids'),
    limit: Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : DEFAULT_LIMIT,
  };
}
