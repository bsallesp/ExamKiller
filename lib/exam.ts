import type { FormQuestion, FormOption, PublicQuestion, ExamResults, ExamFormResponse, GradedQuestion, DomainScore, StudyQuestion, Difficulty, QuestionSeed } from './types';
import { getExamPackage } from './exams';
import { analyzeOptionLengthBias } from './item-quality';

/** Maximum ratio between the average length of correct options and distractors (test-wiseness guard). */
export const MAX_OPTION_LENGTH_SPREAD = 1.9;

export interface StudyFilters {
  domains?: string[];
  difficulties?: Difficulty[];
  skills?: string[];
  limit?: number;
  conceptFamilyIds?: string[];
}

interface DistributionExpectations {
  domains: Record<string, number>;
  difficulty: Record<string, number>;
  recallMax: number;
}

const DISTRIBUTIONS: Record<string, DistributionExpectations> = {
  'az-104': {
    domains: {
      'Identity and Governance': 13,
      Storage: 11,
      Compute: 13,
      Networking: 10,
      'Monitoring and Recovery': 8,
    },
    difficulty: { easy: 11, medium: 28, hard: 16 },
    recallMax: 11,
  },
  'ai-901': {
    domains: {
      'Identify AI concepts and capabilities': 42,
      'Implement AI solutions by using Microsoft Foundry': 58,
    },
    difficulty: { easy: 20, medium: 50, hard: 30 },
    recallMax: 20,
  },
};

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

export function validateQuestionBank(code = 'az-104'): { ok: boolean; error?: string } {
  const pkg = getExamPackage(code);
  if (!pkg) return { ok: false, error: `Unknown exam code: ${code}` };
  const { questions, definition } = pkg;
  const expectations = DISTRIBUTIONS[code];

  try {
    if (questions.length !== definition.questionCount) {
      throw new Error(`${code}: expected ${definition.questionCount} questions, found ${questions.length}`);
    }

    const actualDomains: Record<string, number> = {};
    const actualDifficulty: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
    const stems = new Set<string>();

    for (const q of questions) {
      actualDomains[q.domain] = (actualDomains[q.domain] ?? 0) + 1;
      actualDifficulty[q.difficulty] = (actualDifficulty[q.difficulty] ?? 0) + 1;

      const stem = normalize(q.stem);
      if (stems.has(stem)) throw new Error(`${code}: duplicate stem: ${q.stem}`);
      stems.add(stem);

      if (q.type === 'single' || q.type === 'multiple') {
        const totalOptions = q.correct.length + q.distractors.length;
        if (totalOptions !== 4) throw new Error(`${code}: question must have exactly 4 options: ${q.stem}`);
        if (!q.explanation || !q.explanation.trim()) throw new Error(`${code}: question is missing an explanation: ${q.stem}`);
        if (!q.distractorNotes || q.distractorNotes.length !== q.distractors.length) {
          throw new Error(`${code}: question must have one distractor note per distractor: ${q.stem}`);
        }
        const bias = analyzeOptionLengthBias(q);
        if (bias) {
          const spread = Math.max(bias.ratio, bias.distractorAvg === 0 ? 0 : 1 / bias.ratio);
          if (spread > MAX_OPTION_LENGTH_SPREAD) {
            throw new Error(
              `${code}: option length bias (${spread.toFixed(2)}x spread) — correct answers must not be inferable by length: ${q.stem}`,
            );
          }
        }
      }

      if (q.type === 'hot_area' || q.type === 'matching' || q.type === 'ordering') {
        if (!q.explanation || !q.explanation.trim()) throw new Error(`${code}: question is missing an explanation: ${q.stem}`);
      }

      if (q.type === 'hot_area') {
        if (!q.hotArea || q.hotArea.columns.length === 0 || q.hotArea.rows.length === 0) {
          throw new Error(`${code}: hot area question is missing its grid: ${q.stem}`);
        }
        if (new Set(q.hotArea.columns).size !== q.hotArea.columns.length) {
          throw new Error(`${code}: hot area question has duplicate columns: ${q.stem}`);
        }
        for (const row of q.hotArea.rows) {
          if (row.cells.length !== q.hotArea.columns.length) {
            throw new Error(`${code}: hot area row has ${row.cells.length} cells but ${q.hotArea.columns.length} columns: ${q.stem}`);
          }
          const correctCells = row.cells.filter(c => c.correct).length;
          if (correctCells !== 1) throw new Error(`${code}: hot area row must have exactly 1 correct cell: ${q.stem}`);
          if (row.cells.some(c => !c.text.trim())) throw new Error(`${code}: hot area cell text is empty: ${q.stem}`);
        }
      }

      if (q.type === 'matching') {
        if (!q.correctTargets || q.correctTargets.length !== q.correct.length) {
          throw new Error(`${code}: matching question must map every item to a target: ${q.stem}`);
        }
        if (!q.targets || q.targets.length < q.correct.length + 1) {
          throw new Error(`${code}: matching question must have more targets than items: ${q.stem}`);
        }
        if (new Set(q.targets).size !== q.targets.length) {
          throw new Error(`${code}: matching question has duplicate targets: ${q.stem}`);
        }
        for (const target of q.correctTargets) {
          if (!q.targets.includes(target)) throw new Error(`${code}: matching target not in pool: ${q.stem}`);
        }
      }

      if (q.type === 'ordering') {
        if (q.correct.length < 2) throw new Error(`${code}: ordering question must have at least 2 steps: ${q.stem}`);
        if (q.distractors.length < 1) throw new Error(`${code}: ordering question must have unused steps: ${q.stem}`);
        const all = [...q.correct, ...q.distractors];
        if (new Set(all).size !== all.length) throw new Error(`${code}: ordering question has duplicate steps: ${q.stem}`);
      }
    }

    if (expectations) {
      for (const [domain, count] of Object.entries(expectations.domains)) {
        if (actualDomains[domain] !== count) {
          throw new Error(`${code}: invalid distribution for ${domain}: ${actualDomains[domain] ?? 0}/${count}`);
        }
      }
      for (const [difficulty, count] of Object.entries(expectations.difficulty)) {
        if (actualDifficulty[difficulty] !== count) {
          throw new Error(`${code}: invalid distribution for ${difficulty}: ${actualDifficulty[difficulty] ?? 0}/${count}`);
        }
      }
      const recallCount = questions.filter(q => q.cognitiveLevel === 'recall').length;
      if (recallCount > expectations.recallMax) {
        throw new Error(`${code}: too many recall questions: ${recallCount}/${expectations.recallMax} max`);
      }
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

function seedToFormQuestions(seeds: QuestionSeed[], familyIds: string[]): FormQuestion[] {
  return seeds.map((seed, index) => {
    let instruction = 'Choose the best answer.';
    if (seed.type === 'multiple') instruction = `Select exactly ${seed.correct.length} options.`;
    if (seed.type === 'hot_area') {
      const yesNo = seed.hotArea!.columns.map(c => normalize(c)).join('|') === 'yes|no';
      instruction = yesNo
        ? 'For each statement, select Yes if the statement is true or No if the statement is false.'
        : 'Select the appropriate option for each row.';
    }
    if (seed.type === 'matching') instruction = 'Match each item to the correct option. Each option can be used only once.';
    if (seed.type === 'ordering') instruction = 'Place the steps in the correct order. Not all steps must be used.';

    const question: FormQuestion = {
      id: crypto.randomUUID(),
      stem: seed.stem,
      type: seed.type,
      difficulty: seed.difficulty,
      domain: seed.domain,
      skill: seed.skill,
      instruction,
      options: [],
      conceptFamilyId: familyIds[index] ?? `q${index + 1}`,
      caseStudyId: seed.caseStudyId,
      caseStudyPrompt: seed.caseStudyPrompt,
      explanation: seed.explanation,
      distractorNotes: seed.distractorNotes ?? [],
      sourceUrl: seed.sourceUrl,
      errorTag: seed.errorTag,
    };

    if (seed.type === 'hot_area') {
      question.hotArea = {
        columns: seed.hotArea!.columns,
        rows: seed.hotArea!.rows.map(row => ({
          label: row.label,
          cells: row.cells.map(cell => ({
            id: crypto.randomUUID(),
            text: cell.text,
            isCorrect: cell.correct,
          })),
        })),
      };
    } else if (seed.type === 'matching') {
      question.targets = [...seed.targets!];
      question.options = shuffle(
        seed.correct.map((text, i) => ({
          id: crypto.randomUUID(),
          label: '',
          text,
          isCorrect: true,
          matchTarget: seed.correctTargets![i],
        }))
      );
    } else if (seed.type === 'ordering') {
      const steps: FormOption[] = seed.correct.map((text, i) => ({
        id: crypto.randomUUID(),
        label: '',
        text,
        isCorrect: true,
        orderIndex: i,
      }));
      const unused: FormOption[] = seed.distractors.map(text => ({
        id: crypto.randomUUID(),
        label: '',
        text,
        isCorrect: false,
        orderIndex: -1,
      }));
      question.options = shuffle([...steps, ...unused]);
    } else {
      question.options = shuffle([
        ...seed.correct.map(text => ({ id: crypto.randomUUID(), label: '', text, isCorrect: true })),
        ...seed.distractors.map((text, i) => ({
          id: crypto.randomUUID(),
          label: '',
          text,
          isCorrect: false,
          distractorNote: seed.distractorNotes?.[i],
        })),
      ]);
    }

    question.options = question.options.map((opt, optIdx) => ({
      ...opt,
      label: ['A', 'B', 'C', 'D', 'E', 'F'][optIdx] ?? String(optIdx + 1),
    }));

    return question;
  });
}

export function createExam(code = 'az-104'): { examId: string; publicForm: ExamFormResponse; privateQuestions: FormQuestion[] } {
  const pkg = getExamPackage(code);
  if (!pkg) throw new Error(`Unknown exam code: ${code}`);
  const { questions, definition } = pkg;

  const validation = validateQuestionBank(code);
  if (!validation.ok) throw new Error(validation.error!);

  const examId = crypto.randomUUID();
  const familyIds = questions.map((_, i) => `${definition.familyPrefix}-q${i + 1}`);
  const formQuestions = seedToFormQuestions(questions, familyIds);

  const units: (FormQuestion | FormQuestion[])[] = [];
  const caseStudyIds = new Set<string>();
  for (const q of formQuestions) {
    if (q.caseStudyId) {
      if (!caseStudyIds.has(q.caseStudyId)) {
        caseStudyIds.add(q.caseStudyId);
        units.push(formQuestions.filter(x => x.caseStudyId === q.caseStudyId));
      }
    } else {
      units.push(q);
    }
  }
  const shuffledUnits = shuffle(units);
  const orderedQuestions = shuffledUnits.flatMap(unit => (Array.isArray(unit) ? unit : [unit]));
  const publicQuestions: PublicQuestion[] = orderedQuestions.map(q => ({
    id: q.id,
    stem: q.stem,
    type: q.type,
    difficulty: q.difficulty,
    domain: q.domain,
    skill: q.skill,
    instruction: q.instruction,
    options: q.options.map(o => ({ id: o.id, label: o.label, text: o.text })),
    hotArea: q.hotArea ? {
      columns: q.hotArea.columns,
      rows: q.hotArea.rows.map(r => ({
        label: r.label,
        cells: r.cells.map(c => ({ id: c.id, text: c.text })),
      })),
    } : undefined,
    targets: q.targets,
    conceptFamilyId: q.conceptFamilyId,
    caseStudyId: q.caseStudyId,
    caseStudyPrompt: q.caseStudyPrompt,
  }));

  return {
    examId,
    publicForm: {
      examId,
      questions: publicQuestions,
      totalQuestions: definition.questionCount,
      durationSeconds: definition.durationSeconds,
    },
    privateQuestions: orderedQuestions,
  };
}

export function createStudySession(code = 'az-104', filters: StudyFilters = {}): StudyQuestion[] {
  const pkg = getExamPackage(code);
  if (!pkg) throw new Error(`Unknown exam code: ${code}`);
  const { questions, definition } = pkg;

  const withIds = questions.map((seed, index) => ({ seed, familyId: `${definition.familyPrefix}-q${index + 1}` }));
  let pairs = withIds;
  if (filters.conceptFamilyIds && filters.conceptFamilyIds.length > 0) {
    const wanted = new Set(filters.conceptFamilyIds);
    pairs = withIds.filter(p => wanted.has(p.familyId));
  } else {
    pairs = withIds.filter(p =>
      (!filters.domains || filters.domains.length === 0 || filters.domains.includes(p.seed.domain)) &&
      (!filters.difficulties || filters.difficulties.length === 0 || filters.difficulties.includes(p.seed.difficulty)) &&
      (!filters.skills || filters.skills.length === 0 || filters.skills.includes(p.seed.skill))
    );
  }
  const selectedPairs = filters.limit && filters.limit > 0 ? shuffle(pairs).slice(0, filters.limit) : shuffle(pairs);
  const seeds = selectedPairs.map(p => p.seed);
  const familyIds = selectedPairs.map(p => p.familyId);

  return seedToFormQuestions(seeds, familyIds).map(q => ({
    id: q.id,
    stem: q.stem,
    type: q.type,
    difficulty: q.difficulty,
    domain: q.domain,
    skill: q.skill,
    instruction: q.instruction,
    options: q.options.map(o => ({
      id: o.id,
      label: o.label,
      text: o.text,
      isCorrect: o.isCorrect,
      correctTarget: o.matchTarget,
      orderIndex: o.orderIndex,
      distractorNote: o.distractorNote,
    })),
    hotArea: q.hotArea ? {
      columns: q.hotArea.columns,
      rows: q.hotArea.rows.map(r => ({
        label: r.label,
        cells: r.cells.map(c => ({ id: c.id, text: c.text, isCorrect: c.isCorrect })),
      })),
    } : undefined,
    targets: q.targets,
    conceptFamilyId: q.conceptFamilyId,
    caseStudyId: q.caseStudyId,
    caseStudyPrompt: q.caseStudyPrompt,
    explanation: q.explanation,
    distractorNotes: q.distractorNotes,
    sourceUrl: q.sourceUrl,
    errorTag: q.errorTag,
  }));
}

function isQuestionCorrect(q: FormQuestion, selectedIds: string[]): boolean {
  if (q.type === 'hot_area' && q.hotArea) {
    const correctIds = q.hotArea.rows.flatMap(r => r.cells.filter(c => c.isCorrect).map(c => c.id));
    return selectedIds.length === correctIds.length && correctIds.every(id => selectedIds.includes(id));
  }

  if (q.type === 'matching') {
    if (selectedIds.length !== q.options.length) return false;
    const expected = new Map(q.options.map(o => [o.id, o.matchTarget]));
    for (const entry of selectedIds) {
      const sep = entry.indexOf('::');
      if (sep === -1) return false;
      const optId = entry.slice(0, sep);
      const target = entry.slice(sep + 2);
      if (expected.get(optId) !== target) return false;
    }
    return true;
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

export function gradeExam(formQuestions: FormQuestion[], answers: Record<string, string[]>): ExamResults {
  let correct = 0;
  const domainAcc: Record<string, { correct: number; total: number }> = {};
  const difficultyAcc: Record<string, { correct: number; total: number }> = {};

  const graded: GradedQuestion[] = formQuestions.map(q => {
    const selectedIds = answers[q.id] ?? [];
    const allSelectedCorrect = isQuestionCorrect(q, selectedIds);

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
      options: q.options.map(o => ({
        id: o.id,
        label: o.label,
        text: o.text,
        isCorrect: o.isCorrect,
        correctTarget: o.matchTarget,
        orderIndex: o.orderIndex,
      })),
      hotArea: q.hotArea,
      targets: q.targets,
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
