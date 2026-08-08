"use client";

import Link from 'next/link';

export function LoadingView() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
        <p className="mt-4 text-slate-500">Loading…</p>
      </div>
    </main>
  );
}

export function NotFoundView({ message }: { message?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Not found</p>
        <h1 className="mt-2 text-xl font-bold text-slate-900">{message ?? 'This page does not exist.'}</h1>
        <Link
          href="/"
          className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Back to journey
        </Link>
      </div>
    </main>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-rose-700">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Retry
          </button>
        )}
      </div>
    </main>
  );
}
