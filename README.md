# 🤖 Autonomous Payment Incident Resolution using Agentic AI (ResilientPay)

A full-stack hackathon prototype demonstrating a multi-agent AI system that autonomously manages payment failure incidents in fintech systems — from raw incident input through detection, severity classification, assignment, SLA monitoring, self-correction, and auditability — without any human intervention.

---

## 📸 Demo

> Paste payment incident logs / alerts → Click "Run Autonomous Pipeline" → Watch 7 AI agents detect, classify, assign, monitor, resolve, and log every decision.

---

## 🏗️ Architecture Overview

```
Meeting Notes Input
        │
        ▼
┌─────────────────────────────────────────────────────┐
│              Central Orchestrator (Pipeline)         │
│                                                     │
│  [1] Incident Extraction Agent                          │
│       └─ Gemini AI (complex) / Rule-based (simple)  │
│                   │                                  │
│  [2] Severity Classification Agent                      │
│       └─ Assigns P1 / P2 based on impact  │
│                   │                                  │
│  [3] Task Assignment Agent                          │
│       └─ Workload-balanced distribution to engineers      │
│                   │                                  │
│  [4] SLA Monitoring Agent                           │
│       └─ Detects SLA breaches and at-risk incidents     │
│                   │                                  │
│  [5] Bottleneck Detection Agent                     │
│       └─ Flags overloaded engineers               │
│                   │                                  │
│  [6] Optimization Agent (Auto Rerouting/Escalation) │
│       └─ IF delayed → reassign / IF critical → escalate │
│                   │                                  │
│  [7] Audit Agent                                    │
│       └─ Logs all decisions with timestamps          │
└─────────────────────────────────────────────────────┘
        │
        ▼
  JSON Output: incidents, alerts, audit_trail, impact metrics
```

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **Autonomy** | All 7 agents run sequentially without human input |
| **Multi-Agent Collaboration** | Each agent passes structured JSON to the next |
| **Self-Correction** | Delayed incidents are auto-reassigned; critical ones escalated |
| **Auditability** | Every decision logged with agent name, input, output, timestamp |
| **Model Routing** | Short inputs → lightweight (rule-based); long inputs → Gemini AI |
| **SLA Tracking** | Deadlines monitored, at-risk incidents flagged automatically |
| **Bottleneck Detection** | Identifies overloaded engineers in real time |
| **Severity Classification** | Assigns P1 / P2 based on incident impact |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express 5, TypeScript |
| **AI** | Google Gemini 2.5 Flash (primary) + Rule-based fallback |
| **API Contract** | OpenAPI 3.1 + Orval codegen |
| **Validation** | Zod |
| **Monorepo** | pnpm workspaces |

---

## 📁 Project Structure

```
├── artifacts/
│   ├── api-server/               # Express backend
│   │   └── src/
│   │       ├── agents/
│   │       │   ├── types.ts      # Shared types (Task, Alert, AuditEntry...)
│   │       │   └── pipeline.ts   # All 7 agents + orchestrator
│   │       └── routes/
│   │           └── workflow.ts   # POST /api/workflow/run
│   └── workflow-engine/          # React frontend
│       └── src/
│           ├── pages/
│           │   └── Dashboard.tsx        # Main dashboard
│           ├── components/
│           │   ├── PipelineVisual.tsx   # Animated 7-step agent pipeline
│           │   └── ImpactMetricsDisplay.tsx
│           └── hooks/
│               └── use-workflow.ts      # API call + state management
├── lib/
│   ├── api-spec/
│   │   └── openapi.yaml          # API contract (source of truth)
│   ├── api-client-react/         # Auto-generated React Query hooks
│   └── api-zod/                  # Auto-generated Zod schemas
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

---

## 🤖 Agent Details

### Agent 1 — Incident Extraction Agent
- Parses raw payment logs or alerts into structured incident objects
- **Model routing**: if input > 300 chars or 60+ words → uses Gemini AI; else → rule-based keyword matching
- Fallback ensures reliability 

### Agent 2 — Severity Classification Agent
- Assigns severity levels:
- P1 → Critical (system-wide payment failure)
- P2 → Partial failure
- Sorts incidents by severity before processing

### Agent 3 — Task Assignment Agent
- Distributes incidents across 6 team members using workload balancing
- Always assigns to the team member with the lowest current load score

### Agent 4 — SLA Monitoring Agent
- Calculates hours remaining vs SLA window for each Incident
- **BREACHED**: SLA ≤ 24h and < 6h remaining → flags + fires alert
- **AT_RISK**: > 70% of SLA window elapsed → fires warning alert

### Agent 5 — Bottleneck Detection Agent
- Detects any team member with > 1.5× average task count, or 2+ delayed tasks
- Fires a bottleneck alert with severity rating

### Agent 6 — Optimization Agent (Self-Correction)
- **IF** delayed AND priority is `critical` → escalates to management
- **IF** delayed AND priority is lower → auto-reassigns to least-loaded available member
- Demonstrates autonomous self-correction without human input

### Agent 7 — Audit Agent
- Logs all actions:
- Agent decisions
- Inputs/outputs
- Timestamps
- Computes impact metrics: time saved, effort reduced, SLA breaches avoided

---

## 📊 Output Schema

```json
{
  "tasks": [
    {
      "id": "Incident-1",
      "title": "Fix auth service vulnerability",
      "description": "...",
      "priority": "critical",
      "priorityScore": 100,
      "assignedTo": "Alice Chen",
      "deadline": "2026-03-22T10:00:00.000Z",
      "status": "escalated",
      "slaHours": 24,
      "isDelayed": true,
      "actionTaken": "ESCALATED to management due to critical priority SLA breach"
    }
  ],
  "alerts": [
    {
      "id": "alert-1",
      "type": "sla_breach",
      "taskId": "task-1",
      "message": "SLA BREACH: critical task approaching deadline",
      "severity": "critical",
      "timestamp": "2026-03-21T10:00:00.000Z"
    }
  ],
  "audit_trail": [
    {
      "id": "audit-1",
      "agent": "Incident Extraction Agent",
      "action": "EXTRACTED Incident: \"Fix auth service vulnerability\"",
      "taskId": "task-1",
      "input": { "source": "meeting_notes" },
      "output": { "Incident": { ... } },
      "timestamp": "2026-03-21T10:00:00.000Z",
      "modelUsed": "advanced"
    }
  ],
  "model_used": "advanced",
  "impact": {
    "timeSavedHours": 17.5,
    "manualEffortReduced": 85,
    "slaBrechesAvoided": 2,
    "tasksAutoReassigned": 1,
    "tasksEscalated": 1,
    "totalTasksProcessed": 7
  }
}
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [pnpm](https://pnpm.io/installation) (`npm install -g pnpm`)
- A **Gemini API key** from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set environment variables

Create a `.env` file in `artifacts/api-server/`:

```env
PORT=8080
AI_INTEGRATIONS_GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
AI_INTEGRATIONS_GEMINI_API_KEY=your_gemini_api_key_here
```

> **Note:** The `AI_INTEGRATIONS_GEMINI_BASE_URL` and `AI_INTEGRATIONS_GEMINI_API_KEY` variables configure the Gemini AI connection. Get a free API key at [aistudio.google.com](https://aistudio.google.com/).

### 4. Run the backend

```bash
pnpm --filter @workspace/api-server run dev
```

The API server starts on `http://localhost:8080`. The workflow endpoint is available at:
```
POST http://localhost:8080/api/workflow/run
```

### 5. Run the frontend

In a separate terminal:

```bash
pnpm --filter @workspace/workflow-engine run dev
```

Open `http://localhost:5173` in your browser.

---

## 🔌 API Usage

### Run the full pipeline

```bash
curl -X POST http://localhost:8080/api/workflow/run \
  -H "Content-Type: application/json" \
  -d '{
    "meetingNotes": "We need to urgently fix the login bug - critical issue blocking all users. Sarah should deploy the hotfix asap. Bob needs to update the documentation by end of week."
  }'
```

### Health check

```bash
curl http://localhost:8080/api/healthz
```

---

## 🔄 Re-running Codegen

If you modify the OpenAPI spec (`lib/api-spec/openapi.yaml`), regenerate the client hooks and Zod schemas:

```bash
pnpm --filter @workspace/api-spec run codegen
```

---

## 📈 Impact Quantification

Based on a 7-task workflow run, the system demonstrates:

| Metric | Value |
|---|---|
| Time saved (manual task processing) | **~17.5 hours** |
| Manual effort reduced | **85%** |
| SLA breaches detected & acted upon | Automatic |
| Incidetnts auto-reassigned without human input | ✅ |
| Incidents escalated to management | ✅ |
| Human interventions required | **0** |

---

## 🏆 Hackathon Evaluation Alignment

| Criteria | Implementation |
|---|---|
| **Autonomy & Error Recovery (30%)** | 7 sequential agents, auto-reassignment, escalation, graceful AI fallback |
| **Multi-Agent Design (20%)** | 7 distinct agents, structured JSON handoffs, central orchestrator |
| **Technical Creativity (20%)** | Model routing (complex→Gemini, simple→rules), hybrid AI design |
| **Enterprise Readiness (20%)** | SLA tracking, bottleneck detection, auto-rerouting, full audit trail |
| **Impact Quantification (10%)** | Time saved, effort %, breach counts in every response |

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

---

## 📄 License

MIT

