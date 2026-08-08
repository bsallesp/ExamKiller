export type Difficulty = 'easy' | 'medium' | 'hard';

export type QuestionType = 'single' | 'multiple' | 'hot_area' | 'matching' | 'ordering' | 'case_study';

export type CognitiveLevel = 'recall' | 'apply' | 'analyze';

export interface HotAreaCell {
  id: string;
  text: string;
}

export interface HotAreaRow {
  label: string;
  cells: HotAreaCell[];
}

export interface HotAreaGrid {
  columns: string[];
  rows: HotAreaRow[];
}

export interface GradedHotAreaCell extends HotAreaCell {
  isCorrect: boolean;
}

export interface GradedHotAreaRow {
  label: string;
  cells: GradedHotAreaCell[];
}

export interface GradedHotAreaGrid {
  columns: string[];
  rows: GradedHotAreaRow[];
}

export interface FormOption {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
  matchTarget?: string;
  orderIndex?: number;
  distractorNote?: string;
}

export interface PublicOption {
  id: string;
  label: string;
  text: string;
}

export interface GradedOption extends PublicOption {
  isCorrect: boolean;
  correctTarget?: string;
  orderIndex?: number;
}

export interface QuestionSeed {
  domain: string;
  skill: string;
  difficulty: Difficulty;
  cognitiveLevel: CognitiveLevel;
  stem: string;
  correct: string[];
  distractors: string[];
  sourceUrl: string;
  explanation: string;
  distractorNotes?: string[];
  errorTag?: string;
  type: QuestionType;
  hotArea?: {
    columns: string[];
    rows: { label: string; cells: { text: string; correct: boolean }[] }[];
  };
  targets?: string[];
  correctTargets?: string[];
  caseStudyId?: string;
  caseStudyPrompt?: string;
}

export interface FormQuestion {
  id: string;
  stem: string;
  type: QuestionType;
  difficulty: Difficulty;
  domain: string;
  skill: string;
  instruction: string;
  options: FormOption[];
  hotArea?: GradedHotAreaGrid;
  targets?: string[];
  conceptFamilyId: string;
  caseStudyId?: string;
  caseStudyPrompt?: string;
  explanation: string;
  distractorNotes: string[];
  sourceUrl: string;
  errorTag?: string;
}

export interface PublicQuestion {
  id: string;
  stem: string;
  type: QuestionType;
  difficulty: Difficulty;
  domain: string;
  skill: string;
  instruction: string;
  options: PublicOption[];
  hotArea?: HotAreaGrid;
  targets?: string[];
  conceptFamilyId: string;
  caseStudyId?: string;
  caseStudyPrompt?: string;
}

export interface GradedQuestion extends Omit<PublicQuestion, 'options' | 'hotArea'> {
  options: GradedOption[];
  hotArea?: GradedHotAreaGrid;
  selectedIds: string[];
  isCorrect: boolean;
}

export interface DomainScore {
  correct: number;
  total: number;
  percent: number;
}

export interface ExamResults {
  examId: string;
  score: number;
  total: number;
  correct: number;
  questions: GradedQuestion[];
  domainScores: Record<string, DomainScore>;
  difficultyScores: Record<string, DomainScore>;
  readiness: 'ready' | 'almost ready' | 'not ready';
  weakDomains: string[];
}

export interface ExamFormResponse {
  examId: string;
  questions: PublicQuestion[];
  totalQuestions: number;
  durationSeconds: number;
}

export interface AnswerSubmission {
  examId: string;
  answers: Record<string, string[]>;
}

export interface SkillSummary {
  skill: string;
  bullets: string[];
  sourceUrl: string;
}

export type Confidence = 'low' | 'medium' | 'high';

export const CONFIDENCE_ORDER: Confidence[] = ['low', 'medium', 'high'];

export interface StudyOption extends PublicOption {
  isCorrect: boolean;
  correctTarget?: string;
  orderIndex?: number;
  distractorNote?: string;
}

export interface StudyHotAreaCell extends HotAreaCell {
  isCorrect: boolean;
}

export interface StudyHotAreaRow {
  label: string;
  cells: StudyHotAreaCell[];
}

export interface StudyHotAreaGrid {
  columns: string[];
  rows: StudyHotAreaRow[];
}

export interface StudyQuestion extends Omit<PublicQuestion, 'options' | 'hotArea'> {
  options: StudyOption[];
  hotArea?: StudyHotAreaGrid;
  explanation: string;
  distractorNotes: string[];
  sourceUrl: string;
  errorTag?: string;
}

export interface StudyResponse {
  questions: StudyQuestion[];
  error?: string;
}
