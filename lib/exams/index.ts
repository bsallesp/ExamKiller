import type { QuestionSeed, SkillSummary } from '../types';
import { questionBank as az104Questions } from './az-104/questions';
import { skillSummaries as az104Skills, skillDomains as az104SkillDomains } from './az-104/skills';
import { questionBank as ai901Questions } from './ai-901/questions';
import { skillSummaries as ai901Skills, skillDomains as ai901SkillDomains } from './ai-901/skills';

export interface ExamDomain {
  name: string;
  weightMin: number;
  weightMax: number;
}

export interface ExamDefinition {
  code: string;
  familyPrefix: string;
  title: string;
  certification: string;
  description: string;
  status: 'active' | 'planned';
  journeyIndex: number | null;
  questionCount: number;
  durationSeconds: number;
  domains: ExamDomain[];
}

export interface ExamPackage {
  definition: ExamDefinition;
  questions: QuestionSeed[];
  skillSummaries: Record<string, SkillSummary>;
  skillDomains: Record<string, string>;
}

const az104: ExamDefinition = {
  code: 'az-104',
  familyPrefix: 'az104',
  title: 'Azure Administrator Associate',
  certification: 'Microsoft Certified: Azure Administrator Associate',
  description: 'Manage identities and governance, storage, compute, virtual networks, and monitoring/recovery in Azure.',
  status: 'active',
  journeyIndex: null,
  questionCount: 55,
  durationSeconds: 100 * 60,
  domains: [
    { name: 'Identity and Governance', weightMin: 20, weightMax: 25 },
    { name: 'Storage', weightMin: 15, weightMax: 20 },
    { name: 'Compute', weightMin: 20, weightMax: 25 },
    { name: 'Networking', weightMin: 15, weightMax: 20 },
    { name: 'Monitoring and Recovery', weightMin: 10, weightMax: 15 },
  ],
};

const ai901: ExamDefinition = {
  code: 'ai-901',
  familyPrefix: 'ai901',
  title: 'Azure AI Fundamentals',
  certification: 'Microsoft Certified: Azure AI Fundamentals',
  description: 'Concepts of AI in Azure and hands-on implementation with Microsoft Foundry: generative apps, agents, text, speech, vision, and information extraction.',
  status: 'active',
  journeyIndex: 0,
  questionCount: 100,
  durationSeconds: 60 * 60,
  domains: [
    { name: 'Identify AI concepts and capabilities', weightMin: 40, weightMax: 45 },
    { name: 'Implement AI solutions by using Microsoft Foundry', weightMin: 55, weightMax: 60 },
  ],
};

const PLANNED: Omit<ExamDefinition, 'questionCount' | 'durationSeconds' | 'domains'>[] = [
  {
    code: 'ai-200',
    familyPrefix: 'ai200',
    title: 'AI Engineer (Journey)',
    certification: 'AI-200',
    description: 'Next step in the AI certification journey. Blueprint pending.',
    status: 'planned',
    journeyIndex: 1,
  },
  {
    code: 'ai-103',
    familyPrefix: 'ai103',
    title: 'AI Engineer (Journey)',
    certification: 'AI-103',
    description: 'Next step in the AI certification journey. Blueprint pending.',
    status: 'planned',
    journeyIndex: 2,
  },
  {
    code: 'az-305',
    familyPrefix: 'az305',
    title: 'Azure Solutions Architect Expert',
    certification: 'Microsoft Certified: Azure Solutions Architect Expert',
    description: 'Final step of the journey: architecting Azure solutions. Blueprint pending.',
    status: 'planned',
    journeyIndex: 3,
  },
];

export const EXAM_JOURNEY = ['ai-901', 'ai-200', 'ai-103', 'az-305'];
export const EXTRA_EXAMS = ['az-104'];

const definitions: Record<string, ExamDefinition> = {
  'az-104': az104,
  'ai-901': ai901,
  ...Object.fromEntries(PLANNED.map(p => [p.code, { ...p, questionCount: 0, durationSeconds: 0, domains: [] }])),
};

const packages: Record<string, ExamPackage> = {
  'az-104': {
    definition: az104,
    questions: az104Questions,
    skillSummaries: az104Skills,
    skillDomains: az104SkillDomains,
  },
  'ai-901': {
    definition: ai901,
    questions: ai901Questions,
    skillSummaries: ai901Skills,
    skillDomains: ai901SkillDomains,
  },
};

export function getExamDefinition(code: string): ExamDefinition | undefined {
  return definitions[code];
}

export function getExamPackage(code: string): ExamPackage | undefined {
  return packages[code];
}

export function listJourneyDefinitions(): ExamDefinition[] {
  return EXAM_JOURNEY.map(code => definitions[code]).filter(Boolean);
}

export function listExtraDefinitions(): ExamDefinition[] {
  return EXTRA_EXAMS.map(code => definitions[code]).filter(Boolean);
}
