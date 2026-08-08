// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  loadAnswers, saveAnswers,
  loadFlagged, saveFlagged,
  loadTimerStart, saveTimerStart, clearExamData,
  loadExamQuestions, saveExamQuestions,
  loadExamResults, saveExamResults,
} from '../lib/storage';
import { getClientId } from '../lib/client/client-id';
import type { PublicQuestion, ExamResults } from '../lib/types';

const FAKE_QUESTIONS: PublicQuestion[] = [
  {
    id: 'q1', stem: 'S', type: 'single', difficulty: 'easy', domain: 'Compute', skill: 'S1',
    instruction: 'i', options: [{ id: 'a', label: 'A', text: 'opt' }],
    conceptFamilyId: 'az104-q1',
  },
];

const FAKE_RESULTS: ExamResults = {
  examId: 'exam-1', score: 80, total: 1, correct: 1, questions: [], domainScores: {},
  difficultyScores: {}, readiness: 'ready', weakDomains: [],
};

describe('storage — exam session persistence', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips answers per examId', () => {
    saveAnswers('exam-1', { q1: ['a'], q2: ['b', 'c'] });
    expect(loadAnswers('exam-1')).toEqual({ q1: ['a'], q2: ['b', 'c'] });
    expect(loadAnswers('exam-2')).toEqual({});
  });

  it('round-trips flagged and timer', () => {
    saveFlagged('exam-1', ['q3']);
    expect(loadFlagged('exam-1')).toEqual(['q3']);
    expect(loadFlagged('exam-2')).toEqual([]);

    saveTimerStart('exam-1', 123456);
    expect(loadTimerStart('exam-1')).toBe(123456);
    expect(loadTimerStart('exam-2')).toBeNull();
  });

  it('clears all exam data for an examId', () => {
    saveAnswers('exam-1', { q1: ['a'] });
    saveFlagged('exam-1', ['q2']);
    saveTimerStart('exam-1', 9);
    saveExamQuestions('exam-1', FAKE_QUESTIONS);
    clearExamData('exam-1');
    expect(loadAnswers('exam-1')).toEqual({});
    expect(loadFlagged('exam-1')).toEqual([]);
    expect(loadTimerStart('exam-1')).toBeNull();
    expect(loadExamQuestions('exam-1')).toBeNull();
  });

  it('round-trips the persisted public form per examId', () => {
    saveExamQuestions('exam-1', FAKE_QUESTIONS);
    expect(loadExamQuestions('exam-1')).toEqual(FAKE_QUESTIONS);
    expect(loadExamQuestions('exam-2')).toBeNull();
  });

  it('round-trips exam results per examId', () => {
    saveExamResults('exam-1', FAKE_RESULTS);
    expect(loadExamResults('exam-1')).toEqual(FAKE_RESULTS);
    expect(loadExamResults('exam-2')).toBeNull();
  });

  it('keeps results after clearExamData (results route reads them post-submit)', () => {
    saveAnswers('exam-1', { q1: ['a'] });
    saveExamResults('exam-1', FAKE_RESULTS);
    clearExamData('exam-1');
    expect(loadAnswers('exam-1')).toEqual({});
    expect(loadExamResults('exam-1')?.score).toBe(80);
  });

  it('returns fallbacks on corrupt JSON', () => {
    localStorage.setItem('az104-answers-exam-1', '{oops');
    localStorage.setItem('az104-flagged-exam-1', '[oops');
    localStorage.setItem('az104-questions-exam-1', '[oops');
    localStorage.setItem('az104-results-exam-1', '{oops');
    expect(loadAnswers('exam-1')).toEqual({});
    expect(loadFlagged('exam-1')).toEqual([]);
    expect(loadExamQuestions('exam-1')).toBeNull();
    expect(loadExamResults('exam-1')).toBeNull();
  });
});

describe('client identity', () => {
  beforeEach(() => localStorage.clear());

  it('creates a stable anonymous client id', () => {
    const first = getClientId();
    expect(first).toMatch(/^[a-zA-Z0-9_-]{8,64}$/);
    expect(getClientId()).toBe(first);
  });

  it('keeps existing valid ids', () => {
    localStorage.setItem('az104-client-id', 'abc123xyz');
    expect(getClientId()).toBe('abc123xyz');
  });

  it('replaces invalid ids', () => {
    localStorage.setItem('az104-client-id', 'bad id!');
    expect(getClientId()).toMatch(/^[a-zA-Z0-9_-]{8,64}$/);
  });
});
