import { NextRequest, NextResponse } from 'next/server';
import { getExamDefinition } from '@/lib/exams';
import { getExamState, getClientState, recordAttempt } from '@/lib/repos/state-repo';
import type { AttemptPayload } from '@/lib/repos/state-repo';

export const dynamic = 'force-dynamic';

const VALID_CONFIDENCE = new Set(['low', 'medium', 'high']);
const CLIENT_ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;

function validClientId(clientId: unknown): clientId is string {
  return typeof clientId === 'string' && CLIENT_ID_RE.test(clientId);
}

function validExamCode(code: string | null): code is string {
  return !!code && !!getExamDefinition(code);
}

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId');
  if (!validClientId(clientId)) {
    return NextResponse.json({ error: 'Invalid clientId' }, { status: 400 });
  }
  const code = req.nextUrl.searchParams.get('code');
  if (code && !validExamCode(code)) {
    return NextResponse.json({ error: `Unknown exam code: ${code}` }, { status: 404 });
  }
  const state = code
    ? { [code]: getExamState(clientId, code) }
    : getClientState(clientId, ['ai-901', 'az-104', 'ai-200', 'ai-103', 'az-305']);
  return NextResponse.json({ clientId, state });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, examCode, attempt, now } = body as {
      clientId?: unknown;
      examCode?: unknown;
      attempt?: unknown;
      now?: unknown;
    };

    if (!validClientId(clientId)) return NextResponse.json({ error: 'Invalid clientId' }, { status: 400 });
    if (typeof examCode !== 'string' || !validExamCode(examCode)) {
      return NextResponse.json({ error: `Unknown exam code: ${String(examCode)}` }, { status: 404 });
    }

    const a = attempt as Partial<AttemptPayload> | undefined;
    if (!a || typeof a.conceptFamilyId !== 'string' || !a.conceptFamilyId) {
      return NextResponse.json({ error: 'Missing conceptFamilyId' }, { status: 400 });
    }
    if (typeof a.correct !== 'boolean') {
      return NextResponse.json({ error: 'Missing correct flag' }, { status: 400 });
    }
    if (typeof a.confidence !== 'string' || !VALID_CONFIDENCE.has(a.confidence)) {
      return NextResponse.json({ error: 'Invalid confidence' }, { status: 400 });
    }
    if (typeof a.skill !== 'string' || typeof a.domain !== 'string' || typeof a.difficulty !== 'string') {
      return NextResponse.json({ error: 'Missing question metadata' }, { status: 400 });
    }

    const timestamp = typeof now === 'number' && Number.isFinite(now) ? Math.floor(now) : Date.now();
    const { card, streak } = recordAttempt(clientId, examCode, a as AttemptPayload, timestamp);
    return NextResponse.json({ card, streak });
  } catch {
    return NextResponse.json({ error: 'Failed to record attempt' }, { status: 500 });
  }
}
