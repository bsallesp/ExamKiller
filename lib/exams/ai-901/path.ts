import type { SkillState } from '../../progress';

/**
 * Deterministic study path for AI-901.
 * Pure content: each step declares what to do and the measurable condition
 * that marks it complete. The app evaluates completion against real progress
 * (skill stats from attempts, SRS cards, exam completions).
 */

export type StudyPathStepKind = 'learn' | 'practice' | 'exam' | 'srs';

export interface StudyPathStep {
  id: string;
  title: string;
  description: string;
  kind: StudyPathStepKind;
  /** Skills targeted by this step (learn/practice). */
  skills?: string[];
  /** Question limit for a practice session suggested by this step. */
  questionLimit?: number;
  /** Minimum attempts per targeted skill before the step counts as done. */
  minAttempts?: number;
  /** Minimum accuracy across attempts before the step counts as done. */
  passPercent?: number;
  /** Learn steps: skill must reach at least this SRS state. */
  targetState?: SkillState;
  /** Exam steps: exam code to run. */
  examCode?: string;
  /** Expected time investment in minutes. */
  expectedMinutes: number;
}

export interface StudyPathPhase {
  id: string;
  title: string;
  summary: string;
  steps: StudyPathStep[];
}

export interface StudyPath {
  examCode: string;
  title: string;
  description: string;
  phases: StudyPathPhase[];
}

const S1 = 'Describe principles of responsible AI';
const S2 = 'Identify AI model components and configurations';
const S3 = 'Identify AI workloads';
const S4 = 'Implement generative AI apps and agents by using Foundry';
const S5 = 'Implement AI solutions for text and speech by using Foundry';
const S6 = 'Implement AI solutions with computer vision and image-generation capabilities by using Foundry';
const S7 = 'Implement AI solutions for information extraction by using Foundry';

const PRACTICE_LIMIT = 10;
const PRACTICE_MIN_ATTEMPTS = 5;
const PRACTICE_PASS_PERCENT = 80;

export const studyPath: StudyPath = {
  examCode: 'ai-901',
  title: 'AI-901 Guided Study Path',
  description:
    'A phased path that takes you from concepts to exam readiness: read each skill, verify it with practice until you reach 80%, then finish with a full 100-question mock exam and daily spaced reviews.',
  phases: [
    {
      id: 'concepts',
      title: 'Phase 1 — AI Foundations',
      summary:
        'Build the conceptual base before touching any implementation skill: the six responsible AI principles, how generative models work, and which workload fits which task.',
      steps: [
        {
          id: 'p1-learn-1',
          title: 'Read: Responsible AI',
          description: 'Read the skill summary and open the official documentation link.',
          kind: 'learn',
          skills: [S1],
          targetState: 'learning',
          expectedMinutes: 15,
        },
        {
          id: 'p1-practice-1',
          title: 'Verify: Responsible AI',
          description: 'Answer practice questions until you reach at least 80% accuracy.',
          kind: 'practice',
          skills: [S1],
          questionLimit: PRACTICE_LIMIT,
          minAttempts: PRACTICE_MIN_ATTEMPTS,
          passPercent: PRACTICE_PASS_PERCENT,
          expectedMinutes: 15,
        },
        {
          id: 'p1-learn-2',
          title: 'Read: Model Components and Configurations',
          description: 'Tokens, context window, temperature, top-p, deployments, and model families.',
          kind: 'learn',
          skills: [S2],
          targetState: 'learning',
          expectedMinutes: 15,
        },
        {
          id: 'p1-practice-2',
          title: 'Verify: Model Components and Configurations',
          description: 'Answer practice questions until you reach at least 80% accuracy.',
          kind: 'practice',
          skills: [S2],
          questionLimit: PRACTICE_LIMIT,
          minAttempts: PRACTICE_MIN_ATTEMPTS,
          passPercent: PRACTICE_PASS_PERCENT,
          expectedMinutes: 15,
        },
        {
          id: 'p1-learn-3',
          title: 'Read: AI Workloads',
          description: 'Text analysis, speech, computer vision, image generation, and information extraction.',
          kind: 'learn',
          skills: [S3],
          targetState: 'learning',
          expectedMinutes: 15,
        },
        {
          id: 'p1-practice-3',
          title: 'Verify: AI Workloads',
          description: 'Answer practice questions until you reach at least 80% accuracy.',
          kind: 'practice',
          skills: [S3],
          questionLimit: PRACTICE_LIMIT,
          minAttempts: PRACTICE_MIN_ATTEMPTS,
          passPercent: PRACTICE_PASS_PERCENT,
          expectedMinutes: 15,
        },
      ],
    },
    {
      id: 'foundry-apps',
      title: 'Phase 2 — Generative Apps and Agents',
      summary:
        'Learn how to build generative applications on Microsoft Foundry: deployments, prompts, threads, and agents with tools.',
      steps: [
        {
          id: 'p2-learn-1',
          title: 'Read: Generative Apps and Agents',
          description: 'Playground, deployments, system prompts, threads, and agent tools.',
          kind: 'learn',
          skills: [S4],
          targetState: 'learning',
          expectedMinutes: 20,
        },
        {
          id: 'p2-practice-1',
          title: 'Verify: Generative Apps and Agents',
          description: 'Answer practice questions until you reach at least 80% accuracy.',
          kind: 'practice',
          skills: [S4],
          questionLimit: PRACTICE_LIMIT,
          minAttempts: PRACTICE_MIN_ATTEMPTS,
          passPercent: PRACTICE_PASS_PERCENT,
          expectedMinutes: 20,
        },
      ],
    },
    {
      id: 'text-speech',
      title: 'Phase 3 — Text and Speech',
      summary:
        'Implement sentiment classification, transcription, diarization, speech translation, and text-to-speech on Foundry and Azure Speech.',
      steps: [
        {
          id: 'p3-learn-1',
          title: 'Read: Text and Speech Solutions',
          description: 'Model deployments for text analysis, Azure Speech, the Speech SDK, and custom speech.',
          kind: 'learn',
          skills: [S5],
          targetState: 'learning',
          expectedMinutes: 20,
        },
        {
          id: 'p3-practice-1',
          title: 'Verify: Text and Speech Solutions',
          description: 'Answer practice questions until you reach at least 80% accuracy.',
          kind: 'practice',
          skills: [S5],
          questionLimit: PRACTICE_LIMIT,
          minAttempts: PRACTICE_MIN_ATTEMPTS,
          passPercent: PRACTICE_PASS_PERCENT,
          expectedMinutes: 20,
        },
      ],
    },
    {
      id: 'vision',
      title: 'Phase 4 — Computer Vision and Image Generation',
      summary:
        'Multimodal models that interpret images, image generation from prompts, OCR at scale, and grounded, safe vision answers.',
      steps: [
        {
          id: 'p4-learn-1',
          title: 'Read: Computer Vision and Image Generation',
          description: 'Multimodal vision, base64 image input, image generation, and content safety.',
          kind: 'learn',
          skills: [S6],
          targetState: 'learning',
          expectedMinutes: 20,
        },
        {
          id: 'p4-practice-1',
          title: 'Verify: Computer Vision and Image Generation',
          description: 'Answer practice questions until you reach at least 80% accuracy.',
          kind: 'practice',
          skills: [S6],
          questionLimit: PRACTICE_LIMIT,
          minAttempts: PRACTICE_MIN_ATTEMPTS,
          passPercent: PRACTICE_PASS_PERCENT,
          expectedMinutes: 20,
        },
      ],
    },
    {
      id: 'extraction',
      title: 'Phase 5 — Information Extraction',
      summary:
        'Content Understanding analyzers that extract structured fields from documents, forms, images, audio, and video as JSON.',
      steps: [
        {
          id: 'p5-learn-1',
          title: 'Read: Information Extraction',
          description: 'Analyzers, field definitions, input types, and the integration flow.',
          kind: 'learn',
          skills: [S7],
          targetState: 'learning',
          expectedMinutes: 20,
        },
        {
          id: 'p5-practice-1',
          title: 'Verify: Information Extraction',
          description: 'Answer practice questions until you reach at least 80% accuracy.',
          kind: 'practice',
          skills: [S7],
          questionLimit: PRACTICE_LIMIT,
          minAttempts: PRACTICE_MIN_ATTEMPTS,
          passPercent: PRACTICE_PASS_PERCENT,
          expectedMinutes: 20,
        },
      ],
    },
    {
      id: 'mock-exam',
      title: 'Phase 6 — Full Mock Exam',
      summary:
        'Simulate the real exam once the five skill areas are at 80%: 100 questions in 60 minutes, no feedback during the session.',
      steps: [
        {
          id: 'p6-exam-1',
          title: 'Take the AI-901 Mock Exam',
          description: '100 questions, 60 minutes, mixed domains and difficulties. Aim for at least 70% before retaking.',
          kind: 'exam',
          examCode: 'ai-901',
          passPercent: 70,
          expectedMinutes: 60,
        },
      ],
    },
    {
      id: 'maintenance',
      title: 'Phase 7 — Continuous Reinforcement',
      summary:
        'Keep mastered material fresh: clear due SRS reviews daily and re-run the mock exam when the maintenance queue is empty.',
      steps: [
        {
          id: 'p7-srs-1',
          title: 'Daily SRS Reviews',
          description: 'Review every card that is due today. Complete the step when no cards are due.',
          kind: 'srs',
          expectedMinutes: 10,
        },
      ],
    },
  ],
};
