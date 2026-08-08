"use client";

import { useState } from 'react';

export function InstructionsView({
  questionCount, durationSeconds, onBegin, onCancel,
}: {
  questionCount: number;
  durationSeconds: number;
  onBegin: () => void;
  onCancel: () => void;
}) {
  const [agreed, setAgreed] = useState(false);
  const minutes = Math.round(durationSeconds / 60);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Readiness Simulator</p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Exam Instructions</h1>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-xs text-slate-500">Questions</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{questionCount}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-xs text-slate-500">Duration</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{minutes} min</p>
          </div>
        </div>

        <ul className="mt-6 space-y-2.5 text-sm text-slate-600">
          <li className="flex gap-2"><span className="mt-0.5 text-slate-400">•</span> The timer starts when you select Begin Exam and cannot be paused.</li>
          <li className="flex gap-2"><span className="mt-0.5 text-slate-400">•</span> Your answers are saved in this browser automatically. If you refresh, the session resumes.</li>
          <li className="flex gap-2"><span className="mt-0.5 text-slate-400">•</span> Use the question grid to navigate and flag questions for review.</li>
          <li className="flex gap-2"><span className="mt-0.5 text-slate-400">•</span> No feedback is provided during the exam. Results appear after you submit.</li>
          <li className="flex gap-2"><span className="mt-0.5 text-slate-400">•</span> The exam is automatically submitted when the timer reaches zero.</li>
        </ul>

        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
          />
          <span className="text-sm text-slate-600">I have read and understand the instructions above.</span>
        </label>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={onCancel} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={onBegin}
            disabled={!agreed}
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Begin Exam
          </button>
        </div>
      </div>
    </main>
  );
}
