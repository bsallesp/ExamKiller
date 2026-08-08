import { describe, expect, it } from 'vitest';
import { serializeStudyFilters, parseStudyFilters } from '../lib/client/study-query';
import {
  homeUrl, examInstructionsUrl, examSessionUrl, examReviewUrl, examResultsUrl,
  studyHubUrl, practiceSetupUrl, practiceSessionUrl, learnUrl, pathUrl, srsUrl, progressUrl,
  parseExamSessionParams,
} from '../lib/client/routes';
import type { Difficulty } from '../lib/types';

const EMPTY_FILTERS = { domains: [], difficulties: [], skills: [], limit: 10, conceptFamilyIds: [] };

const HARD: Difficulty[] = ['hard'];
const HARD_MEDIUM: Difficulty[] = ['hard', 'medium'];

describe('serializeStudyFilters / parseStudyFilters', () => {
  it('round-trips all fields through a URL', () => {
    const filters = {
      domains: ['Compute', 'Storage'],
      difficulties: HARD_MEDIUM,
      skills: ['S1'],
      limit: 5,
      conceptFamilyIds: ['az104-q1', 'az104-q2'],
    };
    const url = serializeStudyFilters(filters).toString();
    expect(parseStudyFilters(new URLSearchParams(url))).toEqual(filters);
  });

  it('omits empty arrays and always sends limit', () => {
    const params = serializeStudyFilters(EMPTY_FILTERS);
    expect(params.get('limit')).toBe('10');
    expect(params.get('domains')).toBeNull();
    expect(params.get('difficulties')).toBeNull();
    expect(params.get('skills')).toBeNull();
    expect(params.get('ids')).toBeNull();
  });

  it('parses missing parameters to defaults', () => {
    expect(parseStudyFilters(new URLSearchParams(''))).toEqual(EMPTY_FILTERS);
  });

  it('ignores invalid difficulties and non-numeric limits', () => {
    const parsed = parseStudyFilters(new URLSearchParams('difficulties=hard,certain&limit=abc&limit=7'));
    expect(parsed.difficulties).toEqual(['hard']);
    expect(parsed.limit).toBe(10);
  });

  it('does not split parameter values on commas inside a single field', () => {
    const filters = { ...EMPTY_FILTERS, domains: ['Identity and Governance'] };
    const url = serializeStudyFilters(filters).toString();
    expect(parseStudyFilters(new URLSearchParams(url)).domains).toEqual(['Identity and Governance']);
  });
});

describe('route builders', () => {
  it('builds exam URLs', () => {
    expect(examInstructionsUrl('az-104')).toBe('/exam/az-104/instructions');
    expect(examSessionUrl('az-104', 'abc', 3)).toBe('/exam/az-104/session?examId=abc&q=3');
    expect(examSessionUrl('az-104', 'abc')).toBe('/exam/az-104/session?examId=abc');
    expect(examSessionUrl('az-104', 'abc', -1)).toBe('/exam/az-104/session?examId=abc');
    expect(examReviewUrl('az-104', 'abc')).toBe('/exam/az-104/review?examId=abc');
    expect(examResultsUrl('az-104', 'abc')).toBe('/exam/az-104/results?examId=abc');
  });

  it('builds study URLs', () => {
    expect(homeUrl()).toBe('/');
    expect(studyHubUrl('az-104')).toBe('/study/az-104');
    expect(practiceSetupUrl('az-104')).toBe('/study/az-104/practice');
    expect(learnUrl('az-104')).toBe('/study/az-104/learn');
    expect(pathUrl('az-104')).toBe('/study/az-104/path');
    expect(srsUrl('az-104')).toBe('/study/az-104/srs');
    expect(progressUrl('az-104')).toBe('/study/az-104/progress');
  });

  it('embeds serialized filters in the practice session URL', () => {
    const filters = { ...EMPTY_FILTERS, difficulties: HARD, limit: 5 };
    expect(practiceSessionUrl('az-104', filters)).toBe(
      '/study/az-104/practice/session?difficulties=hard&limit=5',
    );
  });

  it('round-trips a practice session URL through the parser', () => {
    const filters = {
      domains: ['Compute'],
      difficulties: HARD,
      skills: [],
      limit: 5,
      conceptFamilyIds: [],
    };
    const url = practiceSessionUrl('az-104', filters);
    const parsed = parseStudyFilters(new URLSearchParams(url.split('?')[1]));
    expect(parsed).toEqual(filters);
  });

  it('encodes exam ids in URLs', () => {
    expect(examSessionUrl('az-104', 'a b&c')).toBe('/exam/az-104/session?examId=a%20b%26c');
    expect(parseExamSessionParams(new URLSearchParams('examId=a%20b%26c&q=2'))).toEqual({
      examId: 'a b&c',
      q: 2,
    });
  });
});

describe('parseExamSessionParams', () => {
  it('parses examId and question index', () => {
    expect(parseExamSessionParams(new URLSearchParams('examId=abc&q=7'))).toEqual({ examId: 'abc', q: 7 });
    expect(parseExamSessionParams(new URLSearchParams('examId=abc'))).toEqual({ examId: 'abc', q: 0 });
    expect(parseExamSessionParams(new URLSearchParams(''))).toEqual({ examId: null, q: 0 });
    expect(parseExamSessionParams(new URLSearchParams('examId=abc&q=-2'))).toEqual({ examId: 'abc', q: 0 });
    expect(parseExamSessionParams(new URLSearchParams('examId=abc&q=NaN'))).toEqual({ examId: 'abc', q: 0 });
  });
});
