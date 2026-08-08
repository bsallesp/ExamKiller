import { NextRequest, NextResponse } from 'next/server';
import { createExam } from '@/lib/exam';
import { getExamDefinition } from '@/lib/exams';

const examStore = new Map<string, ReturnType<typeof createExam>['privateQuestions']>();

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code') ?? 'az-104';
  if (!getExamDefinition(code)) {
    return NextResponse.json({ error: `Unknown exam code: ${code}` }, { status: 404 });
  }
  try {
    const { examId, publicForm, privateQuestions } = createExam(code);
    examStore.set(examId, privateQuestions);
    return NextResponse.json(publicForm);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to create exam' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { examId, answers } = body;
    const privateQuestions = examStore.get(examId);
    if (!privateQuestions) {
      return NextResponse.json({ error: 'Exam not found or already submitted' }, { status: 404 });
    }
    examStore.delete(examId);
    const { gradeExam } = await import('@/lib/exam');
    const results = gradeExam(privateQuestions, answers);
    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to grade exam' }, { status: 500 });
  }
}
