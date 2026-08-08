import { describe, expect, it } from 'vitest';
import { validateQuestionBank, createExam, gradeExam } from '../lib/exam';
import { questionBank } from '../lib/exams/az-104/questions';
import { questionBank as ai901Bank } from '../lib/exams/ai-901/questions';
import type { FormQuestion } from '../lib/types';

function correctAnswers(q: FormQuestion): string[] {
  if (q.type === 'hot_area') {
    return q.hotArea!.rows.flatMap(r => r.cells.filter(c => c.isCorrect).map(c => c.id));
  }
  if (q.type === 'matching') {
    return q.options.map(o => `${o.id}::${o.matchTarget}`);
  }
  if (q.type === 'ordering') {
    return q.options
      .filter(o => (o.orderIndex ?? -1) >= 0)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      .map(o => o.id);
  }
  return q.options.filter(o => o.isCorrect).map(o => o.id);
}

describe('validateQuestionBank', () => {
  it('passes validation for the AZ-104 bank', () => {
    expect(validateQuestionBank('az-104')).toEqual({ ok: true });
  });

  it('passes validation for the AI-901 bank', () => {
    expect(validateQuestionBank('ai-901')).toEqual({ ok: true });
  });

  it('rejects an unknown exam code', () => {
    expect(validateQuestionBank('az-999').ok).toBe(false);
  });

  it('has exactly 55 questions in the AZ-104 bank', () => {
    expect(questionBank).toHaveLength(55);
  });

  it('has exactly 100 questions in the AI-901 bank', () => {
    expect(ai901Bank).toHaveLength(100);
  });

  it('AZ-104 matches the blueprint domain distribution', () => {
    const actual: Record<string, number> = {};
    for (const q of questionBank) actual[q.domain] = (actual[q.domain] ?? 0) + 1;
    expect(actual).toEqual({
      'Identity and Governance': 13,
      Storage: 11,
      Compute: 13,
      Networking: 10,
      'Monitoring and Recovery': 8,
    });
  });

  it('AI-901 matches the official blueprint domain distribution (40-45 / 55-60)', () => {
    const actual: Record<string, number> = {};
    for (const q of ai901Bank) actual[q.domain] = (actual[q.domain] ?? 0) + 1;
    expect(actual).toEqual({
      'Identify AI concepts and capabilities': 42,
      'Implement AI solutions by using Microsoft Foundry': 58,
    });
  });

  it('AZ-104 matches difficulty distribution', () => {
    const actual: Record<string, number> = {};
    for (const q of questionBank) actual[q.difficulty] = (actual[q.difficulty] ?? 0) + 1;
    expect(actual).toEqual({ easy: 11, medium: 28, hard: 16 });
  });

  it('AI-901 matches the 20/50/30 difficulty distribution', () => {
    const actual: Record<string, number> = {};
    for (const q of ai901Bank) actual[q.difficulty] = (actual[q.difficulty] ?? 0) + 1;
    expect(actual).toEqual({ easy: 20, medium: 50, hard: 30 });
  });

  it('AI-901 question types are valid', () => {
    const counts: Record<string, number> = {};
    for (const q of ai901Bank) counts[q.type] = (counts[q.type] ?? 0) + 1;
    expect(counts.single).toBeGreaterThan(70);
    expect(counts.multiple).toBeGreaterThanOrEqual(5);
    expect(counts.hot_area).toBeGreaterThanOrEqual(3);
    expect(counts.matching).toBeGreaterThanOrEqual(2);
    expect(counts.ordering).toBeGreaterThanOrEqual(2);
  });
});

describe('createExam', () => {
  it('creates a 55-question AZ-104 exam with 100-minute duration', () => {
    const { examId, publicForm, privateQuestions } = createExam('az-104');
    expect(publicForm.totalQuestions).toBe(55);
    expect(publicForm.durationSeconds).toBe(6000);
    expect(privateQuestions).toHaveLength(55);
    expect(examId).toBeTruthy();
  });

  it('creates a 100-question AI-901 exam with 60-minute duration', () => {
    const { publicForm } = createExam('ai-901');
    expect(publicForm.totalQuestions).toBe(100);
    expect(publicForm.durationSeconds).toBe(3600);
  });

  it('is a permutation of the bank without duplicates or omissions', () => {
    const { privateQuestions } = createExam('ai-901');
    const ids = privateQuestions.map(q => q.conceptFamilyId).sort();
    const expected = ai901Bank.map((_, i) => `ai901-q${i + 1}`).sort();
    expect(ids).toEqual(expected);
  });

  it('does not leak correct answers in the public form', () => {
    const { publicForm } = createExam('az-104');
    const json = JSON.stringify(publicForm);
    expect(json).not.toContain('"isCorrect"');
    expect(json).not.toContain('"correctTarget"');
    expect(json).not.toContain('"orderIndex"');
    expect(json).not.toContain('"correct"');
  });

  it('throws on unknown exam code', () => {
    expect(() => createExam('az-999')).toThrow();
  });
});

describe('gradeExam', () => {
  it('scores 100% when everything is correct (AI-901)', () => {
    const { privateQuestions } = createExam('ai-901');
    const answers: Record<string, string[]> = {};
    for (const q of privateQuestions) answers[q.id] = correctAnswers(q);
    const results = gradeExam(privateQuestions, answers);
    expect(results.score).toBe(100);
    expect(results.correct).toBe(100);
  });

  it('scores 0% with no answers', () => {
    const { privateQuestions } = createExam('ai-901');
    const results = gradeExam(privateQuestions, {});
    expect(results.score).toBe(0);
  });

  it('marks wrong answers wrong by type (AZ-104)', () => {
    const { privateQuestions } = createExam('az-104');
    const answers: Record<string, string[]> = {};
    for (const q of privateQuestions) {
      if (q.type === 'hot_area') {
        answers[q.id] = q.hotArea!.rows.flatMap(r => r.cells.filter(c => !c.isCorrect).map(c => c.id)).slice(0, 1);
      } else if (q.type === 'matching') {
        answers[q.id] = q.options.map(o => `${o.id}::${o.matchTarget === 'Azure Blob Storage' ? 'Azure Files' : 'Azure Blob Storage'}`);
      } else if (q.type === 'ordering') {
        answers[q.id] = [...q.options.filter(o => (o.orderIndex ?? -1) >= 0).map(o => o.id)].reverse();
      } else {
        answers[q.id] = q.options.filter(o => !o.isCorrect).map(o => o.id);
      }
    }
    const results = gradeExam(privateQuestions, answers);
    expect(results.score).toBe(0);
    expect(results.questions.every(q => !q.isCorrect)).toBe(true);
  });

  it('computes domain scores and readiness', () => {
    const { privateQuestions } = createExam('az-104');
    const answers: Record<string, string[]> = {};
    for (const q of privateQuestions) answers[q.id] = correctAnswers(q);
    const results = gradeExam(privateQuestions, answers);
    expect(results.domainScores['Identity and Governance'].correct).toBe(13);
    expect(results.readiness).toBe('ready');
    expect(results.weakDomains).toHaveLength(0);
  });
});
