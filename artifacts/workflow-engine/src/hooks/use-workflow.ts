import { useState } from "react";

// Types derived from the OpenAPI schema specifications
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskStatus = "pending" | "in_progress" | "delayed" | "completed" | "escalated" | "reassigned";
export type AlertType = "sla_breach" | "bottleneck" | "escalation" | "reassignment";
export type AlertSeverity = "low" | "medium" | "high" | "critical";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  priorityScore: number;
  assignedTo: string;
  deadline: string;
  status: TaskStatus;
  slaHours: number;
  isDelayed: boolean;
  actionTaken: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  taskId: string;
  message: string;
  severity: AlertSeverity;
  timestamp: string;
}

export interface AuditEntry {
  id: string;
  agent: string;
  action: string;
  taskId: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  timestamp: string;
  modelUsed: string;
}

export interface ImpactMetrics {
  timeSavedHours: number;
  manualEffortReduced: number;
  slaBrechesAvoided: number;
  tasksAutoReassigned: number;
  tasksEscalated: number;
  totalTasksProcessed: number;
}

export interface WorkflowResult {
  tasks: Task[];
  alerts: Alert[];
  audit_trail: AuditEntry[];
  model_used: "lightweight" | "advanced";
  impact: ImpactMetrics;
}

export function useWorkflow() {
  const [data, setData] = useState<WorkflowResult | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);

  const runWorkflow = async (meetingNotes: string) => {
    setIsPending(true);
    setError(null);
    setData(null);
    setActiveStep(1); // Start pipeline animation

    // Simulate agent steps progressing while waiting for API
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < 7 ? prev + 1 : prev));
    }, 800);

    try {
      const res = await fetch("/api/workflow/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingNotes }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${res.status} ${res.statusText}`);
      }

      const result = await res.json();
      setData(result);
      setActiveStep(8); // Completed all steps
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setActiveStep(0); // Reset on error
    } finally {
      clearInterval(interval);
      setIsPending(false);
    }
  };

  return {
    runWorkflow,
    data,
    isPending,
    error,
    activeStep,
    clearData: () => setData(null)
  };
}
