import { ai } from "@workspace/integrations-gemini-ai";
import type {
  Task,
  Alert,
  AuditEntry,
  ImpactMetrics,
  PipelineState,
  RawExtractedTask,
  Priority,
  TaskStatus,
  AlertSeverity,
} from "./types.js";

const TEAM_MEMBERS = [
  "Alice Chen",
  "Bob Martinez",
  "Carol Smith",
  "David Lee",
  "Emma Wilson",
  "Frank Johnson",
];

const WORKLOAD_MAP: Record<string, number> = {
  "Alice Chen": 0,
  "Bob Martinez": 0,
  "Carol Smith": 0,
  "David Lee": 0,
  "Emma Wilson": 0,
  "Frank Johnson": 0,
};

let auditCounter = 0;
let alertCounter = 0;

function newAuditId(): string {
  return `audit-${++auditCounter}`;
}
function newAlertId(): string {
  return `alert-${++alertCounter}`;
}

function isComplex(text: string): boolean {
  return text.length > 300 || text.split(" ").length > 60;
}

function addAudit(
  state: PipelineState,
  agent: string,
  action: string,
  taskId: string,
  input?: Record<string, unknown>,
  output?: Record<string, unknown>
): void {
  const entry: AuditEntry = {
    id: newAuditId(),
    agent,
    action,
    taskId,
    input,
    output,
    timestamp: new Date().toISOString(),
    modelUsed: state.model_used,
  };
  state.audit_trail.push(entry);
}

function addAlert(
  state: PipelineState,
  taskId: string,
  type: Alert["type"],
  message: string,
  severity: AlertSeverity
): void {
  state.alerts.push({
    id: newAlertId(),
    type,
    taskId,
    message,
    severity,
    timestamp: new Date().toISOString(),
  });
}

async function callGemini(prompt: string, isAdvanced: boolean): Promise<string> {
  const model = isAdvanced ? "gemini-2.5-flash" : "gemini-2.5-flash";
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
      },
    });
    return response.text ?? "{}";
  } catch {
    return "{}";
  }
}

function ruleBasedExtract(meetingNotes: string): RawExtractedTask[] {
  const lines = meetingNotes.split(/[\n.]+/).map((l) => l.trim()).filter(Boolean);
  const tasks: RawExtractedTask[] = [];
  const actionKeywords = [
    "need to", "must", "should", "will", "action:", "todo:", "task:",
    "follow up", "assign", "complete", "deliver", "prepare", "review",
    "update", "create", "fix", "implement", "deploy", "schedule",
  ];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (actionKeywords.some((kw) => lower.includes(kw)) && line.length > 15) {
      tasks.push({
        title: line.slice(0, 80),
        description: line,
      });
    }
  }
  if (tasks.length === 0) {
    tasks.push(
      { title: "Review meeting outcomes", description: "Review and document meeting outcomes" },
      { title: "Follow-up actions", description: "Execute planned follow-up actions from meeting" }
    );
  }
  return tasks.slice(0, 8);
}

export async function agentTaskExtraction(
  meetingNotes: string,
  state: PipelineState
): Promise<void> {
  const advanced = isComplex(meetingNotes);
  state.model_used = advanced ? "advanced" : "lightweight";

  addAudit(state, "Task Extraction Agent", "INIT — Analyzing meeting notes", "system", {
    noteLength: meetingNotes.length,
    complexity: advanced ? "complex" : "simple",
  });

  let rawTasks: RawExtractedTask[] = [];

  if (advanced) {
    const prompt = `You are a task extraction AI. Extract ALL action items and tasks from this meeting transcript.
Return a JSON array with objects having: title (short), description (full context).
Meeting notes: ${meetingNotes}
Return ONLY valid JSON array like: [{"title":"...","description":"..."},...]`;
    const resp = await callGemini(prompt, true);
    try {
      const parsed = JSON.parse(resp);
      if (Array.isArray(parsed) && parsed.length > 0) {
        rawTasks = parsed.slice(0, 8);
      } else {
        rawTasks = ruleBasedExtract(meetingNotes);
      }
    } catch {
      rawTasks = ruleBasedExtract(meetingNotes);
    }
  } else {
    rawTasks = ruleBasedExtract(meetingNotes);
  }

  const now = new Date();
  rawTasks.forEach((rt, i) => {
    const slaHours = 24 + i * 12;
    const deadline = new Date(now.getTime() + slaHours * 3600 * 1000);
    const task: Task = {
      id: `task-${i + 1}`,
      title: rt.title,
      description: rt.description,
      priority: "medium",
      priorityScore: 0,
      assignedTo: "",
      deadline: deadline.toISOString(),
      status: "pending",
      slaHours,
      isDelayed: false,
      actionTaken: "Extracted from meeting notes",
    };
    state.tasks.push(task);
    addAudit(state, "Task Extraction Agent", `EXTRACTED task: "${task.title}"`, task.id, { source: "meeting_notes" }, { task });
  });

  addAudit(state, "Task Extraction Agent", `COMPLETE — Extracted ${rawTasks.length} tasks`, "system", {}, {
    totalTasks: rawTasks.length,
    modelUsed: state.model_used,
  });
}

export async function agentPriorityAssignment(state: PipelineState): Promise<void> {
  addAudit(state, "Priority Assignment Agent", "INIT — Scoring task priorities", "system");

  const urgencyKeywords: Record<Priority, string[]> = {
    critical: ["urgent", "asap", "critical", "immediately", "emergency", "blocker", "deadline today", "p0"],
    high: ["important", "high priority", "soon", "this week", "needed", "key", "major", "p1"],
    medium: ["medium", "normal", "standard", "review", "update", "scheduled", "p2"],
    low: ["low", "minor", "nice to have", "later", "backlog", "when possible", "p3"],
  };

  for (const task of state.tasks) {
    const text = (task.title + " " + task.description).toLowerCase();
    let score = 50;
    let priority: Priority = "medium";

    if (urgencyKeywords.critical.some((kw) => text.includes(kw))) {
      priority = "critical"; score = 95;
    } else if (urgencyKeywords.high.some((kw) => text.includes(kw))) {
      priority = "high"; score = 75;
    } else if (urgencyKeywords.low.some((kw) => text.includes(kw))) {
      priority = "low"; score = 25;
    } else {
      priority = "medium"; score = 50;
    }

    if (task.slaHours <= 24) score += 15;
    else if (task.slaHours <= 48) score += 5;

    score = Math.min(100, score);

    task.priority = priority;
    task.priorityScore = score;
    task.actionTaken = `Assigned ${priority} priority (score: ${score})`;

    addAudit(
      state,
      "Priority Assignment Agent",
      `SCORED task "${task.title}" → ${priority.toUpperCase()} (${score})`,
      task.id,
      { text: text.slice(0, 100) },
      { priority, score }
    );
  }

  state.tasks.sort((a, b) => b.priorityScore - a.priorityScore);
  addAudit(state, "Priority Assignment Agent", "COMPLETE — Tasks sorted by priority score", "system");
}

export async function agentTaskAssignment(state: PipelineState): Promise<void> {
  addAudit(state, "Task Assignment Agent", "INIT — Distributing tasks to team members", "system");

  const workload = { ...WORKLOAD_MAP };

  for (const task of state.tasks) {
    const member = Object.entries(workload).sort((a, b) => a[1] - b[1])[0][0];
    workload[member] += task.priorityScore;
    task.assignedTo = member;
    task.status = "in_progress";
    task.actionTaken = `Assigned to ${member} based on workload balancing`;

    addAudit(
      state,
      "Task Assignment Agent",
      `ASSIGNED "${task.title}" → ${member}`,
      task.id,
      { workloadBefore: workload[member] - task.priorityScore },
      { assignedTo: member, workloadAfter: workload[member] }
    );
  }

  addAudit(state, "Task Assignment Agent", "COMPLETE — All tasks distributed", "system", {}, { workload });
}

export async function agentSlaMonitoring(state: PipelineState): Promise<void> {
  addAudit(state, "SLA Monitoring Agent", "INIT — Checking SLA compliance for all tasks", "system");

  const now = new Date();

  for (const task of state.tasks) {
    const deadline = new Date(task.deadline);
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / 3600000;
    const percentElapsed = ((task.slaHours - hoursUntilDeadline) / task.slaHours) * 100;

    let slaStatus = "OK";

    if (task.slaHours <= 24 && hoursUntilDeadline < 6) {
      task.isDelayed = true;
      task.status = "delayed";
      slaStatus = "BREACHED";
      addAlert(
        state,
        task.id,
        "sla_breach",
        `SLA BREACH: "${task.title}" is critically close to deadline (${Math.round(hoursUntilDeadline)}h remaining) — assigned to ${task.assignedTo}`,
        "critical"
      );
      addAudit(
        state,
        "SLA Monitoring Agent",
        `SLA BREACH DETECTED on "${task.title}" — ${Math.round(hoursUntilDeadline)}h to deadline`,
        task.id,
        { slaHours: task.slaHours, hoursUntilDeadline },
        { status: "BREACHED", percentElapsed }
      );
    } else if (percentElapsed > 70 || (task.priority === "critical" && hoursUntilDeadline < 12)) {
      task.isDelayed = true;
      slaStatus = "AT_RISK";
      addAlert(
        state,
        task.id,
        "sla_breach",
        `SLA AT RISK: "${task.title}" is ${Math.round(percentElapsed)}% through SLA window — ${Math.round(hoursUntilDeadline)}h remaining`,
        task.priority === "critical" ? "high" : "medium"
      );
      addAudit(
        state,
        "SLA Monitoring Agent",
        `SLA AT RISK on "${task.title}" — ${Math.round(percentElapsed)}% elapsed`,
        task.id,
        { slaHours: task.slaHours, hoursUntilDeadline },
        { status: "AT_RISK", percentElapsed }
      );
    } else {
      addAudit(
        state,
        "SLA Monitoring Agent",
        `SLA OK for "${task.title}" — ${Math.round(hoursUntilDeadline)}h remaining`,
        task.id,
        {},
        { status: "OK", hoursUntilDeadline }
      );
    }

    task.actionTaken = `SLA check: ${slaStatus} (${Math.round(hoursUntilDeadline)}h remaining)`;
  }

  const breached = state.tasks.filter((t) => t.isDelayed).length;
  addAudit(state, "SLA Monitoring Agent", `COMPLETE — ${breached} tasks flagged`, "system", {}, { breached });
}

export async function agentBottleneckDetection(state: PipelineState): Promise<void> {
  addAudit(state, "Bottleneck Detection Agent", "INIT — Analyzing workload distribution", "system");

  const assigneeCounts: Record<string, number> = {};
  const assigneeDelayed: Record<string, number> = {};

  for (const task of state.tasks) {
    assigneeCounts[task.assignedTo] = (assigneeCounts[task.assignedTo] ?? 0) + 1;
    if (task.isDelayed) {
      assigneeDelayed[task.assignedTo] = (assigneeDelayed[task.assignedTo] ?? 0) + 1;
    }
  }

  const avgTasks = state.tasks.length / TEAM_MEMBERS.length;

  for (const [member, count] of Object.entries(assigneeCounts)) {
    const delayedCount = assigneeDelayed[member] ?? 0;
    const isBottleneck = count > avgTasks * 1.5 || delayedCount >= 2;

    if (isBottleneck) {
      const severity: AlertSeverity = delayedCount >= 2 ? "high" : "medium";
      addAlert(
        state,
        "system",
        "bottleneck",
        `BOTTLENECK: ${member} has ${count} tasks assigned (${delayedCount} delayed) — exceeds capacity threshold`,
        severity
      );
      addAudit(
        state,
        "Bottleneck Detection Agent",
        `BOTTLENECK detected: ${member} — ${count} tasks, ${delayedCount} delayed`,
        "system",
        { member, count, delayedCount },
        { isBottleneck: true, severity }
      );
    } else {
      addAudit(
        state,
        "Bottleneck Detection Agent",
        `OK: ${member} — ${count} tasks, within capacity`,
        "system",
        { member, count },
        { isBottleneck: false }
      );
    }
  }

  addAudit(state, "Bottleneck Detection Agent", "COMPLETE — Workload analysis done", "system");
}

export async function agentOptimization(state: PipelineState): Promise<void> {
  addAudit(state, "Optimization Agent", "INIT — Applying auto-rerouting and escalation logic", "system");

  const assigneeCounts: Record<string, number> = {};
  for (const task of state.tasks) {
    assigneeCounts[task.assignedTo] = (assigneeCounts[task.assignedTo] ?? 0) + 1;
  }

  let reassigned = 0;
  let escalated = 0;

  for (const task of state.tasks) {
    if (task.isDelayed) {
      if (task.priority === "critical") {
        const previousAssignee = task.assignedTo;
        task.status = "escalated";
        task.actionTaken = `ESCALATED to management due to critical priority SLA breach (was: ${previousAssignee})`;

        addAlert(
          state,
          task.id,
          "escalation",
          `ESCALATED: "${task.title}" — Critical task breached SLA. Notifying management. Previous owner: ${previousAssignee}`,
          "critical"
        );
        addAudit(
          state,
          "Optimization Agent",
          `ESCALATED "${task.title}" to management (was: ${previousAssignee})`,
          task.id,
          { reason: "critical_sla_breach", assignedTo: previousAssignee },
          { newStatus: "escalated", action: "management_notification" }
        );
        escalated++;
      } else {
        const overloadedAssignee = task.assignedTo;
        const available = TEAM_MEMBERS.filter(
          (m) => m !== overloadedAssignee && (assigneeCounts[m] ?? 0) < 3
        );

        if (available.length > 0) {
          const newAssignee = available.sort(
            (a, b) => (assigneeCounts[a] ?? 0) - (assigneeCounts[b] ?? 0)
          )[0];
          assigneeCounts[overloadedAssignee]--;
          assigneeCounts[newAssignee] = (assigneeCounts[newAssignee] ?? 0) + 1;
          task.assignedTo = newAssignee;
          task.status = "reassigned";
          task.isDelayed = false;
          task.actionTaken = `AUTO-REASSIGNED from ${overloadedAssignee} → ${newAssignee} (SLA recovery)`;

          addAlert(
            state,
            task.id,
            "reassignment",
            `AUTO-REASSIGNED: "${task.title}" moved from ${overloadedAssignee} → ${newAssignee} to recover SLA`,
            "medium"
          );
          addAudit(
            state,
            "Optimization Agent",
            `REASSIGNED "${task.title}": ${overloadedAssignee} → ${newAssignee}`,
            task.id,
            { from: overloadedAssignee, reason: "sla_recovery" },
            { to: newAssignee, newStatus: "reassigned" }
          );
          reassigned++;
        }
      }
    }
  }

  addAudit(state, "Optimization Agent", `COMPLETE — ${reassigned} reassigned, ${escalated} escalated`, "system", {}, {
    reassigned,
    escalated,
  });

  state.impact.tasksAutoReassigned = reassigned;
  state.impact.tasksEscalated = escalated;
}

export async function agentAudit(state: PipelineState): Promise<void> {
  const finalAuditId = newAuditId();

  const delayed = state.tasks.filter((t) => t.isDelayed || t.status === "delayed").length;
  const escalated = state.tasks.filter((t) => t.status === "escalated").length;
  const reassigned = state.tasks.filter((t) => t.status === "reassigned").length;

  state.impact.totalTasksProcessed = state.tasks.length;
  state.impact.timeSavedHours = state.tasks.length * 2.5;
  state.impact.manualEffortReduced = 85;
  state.impact.slaBrechesAvoided = state.alerts.filter(
    (a) => a.type === "sla_breach"
  ).length;

  state.audit_trail.push({
    id: `audit-${finalAuditId}`,
    agent: "Audit Agent",
    action: `FINAL REPORT — Pipeline complete. ${state.tasks.length} tasks, ${state.alerts.length} alerts, ${reassigned} reassigned, ${escalated} escalated. Estimated ${state.impact.timeSavedHours}h saved.`,
    taskId: "system",
    input: {},
    output: {
      summary: {
        totalTasks: state.tasks.length,
        totalAlerts: state.alerts.length,
        delayed,
        escalated,
        reassigned,
        model: state.model_used,
        impact: state.impact,
      },
    },
    timestamp: new Date().toISOString(),
    modelUsed: state.model_used,
  });
}

export async function runPipeline(meetingNotes: string): Promise<PipelineState> {
  auditCounter = 0;
  alertCounter = 0;

  const state: PipelineState = {
    tasks: [],
    alerts: [],
    audit_trail: [],
    model_used: "lightweight",
    impact: {
      timeSavedHours: 0,
      manualEffortReduced: 0,
      slaBrechesAvoided: 0,
      tasksAutoReassigned: 0,
      tasksEscalated: 0,
      totalTasksProcessed: 0,
    },
  };

  await agentTaskExtraction(meetingNotes, state);
  await agentPriorityAssignment(state);
  await agentTaskAssignment(state);
  await agentSlaMonitoring(state);
  await agentBottleneckDetection(state);
  await agentOptimization(state);
  await agentAudit(state);

  return state;
}
