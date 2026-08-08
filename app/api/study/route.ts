import { NextRequest, NextResponse } from 'next/server';
import { createStudySession } from '@/lib/exam';
import { getExamDefinition } from '@/lib/exams';
import type { Difficulty } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code') ?? 'az-104';
  if (!getExamDefinition(code)) {
    return NextResponse.json({ error: `Unknown exam code: ${code}` }, { status: 404 });
  }
  const domains = searchParams.get('domains')?.split(',').filter(Boolean);
  const difficulties = searchParams.get('difficulties')?.split(',').filter(Boolean) as Difficulty[] | undefined;
  const skills = searchParams.get('skills')?.split(',').filter(Boolean);
  const conceptFamilyIds = searchParams.get('ids')?.split(',').filter(Boolean);
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Number(limitParam) : undefined;

  try {
    const questions = createStudySession(code, { domains, difficulties, skills, limit, conceptFamilyIds });
    return NextResponse.json({ questions });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to create study session' }, { status: 500 });
  }
}
