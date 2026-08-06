const PREFIX = 'az104-';

export function loadAnswers(examId: string): Record<string, string[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(`${PREFIX}answers-${examId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveAnswers(examId: string, answers: Record<string, string[]>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${PREFIX}answers-${examId}`, JSON.stringify(answers));
}

export function loadFlagged(examId: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${PREFIX}flagged-${examId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFlagged(examId: string, flagged: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${PREFIX}flagged-${examId}`, JSON.stringify(flagged));
}

export function loadTimerStart(examId: string): number | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(`${PREFIX}timer-${examId}`);
  return raw ? Number(raw) : null;
}

export function saveTimerStart(examId: string, startTime: number) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${PREFIX}timer-${examId}`, String(startTime));
}

export function clearExamData(examId: string) {
  if (typeof window === 'undefined') return;
  for (const key of ['answers', 'flagged', 'timer']) {
    localStorage.removeItem(`${PREFIX}${key}-${examId}`);
  }
}
