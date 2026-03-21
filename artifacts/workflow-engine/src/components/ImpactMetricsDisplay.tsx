import { motion } from "framer-motion";
import { Clock, TrendingDown, ShieldAlert, RefreshCw, Zap, CheckSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ImpactMetrics } from "@/hooks/use-workflow";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function ImpactMetricsDisplay({ metrics }: { metrics: ImpactMetrics }) {
  const cards = [
    {
      title: "Time Saved",
      value: `${metrics.timeSavedHours}h`,
      icon: Clock,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-400/20"
    },
    {
      title: "Effort Reduced",
      value: `${metrics.manualEffortReduced}%`,
      icon: TrendingDown,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      border: "border-emerald-400/20"
    },
    {
      title: "SLA Breaches Avoided",
      value: metrics.slaBrechesAvoided,
      icon: ShieldAlert,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      border: "border-amber-400/20"
    },
    {
      title: "Auto-Reassigned",
      value: metrics.tasksAutoReassigned,
      icon: RefreshCw,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      border: "border-purple-400/20"
    },
    {
      title: "Escalations",
      value: metrics.tasksEscalated,
      icon: Zap,
      color: "text-rose-400",
      bg: "bg-rose-400/10",
      border: "border-rose-400/20"
    },
    {
      title: "Total Processed",
      value: metrics.totalTasksProcessed,
      icon: CheckSquare,
      color: "text-cyan-400",
      bg: "bg-cyan-400/10",
      border: "border-cyan-400/20"
    }
  ];

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
    >
      {cards.map((card, i) => (
        <motion.div key={i} variants={item}>
          <Card className={`p-4 h-full flex flex-col justify-between overflow-hidden relative group ${card.border} hover:bg-card/60 transition-colors`}>
            {/* Glow effect */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${card.bg}`} />
            
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-muted-foreground leading-tight">
                {card.title}
              </span>
            </div>
            <div className="text-2xl font-display font-bold text-foreground">
              {card.value}
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
