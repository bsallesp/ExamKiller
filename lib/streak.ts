export interface StreakState {
  current: number;
  best: number;
  lastActiveDay: string;
}

export const EMPTY_STREAK: StreakState = { current: 0, best: 0, lastActiveDay: '' };

export function bumpStreakState(state: StreakState, now: number): StreakState {
  const today = new Date(now).toISOString().slice(0, 10);
  if (state.lastActiveDay === today) return state;
  const yesterday = new Date(now - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const next = state.lastActiveDay === yesterday ? state.current + 1 : 1;
  return { current: next, best: Math.max(state.best, next), lastActiveDay: today };
}

export function streakDaysGap(state: StreakState, now: number): number {
  if (!state.lastActiveDay) return 0;
  const last = new Date(`${state.lastActiveDay}T00:00:00Z`).getTime();
  return Math.floor((now - last) / (24 * 60 * 60 * 1000));
}
