# Certification Journey — Microsoft Certification Platform

Practice platform for Microsoft certifications with a focus on optimized learning (retrieval practice, spaced review, metacognitive calibration) and exam simulation.

## Certification Journey

| Step | Exam | Status |
|---|---|---|
| 1 | **AI-901** — Microsoft Azure AI Fundamentals | Active (50 questions) |
| 2 | AI-200 | Coming soon |
| 3 | AI-103 | Coming soon |
| 4 | **AZ-305** — Azure Solutions Architect Expert | Coming soon |

Additional exams: **AZ-104** — Azure Administrator Associate (55 questions, fully active).

## Two modalities

**Learn** (today's focus — high didactic sophistication):
- **Skill Lab** — per-skill concept summaries with official Microsoft Learn links, and skill state (New / Learning / Reviewing / Mastered)
- **Practice** — filtered sessions (domain / difficulty / size) with immediate feedback, explanation of the correct answer, why each distractor fails, and confidence rating before every check
- **Confidence calibration** — the app compares what you believed (Low/Medium/High) with what happened, exposing overconfidence traps
- **Spaced Review (SRS)** — state-based scheduling (stability/difficulty, FSRS-inspired): mistakes return today, confident wins wait longer; sessions are interleaved across skills
- **Progress** — mastery map per skill, calibration panel, most common error patterns, daily streak, and an adaptive "next action" suggestion

**Simulate**:
- Timed, single-use exam per certification (AI-901: 50 questions / 60 min; AZ-104: 55 questions / 100 min)
- Server-side grading — correct answers never exposed during the exam
- Domain & difficulty breakdown, readiness classification, and "add missed questions to review queue"

## Architecture

```
app/
  page.tsx            → journey landing (`/`)
  exam/[code]/        → file-based exam flow: instructions → session → review → results
  study/[code]/       → file-based study flow: hub, practice (setup + session), learn, srs, progress
  views/              → one file per view (SRP): journey, study-hub, practice-*, learn, srs, progress, exam, results, review, instructions, shared, use-state
  api/                → route handlers: exam, study, state (progress/srs/streak), missed, migrate
lib/
  exams/              → domain: one package per certification (definition + questions + skills)
  exam.ts             → application: exam forms, study sessions, grading, bank validation (parameterized)
  srs.ts              → domain: state-based spaced repetition engine (pure)
  progress.ts         → domain: skill states, calibration, error patterns (pure)
  streak.ts           → domain: daily streak state machine (pure)
  item-quality.ts     → domain: option length-bias analysis (test-wiseness guard)
  repos/state-repo.ts → application: persistence for attempts, SRS cards, streaks (Drizzle)
  db/                 → infra: SQLite (better-sqlite3) + Drizzle schema + versioned migrations
  client/             → infra: client-id, API calls, route builders, study-filter (de)serialization,
                        exam-session hook (per-examId localStorage hydration), one-shot migration
  storage.ts          → infra: browser-side ephemeral exam session only (public form, answers,
                        flags, timer, results — all keyed by examId)
  types.ts            → domain contracts
tests/                → vitest: unit + integration (routes and repos), SQLite in-memory
```

## Routing

Navigation uses real file-based routes (`/`, `/study/[code]/*`, `/exam/[code]/*`). The exam
session (questions, answers, flags, timer) is persisted in localStorage per `examId`, so
`instructions → session → review → results` survive page transitions and hard reloads; the
practice session URL carries the selected filters and is re-fetched on mount. Route builders
and filter (de)serialization live in `lib/client/routes.ts` / `lib/client/study-query.ts`,
covered by `tests/routing.test.ts` and `tests/routes.integration.test.ts`.

## Persistence

- **Learning data lives in a real database** (SQLite via better-sqlite3 + Drizzle ORM): attempts, SRS cards, and streaks are stored server-side per anonymous `clientId`, with versioned migrations and per-exam isolation.
- Domain rules (SRS scheduling, streaks, calibration) execute **server-side** — clients only send `correct` + `confidence` + question metadata.
- The browser keeps only the ephemeral exam session (answers/timer per examId) and the anonymous `clientId`.
- **Simple and scalable**: one local file today; the repository layer is Drizzle-based, so moving to PostgreSQL is a driver swap, not a rewrite.
- One-shot migration imports legacy localStorage progress (`srs-*`, `progress-*`, `streak-*`) into the database on first load.
- Local-first with a server database: `GET /api/state` syncs progress per exam; `POST /api/state` records attempts; `POST /api/missed` enqueues missed exam questions; `POST /api/migrate` imports legacy data.

## Item quality

- Automated **option length-bias guard**: correct answers must not be inferable by length (test-wiseness). `validateQuestionBank` rejects items whose correct/distractor length ratio exceeds 1.9×; `lib/item-quality.ts` exposes the analysis and `npm run` tooling reports the full picture.

- Next.js 14 (App Router), TypeScript strict, Tailwind CSS
- Content source of truth: official Microsoft Learn Study Guides (AI-901 skills measured 04/2026)
- Local-first: all learning state persists in the browser

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

```bash
npm test      # vitest (unit + integration)
npm run lint  # eslint 9 (flat config)
npm run typecheck
```

## Testing

- **Unit** (`tests/exam.test.ts`, `tests/study.test.ts`, `tests/unit-extra.test.ts`, `tests/storage.test.ts`): bank validation against the official blueprint, exam forms, grading by item type, state-based SRS transitions, calibration, error patterns, skill states, interleaving, and localStorage persistence/legacy migration (jsdom).
- **Integration** (`tests/api.integration.test.ts`): route handlers (`/api/exam`, `/api/study`) — 404 on unknown codes, no answer leakage in public forms, case-study contiguity, full exam lifecycle (create → grade → single-use enforcement).

## Security

- `npm audit` clean (0 vulnerabilities). Next.js on the patched line (15.5.21+, including RSC DoS and rewrites SSRF fixes), React 19, patched `postcss`, `glob`, `minimatch`, `sharp`.
- Production hardened: `X-Powered-By` stripped at the nginx edge; TLS via Let's Encrypt; no Server Actions or dynamic rewrites used (both recently disclosed Next.js advisories are non-applicable to this surface).
