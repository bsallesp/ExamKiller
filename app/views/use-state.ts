"use client";

import { useCallback, useEffect, useState } from 'react';
import { fetchState } from '@/lib/client/api';
import type { ExamStateDto, AllStateDto } from '@/lib/client/api';

export interface ExamStateResult {
  state: ExamStateDto | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useExamState(code: string): ExamStateResult {
  const [state, setState] = useState<ExamStateDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchState(code)
      .then(data => setState(data as ExamStateDto))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load state'))
      .finally(() => setLoading(false));
  }, [code]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { state, loading, error, refresh };
}

export interface AllStateResult {
  state: AllStateDto | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAllState(): AllStateResult {
  const [state, setState] = useState<AllStateDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchState()
      .then(data => setState(data as AllStateDto))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load state'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { state, loading, error, refresh };
}
