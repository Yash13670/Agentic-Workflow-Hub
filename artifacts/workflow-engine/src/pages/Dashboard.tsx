import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Play, Sparkles, AlertTriangle, ShieldCheck, ListTodo, Activity, Server, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PipelineVisual } from "@/components/PipelineVisual";
import { ImpactMetricsDisplay } from "@/components/ImpactMetricsDisplay";
import { useWorkflow, type Task, type Alert, type AuditEntry } from "@/hooks/use-workflow";

const DEFAULT_NOTES = `Project Phoenix Status Meeting - Q3 Sync:
- The frontend migration is delayed by 3 weeks. Sarah needs help immediately or we miss launch.
- Security audit flagged critical vulnerabilities in the auth service. Must be fixed by Friday by the core backend team.
- John is out sick, so his tasks for the Q3 report are stalled. Someone needs to take over.
- Marketing needs the new tracking pixels added before next Tuesday's campaign launch.
- Database scaling is becoming an issue, queries are slow. Needs investigation before it crashes.`;

export default function Dashboard() {
  const { runWorkflow, data, isPending, activeStep } = useWorkflow();
  const [notes, setNotes] = useState(DEFAULT_NOTES);
  const [activeTab, setActiveTab] = useState<"tasks" | "alerts" | "audit">("tasks");

  const handleRun = () => {
    if (!notes.trim() || isPending) return;
    runWorkflow(notes);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <Server className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                Agentic Workflow Engine
              </h1>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Autonomous Enterprise Orchestration
              </p>
            </div>
          </div>
          
          {data && (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary gap-1.5 py-1 hidden sm:flex">
                <Sparkles className="w-3.5 h-3.5" />
                Model Used: <span className="font-bold capitalize">{data.model_used}</span>
              </Badge>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Top Section: Input & Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Left: Input */}
          <Card className="col-span-1 lg:col-span-2 flex flex-col h-full bg-secondary/30">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <CardTitle>Raw Input Source</CardTitle>
              </div>
              <CardDescription>Paste meeting notes, emails, or slack threads here to begin autonomous processing.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isPending}
                className="w-full flex-1 min-h-[200px] p-4 rounded-xl bg-background border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono text-sm leading-relaxed"
                placeholder="Enter raw text here..."
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleRun} 
                  disabled={isPending || !notes.trim()}
                  className="w-full sm:w-auto relative group overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2 font-semibold">
                    {isPending ? "Agents Processing..." : "Run Autonomous Pipeline"}
                    {!isPending && <Play className="w-4 h-4 fill-current" />}
                  </span>
                  {/* Button Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-indigo-500 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right: Pipeline Visual */}
          <div className="col-span-1">
            <PipelineVisual activeStep={activeStep} />
          </div>
        </div>

        {/* Results Section */}
        {data && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Execution Results
            </h2>
            
            <ImpactMetricsDisplay metrics={data.impact} />

            {/* Custom Tabs */}
            <div className="bg-card/40 backdrop-blur-md rounded-2xl border border-border/50 overflow-hidden">
              <div className="flex border-b border-border/50">
                <TabButton 
                  active={activeTab === "tasks"} 
                  onClick={() => setActiveTab("tasks")}
                  icon={<ListTodo className="w-4 h-4" />}
                  label="Generated Tasks"
                  count={data.tasks.length}
                />
                <TabButton 
                  active={activeTab === "alerts"} 
                  onClick={() => setActiveTab("alerts")}
                  icon={<AlertTriangle className="w-4 h-4" />}
                  label="System Alerts"
                  count={data.alerts.length}
                  alert={data.alerts.length > 0}
                />
                <TabButton 
                  active={activeTab === "audit"} 
                  onClick={() => setActiveTab("audit")}
                  icon={<ShieldCheck className="w-4 h-4" />}
                  label="Audit Trail"
                  count={data.audit_trail.length}
                />
              </div>

              <div className="p-6 bg-background/50 min-h-[400px]">
                <AnimatePresence mode="wait">
                  {activeTab === "tasks" && <TaskList key="tasks" tasks={data.tasks} />}
                  {activeTab === "alerts" && <AlertList key="alerts" alerts={data.alerts} />}
                  {activeTab === "audit" && <AuditList key="audit" logs={data.audit_trail} />}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

// --- Subcomponents for Dashboard ---

function TabButton({ active, onClick, icon, label, count, alert }: any) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors
        ${active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80 hover:bg-white/5'}`}
    >
      {icon}
      {label}
      <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs
        ${alert ? 'bg-destructive/20 text-destructive' : 'bg-secondary text-secondary-foreground'}
      `}>
        {count}
      </span>
      {active && (
        <motion.div
          layoutId="activeTabIndicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
          initial={false}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </button>
  );
}

function TaskList({ tasks }: { tasks: Task[] }) {
  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'critical': return 'destructive';
      case 'high': return 'warning';
      case 'medium': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {tasks.map((task, i) => (
        <motion.div 
          key={task.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className="h-full flex flex-col hover:border-primary/30 transition-colors duration-300">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-2">
                <Badge variant={getPriorityColor(task.priority)} className="uppercase text-[10px]">
                  {task.priority}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">Score: {task.priorityScore}</span>
              </div>
              <CardTitle className="text-base leading-tight">{task.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-3">
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{task.description}</p>
              
              <div className="space-y-2 mt-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Assignee:</span>
                  <span className="font-medium text-foreground">{task.assignedTo}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Deadline:</span>
                  <span className="font-medium text-foreground">{task.deadline}</span>
                </div>
              </div>
            </CardContent>
            <div className="p-4 border-t border-border/50 bg-secondary/20 rounded-b-xl flex justify-between items-center">
              <Badge variant="outline" className="bg-background">
                {task.status.replace('_', ' ')}
              </Badge>
              {task.isDelayed && (
                <Badge variant="destructive" className="animate-pulse">Delayed</Badge>
              )}
            </div>
          </Card>
        </motion.div>
      ))}
      {tasks.length === 0 && (
        <div className="col-span-full py-12 text-center text-muted-foreground">
          No tasks generated.
        </div>
      )}
    </motion.div>
  );
}

function AlertList({ alerts }: { alerts: Alert[] }) {
  const getSeverityIcon = (sev: string) => {
    switch(sev) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-warning" />;
      default: return <ShieldCheck className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
      {alerts.map((alert, i) => (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card hover:bg-secondary/40 transition-colors"
        >
          <div className="mt-0.5">{getSeverityIcon(alert.severity)}</div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-medium text-foreground capitalize">{alert.type.replace('_', ' ')}</h4>
              <span className="text-xs text-muted-foreground font-mono">
                {format(new Date(alert.timestamp), "HH:mm:ss.SSS")}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{alert.message}</p>
            <div className="mt-2 text-xs font-mono text-muted-foreground/60">Target Task: {alert.taskId}</div>
          </div>
        </motion.div>
      ))}
      {alerts.length === 0 && (
        <div className="py-12 text-center flex flex-col items-center justify-center text-muted-foreground">
          <ShieldCheck className="w-12 h-12 mb-3 text-success/50" />
          <p>System operating normally. No alerts detected.</p>
        </div>
      )}
    </motion.div>
  );
}

function AuditList({ logs }: { logs: AuditEntry[] }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative pl-6">
      {/* Timeline track */}
      <div className="absolute left-[11px] top-4 bottom-4 w-px bg-border" />
      
      <div className="space-y-8">
        {logs.map((log, i) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative"
          >
            {/* Timeline dot */}
            <div className="absolute -left-[29px] top-1.5 w-3 h-3 rounded-full bg-primary/20 border-2 border-primary ring-4 ring-background" />
            
            <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs font-mono">Agent: {log.agent}</Badge>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">
                      {log.modelUsed}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-foreground text-sm">{log.action}</h4>
                </div>
                <span className="text-xs text-muted-foreground font-mono shrink-0 whitespace-nowrap">
                  {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss.SSS")}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                {log.input && (
                  <div className="bg-background rounded-lg p-3 border border-border/30">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block">Input Payload</span>
                    <pre className="text-[10px] text-muted-foreground overflow-x-auto">
                      {JSON.stringify(log.input, null, 2)}
                    </pre>
                  </div>
                )}
                {log.output && (
                  <div className="bg-background rounded-lg p-3 border border-border/30">
                    <span className="text-[10px] uppercase text-primary/70 font-bold mb-1 block">Output Decision</span>
                    <pre className="text-[10px] text-primary/80 overflow-x-auto">
                      {JSON.stringify(log.output, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
