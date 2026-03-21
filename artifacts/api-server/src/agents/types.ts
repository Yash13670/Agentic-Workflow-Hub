export type Priority = "critical" | "high" | "medium" | "low";
export type TaskStatus =
  | "pending"
  | "in_progress"
  | "delayed"
  | "completed"
  | "escalated"
  | "reassigned";
export type AlertType = "sla_breach" | "bottleneck" | "escalation" | "reassignment";
export type AlertSeverity = "low" | "medium" | "high" | "critical";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
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

export interface PipelineState {
  tasks: Task[];
  alerts: Alert[];
  audit_trail: AuditEntry[];
  model_used: "lightweight" | "advanced";
  impact: ImpactMetrics;
}

export interface RawExtractedTask {
  title: string;
  description: string;
  deadline?: string;
}
