import { NextRequest, NextResponse } from 'next/server';
import { createExam, gradeExam } from '@/lib/exam';
import type { FormQuestion, AnswerSubmission } from '@/lib/types';

const examStore = new Map<string, FormQuestion[]>();

export async function GET() {
  try {
    const { examId, publicForm, privateQuestions } = createExam();
    examStore.set(examId, privateQuestions);
    return NextResponse.json(publicForm);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create exam' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AnswerSubmission = await request.json();
    const formQuestions = examStore.get(body.examId);

    if (!formQuestions) {
      return NextResponse.json(
        { error: 'Exam not found or already submitted. Please start a new exam.' },
        { status: 404 }
      );
    }

    examStore.delete(body.examId);
    const results = gradeExam(formQuestions, body.answers);
    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to grade exam' },
      { status: 500 }
    );
  }
}
