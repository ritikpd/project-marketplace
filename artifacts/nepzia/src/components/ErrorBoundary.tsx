import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: err instanceof Error ? err.message : String(err) };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Something went wrong</h1>
          <p className="text-muted-foreground text-sm mb-2 font-mono bg-white/5 rounded-lg px-4 py-3 border border-white/5 break-words">
            {this.state.message || "An unexpected error occurred"}
          </p>
          <p className="text-xs text-muted-foreground/60 mb-8">
            Please try refreshing the page. If the problem persists, contact support.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => this.setState({ hasError: false, message: "" })}
              variant="outline" className="border-white/10 text-white hover:bg-white/5">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={() => window.location.href = "/"}
              className="bg-primary hover:bg-primary/90 text-white">
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
