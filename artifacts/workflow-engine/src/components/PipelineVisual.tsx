import { motion } from "framer-motion";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const AGENT_STEPS = [
  "Task Extraction",
  "Priority Assignment",
  "Task Assignment",
  "SLA Monitoring",
  "Bottleneck Detection",
  "Optimization Agent",
  "Audit Log Generation"
];

export function PipelineVisual({ activeStep }: { activeStep: number }) {
  return (
    <div className="flex flex-col space-y-6 bg-card/30 rounded-2xl p-6 border border-border/50">
      <h3 className="text-lg font-display font-semibold text-foreground/90 mb-2">
        Autonomous Pipeline Status
      </h3>
      <div className="relative">
        {/* Connecting Line */}
        <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-border/50 rounded-full" />
        
        {/* Animated Active Line */}
        <motion.div 
          className="absolute left-[15px] top-4 w-0.5 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"
          initial={{ height: "0%" }}
          animate={{ height: activeStep > 0 ? `${Math.min((activeStep / AGENT_STEPS.length) * 100, 100)}%` : "0%" }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />

        <div className="flex flex-col space-y-6 relative z-10">
          {AGENT_STEPS.map((step, index) => {
            const isCompleted = activeStep > index + 1;
            const isCurrent = activeStep === index + 1;
            const isPending = activeStep === 0 || activeStep < index + 1;

            return (
              <div key={step} className="flex items-center gap-4 group">
                <div className="relative flex items-center justify-center bg-background">
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="rounded-full bg-primary/20 text-primary p-0.5"
                    >
                      <CheckCircle2 className="w-6 h-6 fill-primary text-background" />
                    </motion.div>
                  ) : isCurrent ? (
                    <div className="rounded-full bg-primary/20 text-primary p-1 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  ) : (
                    <div className="rounded-full bg-muted text-muted-foreground p-1 border border-border">
                      <Circle className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <span className={cn(
                  "font-medium transition-colors duration-300 text-sm",
                  isCompleted ? "text-foreground" : isCurrent ? "text-primary shadow-primary" : "text-muted-foreground"
                )}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
