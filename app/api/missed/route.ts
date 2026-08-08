import { NextRequest, NextResponse } from 'next/server';
import { getExamDefinition } from '@/lib/exams';
import { applyMissed } from '@/lib/repos/state-repo';

export const dynamic = 'force-dynamic';

const CLIENT_ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, examCode, conceptFamilyIds } = body as {
      clientId?: unknown;
      examCode?: unknown;
      conceptFamilyIds?: unknown;
    };

    if (typeof clientId !== 'string' || !CLIENT_ID_RE.test(clientId)) {
      return NextResponse.json({ error: 'Invalid clientId' }, { status: 400 });
    }
    if (typeof examCode !== 'string' || !getExamDefinition(examCode)) {
      return NextResponse.json({ error: `Unknown exam code: ${String(examCode)}` }, { status: 404 });
    }
    if (!Array.isArray(conceptFamilyIds) || conceptFamilyIds.some(id => typeof id !== 'string' || !id)) {
      return NextResponse.json({ error: 'Invalid conceptFamilyIds' }, { status: 400 });
    }

    const updated = applyMissed(clientId, examCode, conceptFamilyIds as string[], Date.now());
    return NextResponse.json({ updated });
  } catch {
    return NextResponse.json({ error: 'Failed to record missed questions' }, { status: 500 });
  }
}
