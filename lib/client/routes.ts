import type { StudyFilters } from '@/app/views/shared';
import { serializeStudyFilters } from './study-query';

export function homeUrl(): string {
  return '/';
}

export function examInstructionsUrl(code: string): string {
  return `/exam/${code}/instructions`;
}

export function examSessionUrl(code: string, examId: string, q?: number): string {
  let url = `/exam/${code}/session?examId=${encodeURIComponent(examId)}`;
  if (typeof q === 'number' && Number.isInteger(q) && q >= 0) url += `&q=${q}`;
  return url;
}

export function examReviewUrl(code: string, examId: string): string {
  return `/exam/${code}/review?examId=${encodeURIComponent(examId)}`;
}

export function examResultsUrl(code: string, examId: string): string {
  return `/exam/${code}/results?examId=${encodeURIComponent(examId)}`;
}

export function studyHubUrl(code: string): string {
  return `/study/${code}`;
}

export function practiceSetupUrl(code: string): string {
  return `/study/${code}/practice`;
}

export function practiceSessionUrl(code: string, filters: StudyFilters): string {
  return `/study/${code}/practice/session?${serializeStudyFilters(filters).toString()}`;
}

export function learnUrl(code: string): string {
  return `/study/${code}/learn`;
}

export function pathUrl(code: string): string {
  return `/study/${code}/path`;
}

export function srsUrl(code: string): string {
  return `/study/${code}/srs`;
}

export function progressUrl(code: string): string {
  return `/study/${code}/progress`;
}

export function parseExamSessionParams(params: URLSearchParams): { examId: string | null; q: number } {
  const examId = params.get('examId');
  const qRaw = Number(params.get('q'));
  return {
    examId,
    q: Number.isFinite(qRaw) && qRaw >= 0 ? Math.floor(qRaw) : 0,
  };
}
