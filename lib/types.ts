export type Difficulty = 'easy' | 'medium' | 'hard';

export type QuestionType = 'single' | 'multiple' | 'case_study';

export type CognitiveLevel = 'recall' | 'apply' | 'analyze';

export interface FormOption {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
}

export interface PublicOption {
  id: string;
  label: string;
  text: string;
}

export interface GradedOption extends PublicOption {
  isCorrect: boolean;
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
  type: QuestionType;
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
  conceptFamilyId: string;
  caseStudyId?: string;
  caseStudyPrompt?: string;
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
  conceptFamilyId: string;
  caseStudyId?: string;
  caseStudyPrompt?: string;
}

export interface GradedQuestion extends Omit<PublicQuestion, 'options'> {
  options: GradedOption[];
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
