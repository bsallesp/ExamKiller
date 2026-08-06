# ExamKiller — AZ-104 Readiness Simulator

Practice exam for the Microsoft Azure Administrator (AZ-104) certification.

## Features

- 55 questions covering all 5 AZ-104 domains with official blueprint distribution
- 100-minute timer with auto-save to localStorage (survives refresh)
- Question navigation grid with answered / unanswered / flagged status
- Server-side grading — correct answers never exposed to the client
- Domain & difficulty breakdown with progress bars
- Readiness classification: Ready / Almost Ready / Not Ready
- Expandable question review with correct/incorrect highlighting
- 4-question case study (Contoso Ltd. migration scenario)
- Mobile-responsive with desktop sidebar + mobile drawer navigation
- All content in English

## Domain Coverage

| Domain | Questions | Weight |
|---|---|---|
| Identity and Governance | 13 | 20-25% |
| Storage | 11 | 15-20% |
| Compute | 13 | 20-25% |
| Networking | 10 | 15-20% |
| Monitoring and Recovery | 8 | 10-15% |

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- Server-side exam store (in-memory Map)
- localStorage for client-side exam persistence
