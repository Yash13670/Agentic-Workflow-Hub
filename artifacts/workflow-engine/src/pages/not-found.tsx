import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center flex flex-col items-center max-w-md px-4">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-3">404 - System Path Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The autonomous agent could not route your request. The page you are looking for does not exist in the current workflow schema.
        </p>
        <Link href="/" className="inline-block">
          <Button>Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
