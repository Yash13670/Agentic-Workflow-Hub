# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: Gemini via Replit AI Integrations (`@workspace/integrations-gemini-ai`)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server (port 8080)
│   └── workflow-engine/    # React+Vite frontend dashboard (port 21348)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── integrations-gemini-ai/  # Gemini AI integration via Replit proxy
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Main Application: Autonomous Enterprise Workflow Engine

A full-stack multi-agent system that autonomously manages enterprise workflows.

### 7 Sequential AI Agents (Backend Pipeline)

1. **Task Extraction Agent** — Parses meeting notes into structured tasks (uses Gemini for complex input, rule-based for simple)
2. **Priority Assignment Agent** — Scores tasks (0–100) and assigns priority (critical/high/medium/low)
3. **Task Assignment Agent** — Distributes tasks to team members via workload balancing
4. **SLA Monitoring Agent** — Checks deadlines, flags at-risk/breached SLAs
5. **Bottleneck Detection Agent** — Identifies overloaded assignees
6. **Optimization Agent** — Auto-reassigns delayed tasks, escalates critical breaches to management
7. **Audit Agent** — Logs every decision with timestamps and model routing info

### API Endpoints

- `POST /api/workflow/run` — Run the full 7-agent pipeline with `{ meetingNotes: string }`
- `GET /api/healthz` — Health check

### Frontend Features

- Meeting notes textarea with sample enterprise scenario
- Pipeline visual showing agent progress (animated dots while running)
- Task cards with priority color coding (critical=red, high=orange, medium=yellow, low=green)
- Alerts tab with SLA breach / bottleneck / escalation alerts
- Audit trail timeline with JSON input/output for every decision
- Impact metrics panel (time saved, effort reduced, SLA breaches avoided)
- Model routing indicator (lightweight vs advanced)

### Agent Files

- `artifacts/api-server/src/agents/types.ts` — Type definitions
- `artifacts/api-server/src/agents/pipeline.ts` — All 7 agent implementations + orchestrator
- `artifacts/api-server/src/routes/workflow.ts` — `/api/workflow/run` route handler

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only emit `.d.ts` files during typecheck

## Root Scripts

- `pnpm run build` — typecheck + build all packages
- `pnpm run typecheck` — `tsc --build --emitDeclarationOnly`

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Contains the 7-agent pipeline in `src/agents/`.

### `artifacts/workflow-engine` (`@workspace/workflow-engine`)

React + Vite frontend dashboard. Connects to `/api/workflow/run`.

### `lib/integrations-gemini-ai` (`@workspace/integrations-gemini-ai`)

Gemini AI client via Replit AI Integrations proxy. Auto-configured via `AI_INTEGRATIONS_GEMINI_BASE_URL` and `AI_INTEGRATIONS_GEMINI_API_KEY`.
