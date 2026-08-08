import { questionBank as az104 } from './exams/az-104/questions';
import { questionBank as ai901 } from './exams/ai-901/questions';
import type { QuestionSeed } from './types';

export interface LengthBiasReport {
  correctAvg: number;
  distractorAvg: number;
  ratio: number;
  options: { text: string; isCorrect: boolean; length: number }[];
}

export function analyzeOptionLengthBias(q: QuestionSeed): LengthBiasReport | null {
  if (q.type !== 'single' && q.type !== 'multiple') return null;
  const options = [
    ...q.correct.map(text => ({ text, isCorrect: true, length: text.length })),
    ...q.distractors.map(text => ({ text, isCorrect: false, length: text.length })),
  ];
  const correct = options.filter(o => o.isCorrect);
  const distractors = options.filter(o => !o.isCorrect);
  const correctAvg = correct.reduce((s, o) => s + o.length, 0) / correct.length;
  const distractorAvg = distractors.reduce((s, o) => s + o.length, 0) / distractors.length;
  const ratio = distractorAvg === 0 ? 0 : correctAvg / distractorAvg;
  return { correctAvg, distractorAvg: distractorAvg || 0, ratio, options };
}

export function reportLengthBias(): { code: string; stem: string; ratio: number; correctAvg: number; distractorAvg: number }[] {
  const rows: { code: string; stem: string; ratio: number; correctAvg: number; distractorAvg: number }[] = [];
  for (const [code, bank] of [['az-104', az104], ['ai-901', ai901]] as const) {
    for (const q of bank) {
      const report = analyzeOptionLengthBias(q);
      if (!report) continue;
      const min = Math.min(report.correctAvg, report.distractorAvg);
      const max = Math.max(report.correctAvg, report.distractorAvg);
      const spread = min === 0 ? 0 : max / min;
      if (spread > 1.6) {
        rows.push({
          code,
          stem: q.stem.slice(0, 70),
          ratio: report.ratio,
          correctAvg: Math.round(report.correctAvg),
          distractorAvg: Math.round(report.distractorAvg),
        });
      }
    }
  }
  return rows.sort((a, b) => Math.max(b.ratio, 1 / b.ratio) - Math.max(a.ratio, 1 / a.ratio));
}
