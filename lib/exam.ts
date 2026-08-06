import type { QuestionSeed, FormQuestion, PublicQuestion, ExamResults, ExamFormResponse, GradedQuestion, DomainScore } from './types';
import { questionBank } from './questions';

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function normalize(s: string): string {
  return s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function validateQuestionBank(): { ok: boolean; error?: string } {
  try {
    if (questionBank.length !== 55) {
      throw new Error(`Expected 55 questions, found ${questionBank.length}`);
    }

    const expectedDomains: Record<string, number> = {
      'Identity and Governance': 13,
      Storage: 11,
      Compute: 13,
      Networking: 10,
      'Monitoring and Recovery': 8,
    };
    const expectedDifficulty: Record<string, number> = { easy: 11, medium: 28, hard: 16 };

    const actualDomains: Record<string, number> = {};
    const actualDifficulty: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
    const stems = new Set<string>();

    for (const q of questionBank) {
      actualDomains[q.domain] = (actualDomains[q.domain] ?? 0) + 1;
      actualDifficulty[q.difficulty] = (actualDifficulty[q.difficulty] ?? 0) + 1;

      const stem = normalize(q.stem);
      if (stems.has(stem)) throw new Error(`Duplicate stem: ${q.stem}`);
      stems.add(stem);

      const totalOptions = q.correct.length + q.distractors.length;
      if (totalOptions !== 4) throw new Error(`Question must have exactly 4 options: ${q.stem}`);
    }

    for (const [domain, count] of Object.entries(expectedDomains)) {
      if (actualDomains[domain] !== count) {
        throw new Error(`Invalid distribution for ${domain}: ${actualDomains[domain] ?? 0}/${count}`);
      }
    }

    for (const [difficulty, count] of Object.entries(expectedDifficulty)) {
      if (actualDifficulty[difficulty] !== count) {
        throw new Error(`Invalid distribution for ${difficulty}: ${actualDifficulty[difficulty]}/${count}`);
      }
    }

    const recallCount = questionBank.filter(q => q.cognitiveLevel === 'recall').length;
    if (recallCount > 11) {
      throw new Error(`Too many recall questions: ${recallCount}/11 max`);
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

function seedToFormQuestions(seeds: QuestionSeed[]): FormQuestion[] {
  return seeds.map((seed, index) => {
    const isMulti = seed.correct.length > 1 || seed.type === 'multiple';
    const instruction = seed.type === 'multiple'
      ? `Select exactly ${seed.correct.length} options.`
      : 'Choose the best answer.';

    return {
      id: crypto.randomUUID(),
      stem: seed.stem,
      type: seed.type,
      difficulty: seed.difficulty,
      domain: seed.domain,
      skill: seed.skill,
      instruction,
      options: shuffle([
        ...seed.correct.map(text => ({ id: crypto.randomUUID(), label: '', text, isCorrect: true })),
        ...seed.distractors.map(text => ({ id: crypto.randomUUID(), label: '', text, isCorrect: false })),
      ]).map((opt, optIdx) => ({
        ...opt,
        label: ['A', 'B', 'C', 'D'][optIdx],
      })),
      conceptFamilyId: `az104-q${index + 1}`,
      caseStudyId: seed.caseStudyId,
      caseStudyPrompt: seed.caseStudyPrompt,
    };
  });
}

export function createExam(): { examId: string; publicForm: ExamFormResponse; privateQuestions: FormQuestion[] } {
  const validation = validateQuestionBank();
  if (!validation.ok) throw new Error(validation.error!);

  const examId = crypto.randomUUID();
  const formQuestions = seedToFormQuestions(questionBank);

  const publicQuestions: PublicQuestion[] = formQuestions.map(q => ({
    id: q.id,
    stem: q.stem,
    type: q.type,
    difficulty: q.difficulty,
    domain: q.domain,
    skill: q.skill,
    instruction: q.instruction,
    options: q.options.map(o => ({ id: o.id, label: o.label, text: o.text })),
    conceptFamilyId: q.conceptFamilyId,
    caseStudyId: q.caseStudyId,
    caseStudyPrompt: q.caseStudyPrompt,
  }));

  return {
    examId,
    publicForm: {
      examId,
      questions: publicQuestions,
      totalQuestions: 55,
      durationSeconds: 100 * 60,
    },
    privateQuestions: formQuestions,
  };
}

export function gradeExam(formQuestions: FormQuestion[], answers: Record<string, string[]>): ExamResults {
  let correct = 0;
  const domainAcc: Record<string, { correct: number; total: number }> = {};
  const difficultyAcc: Record<string, { correct: number; total: number }> = {};

  const graded: GradedQuestion[] = formQuestions.map(q => {
    const selectedIds = answers[q.id] ?? [];
    const correctIds = q.options.filter(o => o.isCorrect).map(o => o.id);
    const allSelectedCorrect = selectedIds.length === correctIds.length && selectedIds.every(id => correctIds.includes(id));

    if (allSelectedCorrect) correct++;

    domainAcc[q.domain] ??= { correct: 0, total: 0 };
    domainAcc[q.domain].total++;
    if (allSelectedCorrect) domainAcc[q.domain].correct++;

    difficultyAcc[q.difficulty] ??= { correct: 0, total: 0 };
    difficultyAcc[q.difficulty].total++;
    if (allSelectedCorrect) difficultyAcc[q.difficulty].correct++;

    return {
      id: q.id,
      stem: q.stem,
      type: q.type,
      difficulty: q.difficulty,
      domain: q.domain,
      skill: q.skill,
      instruction: q.instruction,
      options: q.options.map(o => ({ id: o.id, label: o.label, text: o.text, isCorrect: o.isCorrect })),
      conceptFamilyId: q.conceptFamilyId,
      caseStudyId: q.caseStudyId,
      caseStudyPrompt: q.caseStudyPrompt,
      selectedIds,
      isCorrect: allSelectedCorrect,
    };
  });

  const score = Math.round((correct / formQuestions.length) * 100);

  const domainScores: Record<string, DomainScore> = {};
  for (const [domain, acc] of Object.entries(domainAcc)) {
    domainScores[domain] = { ...acc, percent: Math.round((acc.correct / acc.total) * 100) };
  }

  const difficultyScores: Record<string, DomainScore> = {};
  for (const [difficulty, acc] of Object.entries(difficultyAcc)) {
    difficultyScores[difficulty] = { ...acc, percent: Math.round((acc.correct / acc.total) * 100) };
  }

  const hardPercent = difficultyScores.hard?.percent ?? 0;
  const domainPercents = Object.values(domainScores).map(d => d.percent);
  const domainMin = domainPercents.length > 0 ? Math.min(...domainPercents) : 0;

  const weakDomains = Object.entries(domainScores)
    .filter(([, s]) => s.percent < 75)
    .map(([d]) => d);

  let readiness: ExamResults['readiness'] = 'not ready';
  const criteria = score >= 85 && domainMin >= 75 && hardPercent >= 80;
  const almost = score >= 78 && domainMin >= 65;
  if (criteria) readiness = 'ready';
  else if (almost) readiness = 'almost ready';

  return {
    examId: crypto.randomUUID(),
    score,
    total: formQuestions.length,
    correct,
    questions: graded,
    domainScores,
    difficultyScores,
    readiness,
    weakDomains,
  };
}
