import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as studyGet } from '../app/api/study/route';
import { GET as examGet, POST as examPost } from '../app/api/exam/route';
import { GET as stateGet, POST as statePost } from '../app/api/state/route';
import { POST as missedPost } from '../app/api/missed/route';
import { db } from '../lib/db/client';
import { attempts, srsCards, streaks } from '../lib/db/schema';
import type { ExamFormResponse, ExamResults, StudyResponse } from '../lib/types';

async function json<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

beforeEach(() => {
  db.delete(attempts).run();
  db.delete(srsCards).run();
  db.delete(streaks).run();
});

describe('POST /api/exam', () => {
  it('returns 404 for an unknown examId', async () => {
    const req = new NextRequest('http://localhost/api/exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examId: 'does-not-exist', answers: {} }),
    });
    const res = await examPost(req);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/exam', () => {
  it('creates an AI-901 exam (100q / 60min) with no answer leakage', async () => {
    const res = await examGet(new NextRequest('http://localhost/api/exam?code=ai-901'));
    expect(res.status).toBe(200);
    const body = await json<ExamFormResponse>(res);
    expect(body.totalQuestions).toBe(100);
    expect(body.durationSeconds).toBe(3600);
    expect(body.questions).toHaveLength(100);
    const raw = JSON.stringify(body);
    expect(raw).not.toContain('isCorrect');
    expect(raw).not.toContain('correctTarget');
    expect(raw).not.toContain('orderIndex');
  });

  it('defaults to az-104 when no code is given', async () => {
    const res = await examGet(new NextRequest('http://localhost/api/exam'));
    const body = await json<ExamFormResponse>(res);
    expect(body.totalQuestions).toBe(55);
  });

  it('returns 404 for an unknown exam code', async () => {
    const res = await examGet(new NextRequest('http://localhost/api/exam?code=zz-999'));
    expect(res.status).toBe(404);
    const body = await json<{ error: string }>(res);
    expect(body.error).toContain('zz-999');
  });

  it('keeps the case study items contiguous in the AI-901 form', async () => {
    const res = await examGet(new NextRequest('http://localhost/api/exam?code=ai-901'));
    const body = await json<ExamFormResponse>(res);
    const idxs = body.questions
      .map((q, i) => (q.caseStudyId === 'fabrikam' ? i : -1))
      .filter(i => i >= 0);
    expect(idxs.length).toBe(4);
    expect(idxs).toEqual([idxs[0], idxs[0] + 1, idxs[0] + 2, idxs[0] + 3]);
  });
});

describe('GET /api/study', () => {
  it('returns a filtered AI-901 session', async () => {
    const res = await studyGet(new NextRequest('http://localhost/api/study?code=ai-901&limit=5&difficulties=hard'));
    expect(res.status).toBe(200);
    const body = await json<StudyResponse>(res);
    expect(body.questions).toHaveLength(5);
    for (const q of body.questions) {
      expect(q.difficulty).toBe('hard');
      expect(q.explanation).toBeTruthy();
      expect(q.errorTag).toBeTruthy();
    }
  });

  it('returns 404 for an unknown exam code', async () => {
    const res = await studyGet(new NextRequest('http://localhost/api/study?code=zz-999'));
    expect(res.status).toBe(404);
  });

  it('selects exact concept families by id', async () => {
    const res = await studyGet(new NextRequest('http://localhost/api/study?code=ai-901&ids=ai901-q1,ai901-q23'));
    const body = await json<StudyResponse>(res);
    expect(body.questions.map(q => q.conceptFamilyId).sort()).toEqual(['ai901-q1', 'ai901-q23']);
  });

  it('defaults to az-104 without a code', async () => {
    const res = await studyGet(new NextRequest('http://localhost/api/study?limit=3'));
    const body = await json<StudyResponse>(res);
    expect(body.questions).toHaveLength(3);
    expect(body.questions.every(q => q.conceptFamilyId.startsWith('az104-'))).toBe(true);
  });
});

describe('integration — full exam lifecycle', () => {
  it('grades an empty submission at 0% and enforces single-use examIds', async () => {
    const create = await examGet(new NextRequest('http://localhost/api/exam?code=ai-901'));
    const form = await json<ExamFormResponse>(create);

    const submit = new NextRequest('http://localhost/api/exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examId: form.examId, answers: {} }),
    });
    const graded = await examPost(submit);
    expect(graded.status).toBe(200);
    const results = await json<ExamResults>(graded);
    expect(results.score).toBe(0);
    expect(results.correct).toBe(0);
    expect(results.total).toBe(100);
    expect(results.questions).toHaveLength(100);
    expect(results.questions.every(q => !q.isCorrect)).toBe(true);

    const replay = new NextRequest('http://localhost/api/exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examId: form.examId, answers: {} }),
    });
    expect((await examPost(replay)).status).toBe(404);
  });

  it('accepts partial answers and returns per-domain breakdowns', async () => {
    const create = await examGet(new NextRequest('http://localhost/api/exam?code=az-104'));
    const form = await json<ExamFormResponse>(create);

    const answers: Record<string, string[]> = {};
    for (const q of form.questions) {
      if (q.type === 'single' && q.options[0]) answers[q.id] = [q.options[0].id];
    }

    const submit = new NextRequest('http://localhost/api/exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examId: form.examId, answers }),
    });
    const results = await json<ExamResults>(await examPost(submit));
    expect(results.total).toBe(55);
    expect(results.score).toBeGreaterThan(0);
    expect(Object.keys(results.domainScores).length).toBe(5);
    expect(Object.keys(results.difficultyScores).length).toBe(3);
    expect(results.weakDomains).toBeInstanceOf(Array);
  });
});

const CLIENT = 'test-client-1234';
const ATTEMPT_BODY = {
  clientId: CLIENT,
  examCode: 'ai-901',
  attempt: {
    conceptFamilyId: 'ai901-q1',
    skill: 'Describe principles of responsible AI',
    domain: 'Identify AI concepts and capabilities',
    difficulty: 'easy',
    correct: true,
    confidence: 'high',
    errorTag: 'principles',
  },
};

describe('POST /api/state', () => {
  it('records an attempt and returns the new card and streak', async () => {
    const req = new NextRequest('http://localhost/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ATTEMPT_BODY),
    });
    const res = await statePost(req);
    expect(res.status).toBe(200);
    const body = await json<{ card: { stability: number }; streak: { current: number } }>(res);
    expect(body.card.stability).toBe(2);
    expect(body.streak.current).toBe(1);
  });

  it('rejects invalid client ids, exam codes, and confidence values', async () => {
    for (const bad of [
      { ...ATTEMPT_BODY, clientId: 'x' },
      { ...ATTEMPT_BODY, examCode: 'zz-999' },
      { ...ATTEMPT_BODY, attempt: { ...ATTEMPT_BODY.attempt, confidence: 'certain' } },
      { ...ATTEMPT_BODY, attempt: { ...ATTEMPT_BODY.attempt, correct: 'yes' as unknown as boolean } },
    ]) {
      const req = new NextRequest('http://localhost/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bad),
      });
      const res = await statePost(req);
      expect([400, 404]).toContain(res.status);
    }
  });
});

describe('GET /api/state', () => {
  it('returns empty state for a fresh client', async () => {
    const res = await stateGet(new NextRequest(`http://localhost/api/state?clientId=${CLIENT}`));
    expect(res.status).toBe(200);
    const body = await json<{ state: Record<string, { logs: unknown[]; cards: unknown; streak: unknown }> }>(res);
    expect(body.state['ai-901'].logs).toHaveLength(0);
  });

  it('returns recorded attempts for the client', async () => {
    await statePost(new NextRequest('http://localhost/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ATTEMPT_BODY),
    }));
    const res = await stateGet(new NextRequest(`http://localhost/api/state?clientId=${CLIENT}&code=ai-901`));
    const body = await json<{ state: Record<string, { logs: unknown[]; cards: Record<string, unknown>; streak: { current: number } }> }>(res);
    expect(body.state['ai-901'].logs).toHaveLength(1);
    expect(body.state['ai-901'].streak.current).toBeGreaterThanOrEqual(1);
  });

  it('rejects invalid client ids and unknown codes', async () => {
    expect((await stateGet(new NextRequest('http://localhost/api/state?clientId=x'))).status).toBe(400);
    expect((await stateGet(new NextRequest(`http://localhost/api/state?clientId=${CLIENT}&code=zz-9`))).status).toBe(404);
  });
});

describe('POST /api/missed', () => {
  it('adds missed questions to the review queue', async () => {
    const req = new NextRequest('http://localhost/api/missed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: CLIENT, examCode: 'ai-901', conceptFamilyIds: ['ai901-q1', 'ai901-q2'] }),
    });
    const res = await missedPost(req);
    expect(res.status).toBe(200);
    const body = await json<{ updated: number }>(res);
    expect(body.updated).toBe(2);
  });

  it('rejects invalid payloads', async () => {
    const bad = new NextRequest('http://localhost/api/missed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: CLIENT, examCode: 'ai-901', conceptFamilyIds: ['', 3] }),
    });
    expect((await missedPost(bad)).status).toBe(400);
    const badCode = new NextRequest('http://localhost/api/missed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: CLIENT, examCode: 'zz-9', conceptFamilyIds: ['ai901-q1'] }),
    });
    expect((await missedPost(badCode)).status).toBe(404);
  });
});
