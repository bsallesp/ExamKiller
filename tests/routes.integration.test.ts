// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as examGet, POST as examPost } from '../app/api/exam/route';
import { GET as studyGet } from '../app/api/study/route';
import { db } from '../lib/db/client';
import { attempts, srsCards, streaks } from '../lib/db/schema';
import {
  loadAnswers, saveAnswers,
  loadFlagged, saveFlagged,
  loadTimerStart, saveTimerStart,
  loadExamQuestions, saveExamQuestions,
  loadExamResults, saveExamResults, clearExamData,
} from '../lib/storage';
import { serializeStudyFilters, parseStudyFilters } from '../lib/client/study-query';
import { practiceSessionUrl, examSessionUrl, parseExamSessionParams } from '../lib/client/routes';
import type { ExamFormResponse, ExamResults, StudyResponse, Difficulty } from '../lib/types';

const HARD: Difficulty[] = ['hard'];
const MEDIUM: Difficulty[] = ['medium'];

async function json<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

beforeEach(() => {
  localStorage.clear();
  db.delete(attempts).run();
  db.delete(srsCards).run();
  db.delete(streaks).run();
});

describe('exam route flow (instructions → session → review → results)', () => {
  it('persists the session across route transitions and grades it exactly once', async () => {
    const created = await json<ExamFormResponse>(
      await examGet(new NextRequest('http://localhost/api/exam?code=az-104')),
    );
    expect(created.questions.length).toBeGreaterThan(0);

    // instructions route: creates the exam and stores the public form
    saveExamQuestions(created.examId, created.questions);
    expect(loadExamQuestions(created.examId)?.length).toBe(created.questions.length);

    // session route: answers, flags and timer are persisted per examId
    const answered = created.questions.find(q => q.options.length > 0) ?? created.questions[0];
    saveAnswers(created.examId, { [answered.id]: [answered.options[0].id] });
    saveFlagged(created.examId, [answered.id]);
    const start = Date.now();
    saveTimerStart(created.examId, start);
    expect(loadAnswers(created.examId)[answered.id]).toEqual([answered.options[0].id]);
    expect(loadFlagged(created.examId)).toEqual([answered.id]);
    expect(loadTimerStart(created.examId)).toBe(start);

    // review route: submit grades the exam
    const body = JSON.stringify({ examId: created.examId, answers: { [answered.id]: [answered.options[0].id] } });
    const graded = await json<ExamResults>(
      await examPost(
        new NextRequest('http://localhost/api/exam', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        }),
      ),
    );
    expect(graded.examId).toBeTruthy();
    expect(graded.questions.length).toBe(created.questions.length);
    const gradedQ = graded.questions.find(q => q.id === answered.id);
    expect(gradedQ?.selectedIds).toEqual([answered.options[0].id]);

    // results route: reads the saved results after the session keys were cleared
    saveExamResults(graded.examId, graded);
    clearExamData(graded.examId);
    expect(loadExamResults(graded.examId)?.score).toBe(graded.score);
    expect(loadAnswers(graded.examId)).toEqual({});
    expect(loadFlagged(graded.examId)).toEqual([]);
    expect(loadTimerStart(graded.examId)).toBeNull();
    expect(loadExamQuestions(graded.examId)).toBeNull();

    // single-use enforcement survives the flow: a second submit is rejected
    const second = await examPost(
      new NextRequest('http://localhost/api/exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
    );
    expect(second.status).toBe(404);
  });

  it('does not leak correct answers into the persisted public form', async () => {
    const created = await json<ExamFormResponse>(
      await examGet(new NextRequest('http://localhost/api/exam?code=az-104')),
    );
    saveExamQuestions(created.examId, created.questions);
    const raw = JSON.stringify(loadExamQuestions(created.examId));
    expect(raw).not.toContain('isCorrect');
    expect(raw).not.toContain('correctTarget');
    expect(raw).not.toContain('orderIndex');
  });
});

describe('study session route flow (setup → session)', () => {
  it('serializes filters into the URL and the session honors them', async () => {
    const filters = { domains: [], difficulties: HARD, skills: [], limit: 5, conceptFamilyIds: [] };
    const params = serializeStudyFilters(filters);
    const res = await studyGet(
      new NextRequest(`http://localhost/api/study?code=az-104&${params.toString()}`),
    );
    expect(res.status).toBe(200);
    const body = await json<StudyResponse>(res);
    expect(body.questions).toHaveLength(5);
    for (const q of body.questions) {
      expect(q.difficulty).toBe('hard');
    }

    // the session page parses the same URL back into the original filters
    expect(parseStudyFilters(new URLSearchParams(params.toString()))).toEqual(filters);
  });

  it('filters by domain through the practice session URL', async () => {
    const url = practiceSessionUrl('az-104', {
      domains: ['Compute'],
      difficulties: [],
      skills: [],
      limit: 10,
      conceptFamilyIds: [],
    });
    const params = url.split('?')[1];
    const res = await studyGet(new NextRequest(`http://localhost/api/study?code=az-104&${params}`));
    expect(res.status).toBe(200);
    const body = await json<StudyResponse>(res);
    expect(body.questions.length).toBeGreaterThan(0);
    for (const q of body.questions) {
      expect(q.domain).toBe('Compute');
    }
  });

  it('supports the SRS ids filter used by the review queue route', async () => {
    const ids = ['az104-q1', 'az104-q2', 'az104-q3'];
    const res = await studyGet(
      new NextRequest(`http://localhost/api/study?code=az-104&ids=${ids.join(',')}`),
    );
    expect(res.status).toBe(200);
    const body = await json<StudyResponse>(res);
    expect(body.questions.map(q => q.conceptFamilyId).sort()).toEqual([...ids].sort());
  });
});

describe('route URL round-trips', () => {
  it('exam session URLs survive a page reload cycle', () => {
    const url = examSessionUrl('az-104', 'e123', 4);
    const parsed = parseExamSessionParams(new URLSearchParams(url.split('?')[1]));
    expect(parsed).toEqual({ examId: 'e123', q: 4 });
  });

  it('practice session URLs produced by the setup page drive the API', async () => {
    const url = practiceSessionUrl('az-104', {
      domains: [],
      difficulties: MEDIUM,
      skills: [],
      limit: 20,
      conceptFamilyIds: [],
    });
    const parsed = parseStudyFilters(new URLSearchParams(url.split('?')[1]));
    const res = await studyGet(
      new NextRequest(`http://localhost/api/study?code=az-104&${serializeStudyFilters(parsed).toString()}`),
    );
    expect(res.status).toBe(200);
    const body = await json<StudyResponse>(res);
    expect(body.questions.length).toBeLessThanOrEqual(20);
    for (const q of body.questions) {
      expect(q.difficulty).toBe('medium');
    }
  });
});
